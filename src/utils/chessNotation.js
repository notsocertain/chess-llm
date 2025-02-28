/**
 * Converts a move to standard algebraic notation (SAN)
 * 
 * @param {Object} move - The move object containing piece and position information
 * @param {boolean} isCapture - Whether this move captures a piece
 * @param {boolean} isCheck - Whether this move puts the opponent in check
 * @param {boolean} isCheckmate - Whether this move is a checkmate
 * @returns {string} The move in algebraic notation
 */
export const moveToAlgebraicNotation = (move, isCapture = false, isCheck = false, isCheckmate = false) => {
  const { piece, from, to } = move;
  
  // Get piece letter (K for King, Q for Queen, R for Rook, B for Bishop, N for Knight, empty for Pawn)
  const pieceLetters = {
    'king': 'K',
    'queen': 'Q',
    'rook': 'R',
    'bishop': 'B',
    'knight': 'N',
    'pawn': ''
  };
  
  const pieceSymbol = pieceLetters[piece.type.toLowerCase()];
  
  // Convert numeric coordinates to algebraic notation (e.g., [0,0] -> "a8")
  const fileLetters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  
  // Convert row/col to algebraic notation
//   const fromSquare = `${fileLetters[from.col]}${8 - from.row}`;
  const toSquare = `${fileLetters[to.col]}${8 - to.row}`;
  
  // Special moves
  if (move.isCastling) {
    if (to.col === 6) return 'O-O'; // Kingside castling
    if (to.col === 2) return 'O-O-O'; // Queenside castling
  }
  
  // Build notation
  let notation = '';
  
  // Add piece letter (except for pawns)
  notation += pieceSymbol;
  
  // For captures
  if (isCapture) {
    // For pawn captures, include the starting file
    if (piece.type.toLowerCase() === 'pawn') {
      notation += fileLetters[from.col];
    }
    notation += 'x';
  }
  
  // Destination square
  notation += toSquare;
  
  // Pawn promotion
  if (move.promotion) {
    notation += `=${pieceLetters[move.promotion.toLowerCase()]}`;
  }
  
  // Check and checkmate
  if (isCheckmate) {
    notation += '#';
  } else if (isCheck) {
    notation += '+';
  }
  
  return notation;
};

/**
 * Converts coordinates [row,col] to algebraic notation (e.g., [0,0] -> "a8")
 */
export const coordsToSquare = (row, col) => {
  const fileLetters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  return `${fileLetters[col]}${8 - row}`;
};
