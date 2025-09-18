import MyWebSocket from "../socket/websocket.js";
import type { InputDTO, TetrisPiece } from "../types/game.js";
import { getLogger } from "../utils/Logger.js";
import { clearLines } from "../utils/tetris.js";
import { Piece } from "./Piece.js";
import { Player } from "./Player.js";

export class Game {
	public currentPieceIndex: number;
	public gameMode: string;
	public isRunning: boolean;
	public isSolo: boolean;
	public pieces: Piece[];
	public players: Player[];
	public room: string;
	private logger = getLogger("Game");

	constructor(room: string, playerNames: string[], gameMode = "normal") {
		this.room = room;
		this.gameMode = gameMode;
		this.players = playerNames.map((name) => new Player(name));
		this.pieces = Piece.generatePieceSequence(1000);
		this.currentPieceIndex = 0;
		this.isRunning = false;
		this.isSolo = playerNames.length === 1 || room.startsWith("solo-");

		// 🔍 Add detailed logging
		console.log(`🎯 GAME CONSTRUCTOR DEBUG:`);
		console.log(`  - Room: ${room}`);
		console.log(`  - GameMode parameter: "${gameMode}"`);
		console.log(`  - Final this.gameMode: "${this.gameMode}"`);
		console.log(`  - Players: ${playerNames.join(", ")}`);
		console.log(`  - Is Solo: ${String(this.isSolo)}`);

		this.logger.info(
			`Created new Game for room ${room} with ${String(playerNames.length)} players, mode: ${gameMode}, solo: ${String(this.isSolo)}`,
		);
	}

	public areAllPlayersReady(): boolean {
		const readyCount = this.players.filter((p) => p.isReady).length;
		const totalCount = this.players.length;
		const allReady = this.players.every((player) => player.isReady);

		this.logger.info(
			`Ready check: ${String(readyCount)}/${String(totalCount)} players ready, all ready: ${String(allReady)}`,
		);
		this.logger.info(
			`Player ready states: ${this.players
				.map((p) => `${p.name}:${String(p.isReady)}`)
				.join(", ")}`,
		);

		return allReady;
	}

	public getGameState(): {
		currentPieceIndex: number;
		gamers: {
			grid: number[][];
			linesCleared: number;
			name: string;
			nextPieces: TetrisPiece[];
			score: number;
		}[];
		isRunning: boolean;
		isSolo: boolean;
		pieceSequenceLength: number;
		room: string;
	} {
		return {
			currentPieceIndex: this.currentPieceIndex,
			gamers: this.players.map((player) => ({
				...player.getState(),
				nextPieces: this.pieces
					.slice(player.currentPieceIndex, player.currentPieceIndex + 5)
					.map((p) => this.pieceToTetrisPiece(p)),
			})),
			isRunning: this.isRunning,
			isSolo: this.isSolo,
			pieceSequenceLength: this.pieces.length,
			room: this.room,
		};
	}

	public getNextPiecesForPlayer(player: Player, count = 5): Piece[] {
		const startIndex = player.currentPieceIndex + 1;
		return this.pieces.slice(startIndex, startIndex + count);
	}

	public getPlayer(name: string): Player | undefined {
		return this.players.find((player) => player.name === name);
	}

	public giveNextPiece(player: Player): void {
		if (player.hasLost) return;
		if (this.currentPieceIndex >= this.pieces.length - 20) {
			this.pieces.push(...Piece.generatePieceSequence(100));
			this.logger.info("Generated more pieces for game continuation");
		}

		const nextPiece = this.pieces[player.currentPieceIndex];
		if (nextPiece) {
			const pieceForPlayer = this.pieceToTetrisPiece(nextPiece);

			// 🔍 Check if the spawn position is valid
			const testPiece = this.tetrisPieceToPiece(pieceForPlayer);
			if (!testPiece.isValidPosition(player.grid)) {
				this.handlePlayerLoss(player);
				this.logger.info(`Game over for ${player.name}! Piece cannot spawn.`);
				return;
			}

			player.setPiece(pieceForPlayer, player.currentPieceIndex);
			player.currentPieceIndex++;
			player.forcedFall = false;

			this.logger.info(
				`Gave ${player.name} piece #${this.currentPieceIndex - 1} (${nextPiece.type})`,
			);
		}
	}

