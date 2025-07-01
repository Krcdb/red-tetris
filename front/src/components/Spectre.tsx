import React from "react";

interface SpectreProps {
  playerName: string;
  spectreData: number[];
  boardHeight?: number;
}

const Spectre: React.FC<SpectreProps> = ({
  playerName,
  spectreData,
  boardHeight = 20,
}) => {
  const cellSize = 6;
  const width = spectreData.length;

  return (
    <div
      style={{
        border: "1px solid #666",
        padding: "6px",
        margin: "4px",
        backgroundColor: "#111",
        borderRadius: "3px",
        minWidth: "80px",
      }}
    >
      <div
        style={{
          color: "#fff",
          fontSize: "11px",
          marginBottom: "4px",
          textAlign: "center",
          fontWeight: "bold",
        }}
      >
        {playerName}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${width}, 1fr)`,
          gap: "1px",
          backgroundColor: "#333",
          padding: "2px",
        }}
      >
        {spectreData.map((topRow, col) => {
          const filledHeight = topRow < boardHeight ? boardHeight - topRow : 0;

          return (
            <div
              key={col}
              style={{
                width: `${cellSize}px`,
                height: `${boardHeight * 2}px`,
                backgroundColor: "#222",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  width: "100%",
                  height: `${(filledHeight / boardHeight) * 100}%`,
                  backgroundColor: filledHeight > 0 ? "#ff6b6b" : "transparent",
                  transition: "height 0.1s ease",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Spectre;
