import { 
  calculatePawnMoves,
  calculateRookMoves,
  calculateKnightMoves, 
  calculateBishopMoves,
  calculateQueenMoves,
  calculateKingMoves
} from './moveCalculator';
import { PIECE_TYPES } from '../constants/pieceData';

// Find the position of the king for a given color
export const findKing = (board, color) => {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === PIECE_TYPES.KING && piece.color === color) {
        return { row, col };
      }
    }
  }
  return null;
};

// Check if a specific square is under attack by any opponent pieces
export const isSquareUnderAttack = (row, col, attackerColor, board) => {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      
      // Skip empty squares and pieces of the non-attacking color
      if (!piece || piece.color !== attackerColor) continue;
      
      // Calculate moves for this piece
      let moves = [];
      switch (piece.type) {
        case PIECE_TYPES.PAWN:
          moves = calculatePawnAttacks(r, c, piece, board);
          break;
        case PIECE_TYPES.ROOK:
          moves = calculateRookMoves(r, c, piece, board);
          break;
        case PIECE_TYPES.KNIGHT:
          moves = calculateKnightMoves(r, c, piece, board);
          break;
        case PIECE_TYPES.BISHOP:
          moves = calculateBishopMoves(r, c, piece, board);
          break;
        case PIECE_TYPES.QUEEN:
          moves = calculateQueenMoves(r, c, piece, board);
          break;
        case PIECE_TYPES.KING:
          moves = calculateKingMoves(r, c, piece, board);
          break;
        default:
          break;
      }
      
      // Check if any of the possible moves target the specified square
      if (moves.some(move => move.row === row && move.col === col)) {
        return true;
      }
    }
  }
  return false;
};

// Special function for pawn attacks (different from pawn moves)
const calculatePawnAttacks = (row, col, piece, board) => {
  const attacks = [];
  const direction = piece.color === 'white' ? -1 : 1;
  
  // Diagonal capture positions
  for (const captureCol of [col - 1, col + 1]) {
    const newRow = row + direction;
    if (newRow >= 0 && newRow < 8 && captureCol >= 0 && captureCol < 8) {
      attacks.push({ row: newRow, col: captureCol });
    }
  }
  
  return attacks;
};

// Check if a pawn can be promoted (has reached the opposite end of the board)
export const canPromotePawn = (piece, row) => {
  if (piece.type !== PIECE_TYPES.PAWN) return false;
  
  // Pawn has reached the last rank
  return (piece.color === 'white' && row === 0) || (piece.color === 'black' && row === 7);
};

// Promote a pawn to a specified piece type
export const promotePawn = (board, row, col, newPieceType) => {
  const pawn = board[row][col];
  
  // Ensure we're working with a pawn
  if (!pawn || pawn.type !== PIECE_TYPES.PAWN) {
    return false;
  }
  
  // Check if the pawn is in a valid promotion position
  if (!canPromotePawn(pawn, row)) {
    return false;
  }
  
  // Check if the requested promotion piece type is valid
  const validPromotionTypes = [
    PIECE_TYPES.QUEEN, 
    PIECE_TYPES.ROOK, 
    PIECE_TYPES.BISHOP, 
    PIECE_TYPES.KNIGHT
  ];
  
  if (!validPromotionTypes.includes(newPieceType)) {
    return false;
  }
  
  // Perform the promotion
  board[row][col] = {
    ...pawn,
    type: newPieceType,
  };
  
  return true;
};

// Determine if a player is in check
export const isInCheck = (color, board) => {
  const kingPosition = findKing(board, color);
  if (!kingPosition) return false;
  
  const opponentColor = color === 'white' ? 'black' : 'white';
  return isSquareUnderAttack(kingPosition.row, kingPosition.col, opponentColor, board);
};