	public processGravity(): void {
		const LOCK_DELAY_TICKS = 1;
		const MAX_LOCK_RESETS = 3;

		this.players.forEach((player) => {
			if (!player.currentPiece || !this.isRunning) return;

			let piece = this.tetrisPieceToPiece(player.currentPiece);

			if (
				!player.input.down &&
				!player.forcedFall &&
				piece.canMoveDown(player.grid)
			) {
				piece = piece.move(0, 1);
				player.lockDelayCounter = 0;
				player.isTouchingGround = false;
				player.lockMoveResets = 0;
				//console.log(`  - ✅ Moved down to (${piece.x}, ${piece.y})`);
			} else {
				if (!player.isTouchingGround) {
					player.isTouchingGround = true;
					player.lockDelayCounter = 0;
					player.lockMoveResets = 0;
					//console.log(`  - 🎯 Now touching ground`);
				} else {
					player.lockDelayCounter++;
					/*console.log(
            `  - ⏰ Lock delay: ${player.lockDelayCounter}/${LOCK_DELAY_TICKS}`
          );*/
				}
			}

			player.currentPiece = this.pieceToTetrisPiece(piece);

			// Lock the piece if lock delay has expired
			if (
				player.isTouchingGround &&
				(player.lockDelayCounter >= LOCK_DELAY_TICKS ||
					player.lockMoveResets >= MAX_LOCK_RESETS)
			) {
				/*console.log(
          `  - 🔒 Locking piece after ${player.lockDelayCounter} ticks`
        );*/
				this.lockPiece(player);
				player.lockDelayCounter = 0;
				player.isTouchingGround = false;
				player.lockMoveResets = 0;
				return;
			}
		});
	}

	public processPlayerActions(): void {
		this.players
			.filter((p) => !p.hasLost)
			.forEach(() => {
				this.processGravity();
				this.processPlayerActions();
			});
	}

	public processPlayerInputsOnly(): void {
		this.players.forEach((player) => {
			if (!player.currentPiece || !this.isRunning) return;

			let piece = this.tetrisPieceToPiece(player.currentPiece);
			let hasMoved = false;

			if (player.input.up && !player.input.upHasBeenCounted) {
				const rotatedPiece = piece.rotateWallKick(player.grid);
				if (rotatedPiece !== piece) {
					piece = rotatedPiece;
					hasMoved = true;
				}
				player.input.upHasBeenCounted = true;
			}

			if (player.input.left && !player.forcedFall) {
				const leftPiece = piece.move(-1, 0);
				if (leftPiece.isValidPosition(player.grid)) {
					piece = leftPiece;
					hasMoved = true;
				}
			}

			if (player.input.right && !player.forcedFall) {
				const rightPiece = piece.move(1, 0);
				if (rightPiece.isValidPosition(player.grid)) {
					piece = rightPiece;
					hasMoved = true;
				}
			}

			if (player.input.down && !player.forcedFall) {
				const downPiece = piece.move(0, 1);
				if (downPiece.isValidPosition(player.grid)) {
					piece = downPiece;
					hasMoved = true;
					player.lockDelayCounter = 0;
					player.isTouchingGround = false;
					player.lockMoveResets = 0;
				}
			}

			if (player.input.space && !player.input.spaceHasBeenCounted) {
				piece = piece.hardDrop(player.grid);
				player.input.spaceHasBeenCounted = true;
				player.forcedFall = true;
				hasMoved = true;
			}

			player.currentPiece = this.pieceToTetrisPiece(piece);

			if (hasMoved && player.isTouchingGround && player.lockMoveResets < 15) {
				player.lockDelayCounter = 0;
				player.lockMoveResets++;
			} else if (hasMoved) {
				player.lockDelayCounter = 0;
				player.isTouchingGround = false;
				player.lockMoveResets = 0;
			}
		});
	}

	public setPlayerReady(playerName: string): boolean {
		const player = this.getPlayer(playerName);
		if (!player) {
			this.logger.warn(`Player ${playerName} not found in game ${this.room}`);
			return false;
		}

		if (this.isRunning) {
			this.logger.warn(
				`Game ${this.room} already running, ignoring ready from ${playerName}`,
			);
			return true; // Ignore but don’t error out
		}

		if (player.isReady) {
			this.logger.info(`Player ${playerName} is already ready`);
			return this.areAllPlayersReady();
		}

		player.setReady();
		const readyCount = this.players.filter((p) => p.isReady).length;
		const totalCount = this.players.length;

		this.logger.info(
			`Player ${playerName} is ready. Ready players: ${String(readyCount)}/${String(totalCount)}`,
		);

		const allReady = this.areAllPlayersReady();
		this.logger.info(`All players ready check result: ${String(allReady)}`);

		return allReady;
	}

