export const PIECE_COLORS = {
  WHITE: 'white',
  BLACK: 'black'
};

export const PIECE_TYPES = {
  PAWN: 'pawn',
  ROOK: 'rook',
  KNIGHT: 'knight',
  BISHOP: 'bishop',
  QUEEN: 'queen',
  KING: 'king'
};

// Unicode chess symbols
export const PIECE_SYMBOLS = {
  [`${PIECE_COLORS.WHITE}-${PIECE_TYPES.KING}`]: '♔',
  [`${PIECE_COLORS.WHITE}-${PIECE_TYPES.QUEEN}`]: '♕',
  [`${PIECE_COLORS.WHITE}-${PIECE_TYPES.ROOK}`]: '♖',
  [`${PIECE_COLORS.WHITE}-${PIECE_TYPES.BISHOP}`]: '♗',
  [`${PIECE_COLORS.WHITE}-${PIECE_TYPES.KNIGHT}`]: '♘',
  [`${PIECE_COLORS.WHITE}-${PIECE_TYPES.PAWN}`]: '♙',
  [`${PIECE_COLORS.BLACK}-${PIECE_TYPES.KING}`]: '♚',
  [`${PIECE_COLORS.BLACK}-${PIECE_TYPES.QUEEN}`]: '♛',
  [`${PIECE_COLORS.BLACK}-${PIECE_TYPES.ROOK}`]: '♜',
  [`${PIECE_COLORS.BLACK}-${PIECE_TYPES.BISHOP}`]: '♝',
  [`${PIECE_COLORS.BLACK}-${PIECE_TYPES.KNIGHT}`]: '♞',
  [`${PIECE_COLORS.BLACK}-${PIECE_TYPES.PAWN}`]: '♟'
};

// Generate initial board position
export const getInitialBoardPosition = () => {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Set pawns
  for (let col = 0; col < 8; col++) {
    board[1][col] = { type: PIECE_TYPES.PAWN, color: PIECE_COLORS.BLACK };
    board[6][col] = { type: PIECE_TYPES.PAWN, color: PIECE_COLORS.WHITE };
  }
  
  // Set rooks
  board[0][0] = { type: PIECE_TYPES.ROOK, color: PIECE_COLORS.BLACK };
  board[0][7] = { type: PIECE_TYPES.ROOK, color: PIECE_COLORS.BLACK };
  board[7][0] = { type: PIECE_TYPES.ROOK, color: PIECE_COLORS.WHITE };
  board[7][7] = { type: PIECE_TYPES.ROOK, color: PIECE_COLORS.WHITE };
  
  // Set knights
  board[0][1] = { type: PIECE_TYPES.KNIGHT, color: PIECE_COLORS.BLACK };
  board[0][6] = { type: PIECE_TYPES.KNIGHT, color: PIECE_COLORS.BLACK };
  board[7][1] = { type: PIECE_TYPES.KNIGHT, color: PIECE_COLORS.WHITE };
  board[7][6] = { type: PIECE_TYPES.KNIGHT, color: PIECE_COLORS.WHITE };
  
  // Set bishops
  board[0][2] = { type: PIECE_TYPES.BISHOP, color: PIECE_COLORS.BLACK };
  board[0][5] = { type: PIECE_TYPES.BISHOP, color: PIECE_COLORS.BLACK };
  board[7][2] = { type: PIECE_TYPES.BISHOP, color: PIECE_COLORS.WHITE };
  board[7][5] = { type: PIECE_TYPES.BISHOP, color: PIECE_COLORS.WHITE };
  
  // Set queens
  board[0][3] = { type: PIECE_TYPES.QUEEN, color: PIECE_COLORS.BLACK };
  board[7][3] = { type: PIECE_TYPES.QUEEN, color: PIECE_COLORS.WHITE };
  
  // Set kings
  board[0][4] = { type: PIECE_TYPES.KING, color: PIECE_COLORS.BLACK };
  board[7][4] = { type: PIECE_TYPES.KING, color: PIECE_COLORS.WHITE };
  
  return board;
};
