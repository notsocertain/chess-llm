import { isValidPosition } from './boardUtils';

// Calculate possible moves for a pawn
export const calculatePawnMoves = (row, col, piece, board, enPassantTarget = null) => {
  const moves = [];
  const direction = piece.color === 'white' ? -1 : 1;
  const startRow = piece.color === 'white' ? 6 : 1;
  
  // Forward movement (one square)
  if (isValidPosition(row + direction, col) && !board[row + direction][col]) {
    moves.push({ row: row + direction, col });
    
    // Initial two-square move
    if (row === startRow && !board[row + 2 * direction][col]) {
      moves.push({ row: row + 2 * direction, col });
    }
  }
  
  // Regular captures and en passant
  for (const captureCol of [col - 1, col + 1]) {
    if (isValidPosition(row + direction, captureCol)) {
      // Normal capture
      if (board[row + direction][captureCol] && 
          board[row + direction][captureCol].color !== piece.color) {
        moves.push({ row: row + direction, col: captureCol });
      }
      // En passant capture
      else if (enPassantTarget && 
               row === (piece.color === 'white' ? 3 : 4) && // Correct rank for en passant
               captureCol === enPassantTarget.pawnPosition.col && // Target pawn's column
               piece.color !== enPassantTarget.color) { // Must be opposite color
        moves.push({ 
          row: row + direction, 
          col: captureCol,
          isEnPassant: true,
          capturedPawnPosition: enPassantTarget.pawnPosition
        });
      }
    }
  }
  
  return moves;
};

// Calculate possible moves for a rook
export const calculateRookMoves = (row, col, piece, board) => {
  const moves = [];
  const directions = [
    { row: -1, col: 0 },  // up
    { row: 1, col: 0 },   // down
    { row: 0, col: -1 },  // left
    { row: 0, col: 1 }    // right
  ];
  
  for (const dir of directions) {
    let newRow = row + dir.row;
    let newCol = col + dir.col;
    
    while (isValidPosition(newRow, newCol)) {
      if (!board[newRow][newCol]) {
        // Empty square
        moves.push({ row: newRow, col: newCol });
      } else if (board[newRow][newCol].color !== piece.color) {
        // Capture opponent's piece
        moves.push({ row: newRow, col: newCol });
        break;
      } else {
        // Own piece blocking
        break;
      }
      
      newRow += dir.row;
      newCol += dir.col;
    }
  }
  
  return moves;
};

// Calculate possible moves for a knight
export const calculateKnightMoves = (row, col, piece, board) => {
  const moves = [];
  const knightMoves = [
    { row: -2, col: -1 }, { row: -2, col: 1 },
    { row: -1, col: -2 }, { row: -1, col: 2 },
    { row: 1, col: -2 }, { row: 1, col: 2 },
    { row: 2, col: -1 }, { row: 2, col: 1 }
  ];
  
  for (const move of knightMoves) {
    const newRow = row + move.row;
    const newCol = col + move.col;
    
    if (isValidPosition(newRow, newCol)) {
      if (!board[newRow][newCol] || board[newRow][newCol].color !== piece.color) {
        moves.push({ row: newRow, col: newCol });
      }
    }
  }
  
  return moves;
};

// Calculate possible moves for a bishop
export const calculateBishopMoves = (row, col, piece, board) => {
  const moves = [];
  const directions = [
    { row: -1, col: -1 },  // up-left
    { row: -1, col: 1 },   // up-right
    { row: 1, col: -1 },   // down-left
    { row: 1, col: 1 }     // down-right
  ];
  
  for (const dir of directions) {
    let newRow = row + dir.row;
    let newCol = col + dir.col;
    
    while (isValidPosition(newRow, newCol)) {
      if (!board[newRow][newCol]) {
        // Empty square
        moves.push({ row: newRow, col: newCol });
      } else if (board[newRow][newCol].color !== piece.color) {
        // Capture opponent's piece
        moves.push({ row: newRow, col: newCol });
        break;
      } else {
        // Own piece blocking
        break;
      }
      
      newRow += dir.row;
      newCol += dir.col;
    }
  }
  
  return moves;
};

// Calculate possible moves for a queen
export const calculateQueenMoves = (row, col, piece, board) => {
  // Queen combines rook and bishop movements
  return [
    ...calculateRookMoves(row, col, piece, board),
    ...calculateBishopMoves(row, col, piece, board)
  ];
};

// Calculate possible moves for a king
export const calculateKingMoves = (row, col, piece, board) => {
  const moves = [];
  const directions = [
    { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
    { row: 0, col: -1 }, { row: 0, col: 1 },
    { row: 1, col: -1 }, { row: 1, col: 0 }, { row: 1, col: 1 }
  ];
  
  // Regular king moves
  for (const dir of directions) {
    const newRow = row + dir.row;
    const newCol = col + dir.col;
    
    if (isValidPosition(newRow, newCol)) {
      if (!board[newRow][newCol] || board[newRow][newCol].color !== piece.color) {
        moves.push({ row: newRow, col: newCol });
      }
    }
  }

  // Castling moves
  if (!piece.hasMoved) {
    const backRow = piece.color === 'white' ? 7 : 0;
    
    // Kingside castling
    if (board[backRow][7]?.type === 'rook' && 
        !board[backRow][7].hasMoved && 
        !board[backRow][6] && 
        !board[backRow][5]) {
      moves.push({ 
        row: backRow, 
        col: 6, 
        isCastling: true,
        rookMove: {
          from: { row: backRow, col: 7 },
          to: { row: backRow, col: 5 }
        }
      });
    }

    // Queenside castling
    if (board[backRow][0]?.type === 'rook' && 
        !board[backRow][0].hasMoved && 
        !board[backRow][1] && 
        !board[backRow][2] && 
        !board[backRow][3]) {
      moves.push({ 
        row: backRow, 
        col: 2, 
        isCastling: true,
        rookMove: {
          from: { row: backRow, col: 0 },
          to: { row: backRow, col: 3 }
        }
      });
    }
  }
  
  return moves;
};