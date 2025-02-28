import React from 'react';
import '../styles/Square.css';

const Square = ({ isLight, piece, isSelected, isValidMove, isCheck, onClick }) => {
  // Determine square class based on properties
  const squareClass = `square ${isLight ? 'light' : 'dark'} 
    ${isSelected ? 'selected' : ''} 
    ${isValidMove ? 'valid-move' : ''}
    ${isCheck ? 'check' : ''}`;

  return (
    <div className={squareClass} onClick={onClick}>
      {piece && (
        <div className="piece">
          {/* Display piece - this can be replaced with images later */}
          <span className={`piece-icon ${piece.color}`}>
            {getPieceSymbol(piece.type)}
          </span>
        </div>
      )}
    </div>
  );
};

// Helper function to get Unicode chess symbols
function getPieceSymbol(pieceType) {
  switch (pieceType.toLowerCase()) {
    case 'pawn':
      return '♟';
    case 'knight':
      return '♞';
    case 'bishop':
      return '♝';
    case 'rook':
      return '♜';
    case 'queen':
      return '♛';
    case 'king':
      return '♚';
    default:
      return '';
  }
}

export default Square;
