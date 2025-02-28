import React from 'react';
import '../styles/GameOverModal.css';

const GameOverModal = ({ isOpen, gameResult, winner, onRestart }) => {
  if (!isOpen) return null;

  let resultMessage = '';
  if (gameResult === 'checkmate') {
    resultMessage = `Checkmate! ${winner === 'white' ? 'White' : 'Black'} wins!`;
  } else if (gameResult === 'stalemate') {
    resultMessage = 'Stalemate! The game is a draw.';
  } else if (gameResult === 'draw') {
    resultMessage = 'Draw!';
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="game-over-title">Game Over</h2>
        <p className="result-message">{resultMessage}</p>
        {winner && (
          <div className={`winner-indicator ${winner}`}>
            {winner.charAt(0).toUpperCase() + winner.slice(1)}
          </div>
        )}
        <button className="restart-button" onClick={onRestart}>
          Play Again
        </button>
      </div>
    </div>
  );
};

export default GameOverModal;
