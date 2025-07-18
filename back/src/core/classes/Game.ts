import { Player } from "./Player.js";
import { Piece } from "./Piece.js";
import { Cell, InputDTO, TetrisPiece } from "../types/game.js";
import { getLogger } from "../utils/Logger.js";
import { clearLines } from "../utils/tetris.js";
import MyWebSocket from "../socket/websocket.js";

export class Game {
  public room: string;
  public players: Player[];
  public pieces: Piece[];
  public currentPieceIndex: number;
  public isRunning: boolean;
  public isSolo: boolean;
  private logger = getLogger("Game");

  constructor(room: string, playerNames: string[]) {
    this.room = room;
    this.players = playerNames.map((name) => new Player(name));
    this.pieces = Piece.generatePieceSequence(1000);
    this.currentPieceIndex = 0;
    this.isRunning = false;
    this.isSolo = playerNames.length === 1;

    this.logger.info(`Created new Game for room ${room} with ${playerNames.length} players`);
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

  public getPlayer(name: string): Player | undefined {
    return this.players.find((player) => player.name === name);
  }

  public setPlayerReady(playerName: string): boolean {
    const player = this.getPlayer(playerName);
    if (player) {
      player.setReady();
      this.logger.info(`Player ${playerName} is ready`);
      return this.areAllPlayersReady();
    }
    return false;
  }

  public areAllPlayersReady(): boolean {
    return this.players.every((player) => player.isReady);
  }

  public updatePlayerInput(playerName: string, input: InputDTO): void {
    const player = this.getPlayer(playerName);
    if (player) {
      player.updateInput(input);
    }
  }

  public processPlayerActions(): void {
    this.players.forEach((player) => {
      this.processGravity();
      this.processPlayerActions();
    });
  }

  private lockPiece(player: Player): void {
    if (!player.currentPiece) return;

    const piece = this.tetrisPieceToPiece(player.currentPiece);

    const newBoard = piece.mergeIntoBoard(player.grid);
    player.updateGrid(newBoard);

    const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard);
    player.updateGrid(clearedBoard);
    player.addLinesCleared(linesCleared);

    const points = linesCleared * 100 + (linesCleared >= 4 ? 400 : 0);
    player.addScore(points);

    this.logger.info(`${player.name}: Locked piece, cleared ${linesCleared} lines, scored ${points} points`);

    if (linesCleared > 1 && !this.isSolo) {
      this.sendPenaltyLines(player, linesCleared - 1);
    }


    if (player.isGameOver()) {
      this.logger.info(`Game over for ${player.name}!`);
      const io = MyWebSocket.getInstance();
      io.to(this.room).emit("game:over", { playerName: player.name });
      this.stop();
      return;
    }

    this.giveNextPiece(player);
  }

  private sendPenaltyLines(sender: Player, lineCount: number): void {
    const penaltyLines = Array.from({ length: lineCount }, () => Array(10).fill(1));

    this.players.forEach((player) => {
      if (player.name !== sender.name) {
        const newGrid = penaltyLines.concat(player.grid.slice(0, 20 - penaltyLines.length));
        player.updateGrid(newGrid);
        this.logger.info(`Sent ${lineCount} penalty lines to ${player.name}`);
      }
    });
  }

  public giveNextPiece(player: Player): void {
    if (this.currentPieceIndex >= this.pieces.length - 20) {
      this.pieces.push(...Piece.generatePieceSequence(100));
      this.logger.info("Generated more pieces for game continuation");
    }

    const nextPiece = this.pieces[player.currentPieceIndex];
    if (nextPiece) {
      const pieceForPlayer = this.pieceToTetrisPiece(nextPiece);

      player.setPiece(pieceForPlayer, player.currentPieceIndex);
      player.currentPieceIndex++;
      player.forcedFall = false;

      this.logger.info(`Gave ${player.name} piece #${this.currentPieceIndex - 1} (${nextPiece.type})`);
    }
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

  private pieceToTetrisPiece(piece: Piece): TetrisPiece {
    return {
      type: piece.type,
      shape: piece.shape,
      x: piece.x,
      y: piece.y,
      color: piece.color,
      rotation: piece.rotation,
    };
  }

  public getGameState(): any {
    return {
      room: this.room,
      isRunning: this.isRunning,
      isSolo: this.isSolo,
      currentPieceIndex: this.currentPieceIndex,
      pieceSequenceLength: this.pieces.length,
      gamers: this.players.map((player) => ({
        ...player.getState(),
        nextPieces: this.pieces.slice(player.currentPieceIndex, player.currentPieceIndex + 5).map((p) => this.pieceToTetrisPiece(p)),
      })),
    
    };
  }

  public getNextPiecesForPlayer(player: Player, count: number = 5): Piece[] {
    const startIndex = player.currentPieceIndex + 1;
    return this.pieces.slice(startIndex, startIndex + count);
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

  public processGravity(): void {
    const LOCK_DELAY_TICKS = 1;
    const MAX_LOCK_RESETS = 3;

    this.players.forEach((player) => {
      if (!player.currentPiece || !this.isRunning) return;

      let piece = this.tetrisPieceToPiece(player.currentPiece);

      if (!player.input.down && !player.forcedFall && piece.canMoveDown(player.grid)) {
        piece = piece.move(0, 1);
        player.lockDelayCounter = 0;
        player.isTouchingGround = false;
        player.lockMoveResets = 0;
      } else {
        if (!player.isTouchingGround) {
          player.isTouchingGround = true;
          player.lockDelayCounter = 0;
          player.lockMoveResets = 0;
        } else {
          player.lockDelayCounter++;
        }
      }

      player.currentPiece = this.pieceToTetrisPiece(piece);

      if (player.isTouchingGround && (player.lockDelayCounter >= LOCK_DELAY_TICKS || player.lockMoveResets >= MAX_LOCK_RESETS)) {
        this.lockPiece(player);
        player.lockDelayCounter = 0;
        player.isTouchingGround = false;
        player.lockMoveResets = 0;
      }
    });
  }
}
