import React, { useState } from 'react';
import ChessBoard from './ChessBoard';
import GameOverModal from './GameOverModal';
import MoveHistory from './MoveHistory';
import { PIECE_COLORS } from '../constants/pieceData';
import '../styles/Game.css';

const Game = () => {
  const [currentPlayer, setCurrentPlayer] = useState(PIECE_COLORS.WHITE);
  const [moveHistory, setMoveHistory] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [winner, setWinner] = useState(null);

  const handleMove = (move) => {
    // Add the move to history
    setMoveHistory([...moveHistory, move]);
    
    // Switch to the next player
    setCurrentPlayer(currentPlayer === PIECE_COLORS.WHITE ? PIECE_COLORS.BLACK : PIECE_COLORS.WHITE);
  };

  const handleGameOver = (result, winningColor) => {
    setGameOver(true);
    setGameResult(result);
    setWinner(winningColor);
  };

  const restartGame = () => {
    setCurrentPlayer(PIECE_COLORS.WHITE);
    setMoveHistory([]);
    setGameOver(false);
    setGameResult(null);
    setWinner(null);
  };

  return (
    <div className="chess-game">
      <div className="game-info">
        <div className="player-turn">
          Current turn: <span className={currentPlayer}>{currentPlayer}</span>
        </div>
        <button className="restart-game-button" onClick={restartGame}>
          New Game
        </button>
      </div>
      
      <div className="game-container">
        <ChessBoard 
          currentPlayer={currentPlayer} 
          onMove={handleMove} 
          moveHistory={moveHistory}
          onGameOver={handleGameOver}
        />

        <MoveHistory moves={moveHistory} />
      </div>
      
      <GameOverModal 
        isOpen={gameOver} 
        gameResult={gameResult} 
        winner={winner}
        onRestart={restartGame} 
      />
    </div>
  );
};

export default Game;
