import React from 'react';
import { PIECE_SYMBOLS } from '../constants/pieceData';
import '../styles/ChessPiece.css';

const ChessPiece = ({ piece, position, onDragStart }) => {
  if (!piece) return null;
  
  const pieceKey = `${piece.color}-${piece.type}`;
  
  const handleDragStart = (e) => {
    onDragStart(position, piece);
    // Set drag image to be transparent (optional)
    const dragIcon = document.createElement('div');
    dragIcon.style.opacity = '0';
    document.body.appendChild(dragIcon);
    e.dataTransfer.setDragImage(dragIcon, 0, 0);
    document.body.removeChild(dragIcon);
  };
  
  return (
    <div 
      className={`chess-piece ${piece.color}`}
      draggable={true}
      onDragStart={handleDragStart}
    >
      {PIECE_SYMBOLS[pieceKey]}
    </div>
  );
};

export default ChessPiece;
