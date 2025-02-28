import { PIECE_TYPES } from '../constants/pieceData';
import { canPromotePawn, promotePawn } from './checkDetection';

// Array of pieces that a pawn can be promoted to
export const promotionPieces = [
  PIECE_TYPES.QUEEN,
  PIECE_TYPES.ROOK,
  PIECE_TYPES.BISHOP,
  PIECE_TYPES.KNIGHT
];

// Handle the pawn promotion process
export const handlePawnPromotion = (board, row, col, selectedPromotion) => {
  const piece = board[row][col];
  
  if (!piece || !canPromotePawn(piece, row)) {
    return false;
  }
  
  return promotePawn(board, row, col, selectedPromotion);
};

// Check if a move would result in a pawn promotion
export const isPromotionMove = (fromRow, fromCol, toRow, board) => {
  const piece = board[fromRow][fromCol];
  if (!piece || piece.type !== PIECE_TYPES.PAWN) return false;
  
  // For white pawns, check if they're moving to row 0
  if (piece.color === 'white' && toRow === 0) return true;
  
  // For black pawns, check if they're moving to row 7
  if (piece.color === 'black' && toRow === 7) return true;
  
  return false;
};

// Default promotion selection (usually queen)
export const getDefaultPromotion = () => PIECE_TYPES.QUEEN;
