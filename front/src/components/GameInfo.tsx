import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { formatScore } from "../utils/tetris";
import "./GameInfo.css";
import { validateGameMode } from "../utils/gameMode";

function NextPiecePreview({
	nextPieces,
}: {
	nextPieces: { shape: number[][] }[];
}) {
	const rawGameMode = sessionStorage.getItem("selectedGameMode") || "normal";
	const gameMode = validateGameMode(rawGameMode);

	// Hide preview in no-preview mode
	if (gameMode === "no-preview") {
		return (
			<div className="next-piece-preview">
				<h4>Next</h4>
				<div
					className="next-piece"
					style={{ padding: "20px", textAlign: "center", color: "#666" }}
				>
					???
				</div>
			</div>
		);
	}

	const next = nextPieces[0];
	// if (!next) return null;
	if (!next)
		return (
			<div className="next-piece-preview">
				<h4>Next</h4>
				<div
					className="next-piece"
					style={{ padding: "20px", textAlign: "center", color: "#666" }}
				>
					???
				</div>
			</div>
		);
	return (
		<div className="next-piece-preview">
			<h4>Next</h4>
			<div className="next-piece">
				{next.shape.map((row: number[], y: number) => (
					<div key={y} style={{ display: "flex" }}>
						{row.map((cell: number, x: number) => (
							<div
								key={`${x}-${cell}`}
								style={{
									width: 16,
									height: 16,
									background: cell ? "#888" : "transparent",
									border: cell ? "1px solid #333" : "1px solid transparent",
								}}
							/>
						))}
					</div>
				))}
			</div>
		</div>
	);
}

export default function GameInfo() {
	const { score, linesCleared, level, opponents, status, nextPieces } =
		useSelector((state: RootState) => state.game);

	console.log("GameInfo Redux state:", {
		nextPiecesLength: nextPieces?.length,
		nextPieces: nextPieces,
		firstPiece: nextPieces?.[0],
	});

	// Use nextPieces from the game state instead of trying to get it from gamers
	const displayNextPieces = nextPieces || [];

	return (
		<div className="game-info">
			<div className="player-stats">
				<h3>Your Stats</h3>
				<p>Score: {formatScore(score)}</p>
				<p>Lines: {linesCleared}</p>
				<p>Level: {level}</p>
				<p>Status: {status}</p>
			</div>
			<NextPiecePreview nextPieces={displayNextPieces} />

			{opponents.length > 0 && (
				<div className="opponents-section">
					<h3>Opponents</h3>
					{opponents.map((opponent) => (
						<div key={opponent.name} className="opponent-card">
							<h4>{opponent.name}</h4>
							<p>Score: {formatScore(opponent.score)}</p>
							<p>Lines: {opponent.linesCleared}</p>

							<div className="mini-board">
								{opponent.board.map((row, y) =>
									row.map((cell, x) => (
										<div
											key={`cell-${y}-${x}-${cell}`}
											className={`mini-cell ${cell !== 0 ? "filled" : "empty"}`}
										/>
									)),
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
