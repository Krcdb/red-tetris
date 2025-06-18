import React from "react";
import { useSelector } from "react-redux";
import { Navigate, useParams } from "react-router-dom";
import { RootState } from "../redux/store";
import Board from "../components/Board";

const GameRoute: React.FC = () => {
  const status = useSelector((s: RootState) => s.game.status);
  const { room, playerName } = useParams<{
    room: string;
    playerName: string;
  }>();

  if (status !== "playing") {
    return <Navigate to={`/${room}/${playerName}`} replace />;
  }

  return <Board />;
};

export default GameRoute;
