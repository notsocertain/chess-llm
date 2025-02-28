import React from 'react';
import ChessPiece from './ChessPiece';
import '../styles/ChessSquare.css';

const ChessSquare = ({ color, position, piece, onDragStart, onDrop }) => {
  const handleDragOver = (e) => {
    // Allow drop
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    onDrop(position);
  };

  return (
    <div 
      className={`chess-square ${color}`}
      data-row={position.row}
      data-col={position.col}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {piece && (
        <ChessPiece 
          piece={piece} 
          position={position} 
          onDragStart={onDragStart} 
        />
      )}
    </div>
  );
};

export default ChessSquare;
