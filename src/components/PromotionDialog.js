import React from 'react';

const PromotionDialog = ({ color, onSelect, onClose }) => {
  const pieces = ['queen', 'rook', 'bishop', 'knight'];

  return (
    <div className="promotion-dialog">
      <div className="promotion-options">
        {pieces.map(piece => (
          <button
            key={piece}
            className="promotion-piece"
            onClick={() => onSelect(piece)}
          >
            {/* You can use piece images or unicode chess symbols here */}
            {piece}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PromotionDialog;
