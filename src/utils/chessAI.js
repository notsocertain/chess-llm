/**
 * Chess AI utility functions
 * Simple chess AI that evaluates board positions and determines best moves
 */

// Piece values for evaluation
const PIECE_VALUES = {
  pawn: 100,
  knight: 320,
  bishop: 330,
  rook: 500,
  queen: 900,
  king: 20000
};

// Position bonuses for different pieces (simplified)
const POSITION_BONUSES = {
  // Pawns are better in the center and advanced positions
  pawn: [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5, -5,-10,  0,  0,-10, -5,  5],
    [5, 10, 10,-20,-20, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0]
  ],
  // Knights are better in the center
  knight: [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
  ],
  // Bishops are better on diagonals
  bishop: [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20]
  ],
  // Rooks are better on open files
  rook: [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [5, 10, 10, 10, 10, 10, 10,  5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [0,  0,  0,  5,  5,  0,  0,  0]
  ],
  // Queens combine mobility values
  queen: [
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [-5,   0,  5,  5,  5,  5,  0, -5],
    [0,    0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  0,-10],
    [-10,  0,  5,  0,  0,  0,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20]
  ],
  // Kings are better with castling and protection
  king: [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [20,  20,   0,   0,   0,   0,  20, 20],
    [20,  30,  10,   0,   0,  10,  30, 20]
  ]
};

/**
 * Evaluates the current board position
 * Higher score favors white, lower score favors black
 */
const evaluateBoard = (board) => {
  let score = 0;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) continue;
      
      // Base piece value
      const pieceValue = PIECE_VALUES[piece.type.toLowerCase()] || 0;
      
      // Add position bonus
      const positionBonus = POSITION_BONUSES[piece.type.toLowerCase()] ?
        POSITION_BONUSES[piece.type.toLowerCase()][piece.color === 'white' ? row : 7 - row][col] : 0;
      
      // Add or subtract based on piece color
      if (piece.color === 'white') {
        score += pieceValue + positionBonus;
      } else {
        score -= pieceValue + positionBonus;
      }
    }
  }
  
  return score;
};

/**
 * Simulates a move on the board and evaluates the resulting position
 */
const evaluateMove = (board, move) => {
  // Create a deep copy of the board
  const newBoard = JSON.parse(JSON.stringify(board));
  
  // Get the piece and make the move
  const piece = newBoard[move.from.row][move.from.col];
  const capturedPiece = newBoard[move.to.row][move.to.col];
  
  // Make the move
  newBoard[move.to.row][move.to.col] = piece;
  newBoard[move.from.row][move.from.col] = null;
  
  // Evaluate the resulting position
  const score = evaluateBoard(newBoard);
  
  return {
    move,
    score,
    capturesValue: capturedPiece ? PIECE_VALUES[capturedPiece.type.toLowerCase()] || 0 : 0
  };
};

/**
 * Gets the best move from a list of possible moves
 */
export const getBestMove = (board, possibleMoves) => {
  if (!possibleMoves.length) return null;
  
  // Evaluate each move
  const evaluatedMoves = possibleMoves.map(move => evaluateMove(board, move));
  
  // Sort moves based on evaluation score (ascending for black, descending for white)
  evaluatedMoves.sort((a, b) => {
    const currentColor = possibleMoves[0].piece.color;
    return currentColor === 'white' ? b.score - a.score : a.score - b.score;
  });
  
  // Add some randomness for variety (choose from top 3 moves if available)
  const topMoveCount = Math.min(3, evaluatedMoves.length);
  const randomIndex = Math.floor(Math.random() * topMoveCount);
  
  return evaluatedMoves[randomIndex].move;
};

// Fix: Create an object before exporting as default
const chessAI = {
  getBestMove,
  evaluateBoard,
  // Add any other exported functions here
};

export {  evaluateBoard };
export default chessAI;
