import React, { useState } from 'react';
import ChessBoard from './ChessBoard';
import GameOverModal from './GameOverModal';
import MoveHistory from './MoveHistory';
import { PIECE_COLORS } from '../constants/pieceData';
import '../styles/Game.css';

const Game = () => {
  const [currentPlayer, setCurrentPlayer] = useState(PIECE_COLORS.WHITE);
  const [moveHistory, setMoveHistory] = useState([]);
  const [isGameOver, setIsGameOver] = useState(false);  // Renamed to avoid the warning
  const [gameResult, setGameResult] = useState(null);
  const [winner, setWinner] = useState(null);
  const [playerColor, setPlayerColor] = useState(PIECE_COLORS.WHITE);
  const [showNewGameModal, setShowNewGameModal] = useState(true);

  const handleMove = (move) => {
    // Add the move to history
    setMoveHistory([...moveHistory, move]);
    
    // Switch to the next player
    setCurrentPlayer(currentPlayer === PIECE_COLORS.WHITE ? PIECE_COLORS.BLACK : PIECE_COLORS.WHITE);
  };

  const handleGameOver = (result, winningColor) => {
    setIsGameOver(true);  // Use the renamed variable
    setGameResult(result);
    setWinner(winningColor);
  };

  const handleColorSelect = (color) => {
    setPlayerColor(color);
    setCurrentPlayer(PIECE_COLORS.WHITE); // Always start with white
    setShowNewGameModal(false);
    
    // If player chooses black, trigger AI to make the first move (as white)
    if (color === PIECE_COLORS.BLACK) {
      // Game starts with white, so the current player is already white
      // The ChessBoard will handle the AI move in its useEffect
    }
  };

  const restartGame = () => {
    setCurrentPlayer(PIECE_COLORS.WHITE);
    setMoveHistory([]);
    setIsGameOver(false);  // Use the renamed variable
    setGameResult(null);
    setWinner(null);
    setShowNewGameModal(true);
  };

  return (
    <div className="chess-game">
      <div className="game-info">
        <div className="player-turn">
          Current turn: <span className={currentPlayer}>{currentPlayer}</span>
          <div className="player-info">
  <span className={playerColor} style={{ fontStyle: 'italic', fontWeight: 'normal' }}>Player: {playerColor}</span>
</div>
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
          playerColor={playerColor}
        />

        <MoveHistory moves={moveHistory} />
      </div>
      
      <GameOverModal 
        isOpen={isGameOver || showNewGameModal}  // Use the renamed variable
        gameResult={gameResult}
        winner={winner}
        onRestart={restartGame}
        onSelectColor={handleColorSelect}
      />
    </div>
  );
};

export default Game;
