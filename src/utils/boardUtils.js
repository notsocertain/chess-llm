import { PIECE_COLORS } from '../constants/pieceData';

// Function to initialize a new chess board with pieces in starting positions
export const initializeBoard = () => {
  // Create empty 8x8 board
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Set up pawns
  for (let col = 0; col < 8; col++) {
    board[1][col] = { type: 'pawn', color: PIECE_COLORS.BLACK };
    board[6][col] = { type: 'pawn', color: PIECE_COLORS.WHITE };
  }
  
  // Set up back rows
  setBackRow(board, 0, PIECE_COLORS.BLACK);
  setBackRow(board, 7, PIECE_COLORS.WHITE);
  
  return board;
};

// Helper function to set up the back row pieces
const setBackRow = (board, row, color) => {
  const pieceOrder = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  
  for (let col = 0; col < 8; col++) {
    board[row][col] = { type: pieceOrder[col], color, hasMoved: false };
  }
};

// Utility function to determine if a position is valid on the board
export const isValidPosition = (row, col) => {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
};

// Utility function to get a string representation of a position
export const positionToString = (row, col) => {
  const files = 'abcdefgh';
  const ranks = '87654321';
  return files[col] + ranks[row];
};