	public start(): void {
		this.logger.info(`Starting game in room ${this.room}`);

		this.players.forEach((player) => {
			this.giveNextPiece(player);
		});

		this.isRunning = true;
	}

	public stop(): void {
		this.logger.info(`Stopping game in room ${this.room}`);
		this.isRunning = false;
	}

	public updatePlayerInput(playerName: string, input: InputDTO): void {
		const player = this.getPlayer(playerName);
		if (player) {
			player.updateInput(input);
		}
	}

	private handlePlayerLoss(player: Player) {
		this.logger.debug(
			`One player has lost check has lost ${String(player.hasLost)}`,
		);
		player.setHasLost();
		this.logger.debug(
			`One player has lost check has lost ${String(player.hasLost)}`,
		);
		const io = MyWebSocket.getInstance();
		if (this.isSolo) {
			this.logger.debug("Solo game over");
			io.to(this.room).emit("game:over", { playerName: player.name });
			this.stop();
			return;
		}

		const activePlayers = this.players.filter((p) => !p.hasLost);
		this.logger.info(
			`Active players remaining: ${String(activePlayers.length)}`,
		);

		if (activePlayers.length <= 1) {
			this.logger.info(
				`Game ending. Winner: ${activePlayers[0]?.name ?? "None"}`,
			);
			io.to(this.room).emit("game:over", { playerName: player.name });
			this.stop();
		}
	}

	private lockPiece(player: Player): void {
		if (!player.currentPiece) return;

		const piece = this.tetrisPieceToPiece(player.currentPiece);

		/*console.log(`🔒 LOCK PIECE DEBUG:`);
    console.log(`  - Player: ${player.name}`);
    console.log(`  - Piece type: ${piece.type}`);
    console.log(`  - Piece position: (${piece.x}, ${piece.y})`);
    console.log(`  - Is valid position: ${piece.isValidPosition(player.grid)}`);*/

		if (!piece.isValidPosition(player.grid)) {
			this.handlePlayerLoss(player);
			this.logger.info(`Game over for ${player.name}! Piece cannot be placed.`);
			return;
		}

		const newBoard = piece.mergeIntoBoard(player.grid);
		player.updateGrid(newBoard);

		const { linesCleared, newBoard: clearedBoard } = clearLines(newBoard);
		player.updateGrid(clearedBoard);
		player.addLinesCleared(linesCleared);

		const points = linesCleared * 100 + (linesCleared >= 4 ? 400 : 0);
		player.addScore(points);

		this.logger.info(
			`${player.name}: Locked piece, cleared ${linesCleared.toString()} lines, scored ${points.toString()} points`,
		);

		if (linesCleared > 1 && !this.isSolo) {
			this.sendPenaltyLines(player, linesCleared - 1);
		}

		if (player.isGameOver()) {
			this.handlePlayerLoss(player);
			this.logger.info(`Game over for ${player.name}! Piece cannot be placed.`);
			return;
		}

		this.giveNextPiece(player);
	}

	private pieceToTetrisPiece(piece: Piece): TetrisPiece {
		return {
			color: piece.color,
			rotation: piece.rotation,
			shape: piece.shape,
			type: piece.type,
			x: piece.x,
			y: piece.y,
		};
	}

	private sendPenaltyLines(sender: Player, lineCount: number): void {
		const penaltyLines = Array.from({ length: lineCount }, () =>
			Array<number>(10).fill(1),
		);

		this.players.forEach((player) => {
			if (player.name !== sender.name) {
				const newGrid = penaltyLines.concat(
					player.grid.slice(0, 20 - penaltyLines.length),
				);
				player.updateGrid(newGrid);
				this.logger.info(
					`Sent ${lineCount.toString()} penalty lines to ${player.name}`,
				);
			}
		});
	}

	private tetrisPieceToPiece(tetrisPiece: TetrisPiece): Piece {
		if (!tetrisPiece.type) {
			throw new Error("TetrisPiece type is required");
		}
		const piece = new Piece(tetrisPiece.type, tetrisPiece.x, tetrisPiece.y);
		piece.shape = tetrisPiece.shape;
		piece.color = tetrisPiece.color ?? 0;
		piece.rotation = tetrisPiece.rotation ?? 0;
		return piece;
	}
}
