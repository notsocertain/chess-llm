import React from 'react';
import { PIECE_COLORS } from '../constants/pieceData';
import '../styles/GameOverModal.css';

const GameOverModal = ({ isOpen, gameResult, winner, onRestart, onSelectColor }) => {
  if (!isOpen) return null;

  let message = '';
  if (gameResult === 'checkmate') {
    message = `Checkmate! ${winner === PIECE_COLORS.WHITE ? 'White' : 'Black'} wins.`;
  } else if (gameResult === 'stalemate') {
    message = 'Stalemate! The game is a draw.';
  } else if (gameResult === 'draw') {
    message = 'Draw agreed.';
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{gameResult ? 'Game Over' : 'New Game'}</h2>

        {gameResult ? (
          <p className="result-message">{message}</p>
        ) : (
          <div className="color-selection">
            <p>Choose your color:</p>
            <div className="button-group">
              <button 
                className="color-button white-button" 
                onClick={() => onSelectColor(PIECE_COLORS.WHITE)}
              >
                Play as White
              </button>
              <button 
                className="color-button black-button" 
                onClick={() => onSelectColor(PIECE_COLORS.BLACK)}
              >
                Play as Black
              </button>
            </div>
          </div>
        )}

        {gameResult && (
          <button className="restart-button" onClick={onRestart}>
            New Game
          </button>
        )}
      </div>
    </div>
  );
};

export default GameOverModal;