// Simulate a move including potential pawn promotion and check if it results in check
export const wouldBeInCheckAfterMove = (fromRow, fromCol, toRow, toCol, board, color, promotionPiece = null) => {
  // If the first parameter is an object (board) and the second and third are coordinates, adjust parameters
  let actualBoard = board;
  let actualFromRow = fromRow;
  let actualFromCol = fromCol;
  let actualToRow = toRow;
  let actualToCol = toCol;
  let actualColor = color;
  
  // Handle case where board is passed as first argument and from/to are passed as objects
  if (Array.isArray(fromRow) && typeof fromCol === 'object' && typeof toRow === 'object') {
    actualBoard = fromRow;
    actualFromRow = fromCol.row;
    actualFromCol = fromCol.col;
    actualToRow = toRow.row;
    actualToCol = toRow.col;
    actualColor = toCol;
    promotionPiece = color;
  }
  
  const boardCopy = JSON.parse(JSON.stringify(actualBoard));
  const movingPiece = boardCopy[actualFromRow][actualFromCol];
  
  // Handle en passant capture
  if (movingPiece.type === PIECE_TYPES.PAWN && 
      actualFromCol !== actualToCol && 
      !boardCopy[actualToRow][actualToCol]) {
    boardCopy[actualFromRow][actualToCol] = null; // Remove captured pawn
  }

  boardCopy[actualToRow][actualToCol] = movingPiece;
  boardCopy[actualFromRow][actualFromCol] = null;
  
  // Handle promotion if applicable
  if (promotionPiece && 
      movingPiece.type === PIECE_TYPES.PAWN && 
      canPromotePawn(movingPiece, actualToRow)) {
    boardCopy[actualToRow][actualToCol] = {
      ...movingPiece,
      type: promotionPiece
    };
  }
  
  // Check if this results in check
  const inCheck = isInCheck(actualColor, boardCopy);
  
  return inCheck;
};

// Filter moves to only include legal moves (that don't result in check)
export const getLegalMoves = (row, col, piece, board, allMoves) => {
  return allMoves.filter(move => 
    !wouldBeInCheckAfterMove(row, col, move.row, move.col, board, piece.color)
  );
};

// Determine if a player is in checkmate
export const isInCheckmate = (color, board) => {
  // First check if the player is in check
  if (!isInCheck(color, board)) {
    return false;
  }
  
  // Check if any legal move exists for any piece of this color
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      
      // Skip empty squares and opponent's pieces
      if (!piece || piece.color !== color) continue;
      
      let possibleMoves = [];
      switch (piece.type) {
        case PIECE_TYPES.PAWN:
          possibleMoves = calculatePawnMoves(row, col, piece, board);
          break;
        case PIECE_TYPES.ROOK:
          possibleMoves = calculateRookMoves(row, col, piece, board);
          break;
        case PIECE_TYPES.KNIGHT:
          possibleMoves = calculateKnightMoves(row, col, piece, board);
          break;
        case PIECE_TYPES.BISHOP:
          possibleMoves = calculateBishopMoves(row, col, piece, board);
          break;
        case PIECE_TYPES.QUEEN:
          possibleMoves = calculateQueenMoves(row, col, piece, board);
          break;
        case PIECE_TYPES.KING:
          possibleMoves = calculateKingMoves(row, col, piece, board);
          break;
        default:
          break;
      }
      
      // Filter to only legal moves
      const legalMoves = getLegalMoves(row, col, piece, board, possibleMoves);
      
      // If any legal move exists, it's not checkmate
      if (legalMoves.length > 0) {
        return false;
      }
    }
  }
  
  // If no legal moves were found, it's checkmate
  return true;
};

// Determine if the game has reached stalemate
export const isInStalemate = (color, board) => {
  // If the player is in check, it's not stalemate
  if (isInCheck(color, board)) {
    return false;
  }
  
  // Check if any legal move exists for any piece of this color
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      
      // Skip empty squares and opponent's pieces
      if (!piece || piece.color !== color) continue;
      
      let possibleMoves = [];
      switch (piece.type) {
        case PIECE_TYPES.PAWN:
          possibleMoves = calculatePawnMoves(row, col, piece, board);
          break;
        case PIECE_TYPES.ROOK:
          possibleMoves = calculateRookMoves(row, col, piece, board);
          break;
        case PIECE_TYPES.KNIGHT:
          possibleMoves = calculateKnightMoves(row, col, piece, board);
          break;
        case PIECE_TYPES.BISHOP:
          possibleMoves = calculateBishopMoves(row, col, piece, board);
          break;
        case PIECE_TYPES.QUEEN:
          possibleMoves = calculateQueenMoves(row, col, piece, board);
          break;
        case PIECE_TYPES.KING:
          possibleMoves = calculateKingMoves(row, col, piece, board);
          break;
        default:
          break;
      }
      
      // Filter to only legal moves
      const legalMoves = getLegalMoves(row, col, piece, board, possibleMoves);
      
      // If any legal move exists, it's not stalemate
      if (legalMoves.length > 0) {
        return false;
      }
    }
  }
  
  // If no legal moves were found, it's stalemate
  return true;
};
