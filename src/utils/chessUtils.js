/**
 * Chess utilities for FEN notation and board state management
 */

/**
 * Converts a chess board object from array format [row][col] to FEN notation
 * @param {Array} board - The 2D array representing the chess board
 * @param {string} turn - Current turn ('w' for white, 'b' for black)
 * @param {Object} castlingRights - Object containing castling availability
 * @param {string|null} enPassantTarget - Square where en passant capture is possible (or null)
 * @param {number} halfMoveClock - Number of halfmoves since last capture or pawn advance
 * @param {number} fullMoveNumber - The number of the full moves in the game
 * @returns {string} - FEN notation string
 */
export function boardArrayToFen(
  board,
  turn = 'w',
  castlingRights = { K: true, Q: true, k: true, q: true },
  enPassantTarget = null,
  halfMoveClock = 0,
  fullMoveNumber = 1
) {
  if (!board) return '';
  
  // 1. Piece placement
  const piecePlacement = [];
  for (let row = 0; row < 8; row++) {
    let emptyCount = 0;
    let rowString = '';
    
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      
      if (!piece) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          rowString += emptyCount;
          emptyCount = 0;
        }
        
        let pieceChar = '';
        switch (piece.type) {
          case 'pawn': pieceChar = 'p'; break;
          case 'rook': pieceChar = 'r'; break;
          case 'knight': pieceChar = 'n'; break;
          case 'bishop': pieceChar = 'b'; break;
          case 'queen': pieceChar = 'q'; break;
          case 'king': pieceChar = 'k'; break;
          default: pieceChar = '?'; break; // Added default case
        }
        
        if (piece.color === 'white') {
          pieceChar = pieceChar.toUpperCase();
        }
        
        rowString += pieceChar;
      }
    }
    
    if (emptyCount > 0) {
      rowString += emptyCount;
    }
    
    piecePlacement.push(rowString);
  }
  
  // 2. Active color
  const activeColor = turn;
  
  // 3. Castling availability
  let castling = '';
  if (castlingRights.K) castling += 'K';
  if (castlingRights.Q) castling += 'Q';
  if (castlingRights.k) castling += 'k';
  if (castlingRights.q) castling += 'q';
  if (castling === '') castling = '-';
  
  // 4. En passant target square
  const enPassant = enPassantTarget || '-';
  
  // 5. Halfmove clock
  const halfmove = halfMoveClock || 0;
  
  // 6. Fullmove number
  const fullmove = fullMoveNumber || 1;
  
  return `${piecePlacement.join('/')} ${activeColor} ${castling} ${enPassant} ${halfmove} ${fullmove}`;
}

/**
 * Converts a chess board object from dictionary format {square: piece} to FEN notation
 * @param {Object} boardState - The chess board in dictionary format {square: {type, color}}
 * @param {string} turn - Current turn ('w' for white, 'b' for black)
 * @param {Object} castlingRights - Object containing castling availability
 * @param {string|null} enPassantTarget - Square where en passant capture is possible (or null)
 * @param {number} halfMoveClock - Number of halfmoves since last capture or pawn advance
 * @param {number} fullMoveNumber - The number of the full moves in the game
 * @returns {string} - FEN notation string
 */
export function boardToFen(
  boardState,
  turn = 'w',
  castlingRights = { K: true, Q: true, k: true, q: true },
  enPassantTarget = null,
  halfMoveClock = 0,
  fullMoveNumber = 1
) {
  console.log("Starting boardToFen conversion");
  console.log("Board to convert:", boardState);
  console.log("Current turn:", turn);

  // Part 1: Piece placement
  let fen = '';
  for (let rank = 8; rank >= 1; rank--) {
    let emptySquares = 0;
    for (let file = 1; file <= 8; file++) {
      const square = fileRankToSquare(file, rank);
      const piece = boardState[square];
      
      if (piece) {
        if (emptySquares > 0) {
          fen += emptySquares;
          emptySquares = 0;
        }
        
        // Map piece type to FEN character
        let pieceChar = piece.type.charAt(0);
        // Special case for knight which uses 'n' in FEN
        if (piece.type === 'knight') pieceChar = 'n';
        
        fen += piece.color === 'white' ? pieceChar.toUpperCase() : pieceChar.toLowerCase();
      } else {
        emptySquares++;
      }
    }
    
    if (emptySquares > 0) {
      fen += emptySquares;
    }
    
    if (rank > 1) {
      fen += '/';
    }
  }
  
  // Part 2: Active color
  fen += ' ' + turn;
  
  // Part 3: Castling availability
  let castling = '';
  if (castlingRights.K) castling += 'K';
  if (castlingRights.Q) castling += 'Q';
  if (castlingRights.k) castling += 'k';
  if (castlingRights.q) castling += 'q';
  fen += ' ' + (castling || '-');
  
  // Part 4: En passant target square
  fen += ' ' + (enPassantTarget || '-');
  
  // Part 5 & 6: Halfmove clock and fullmove number
  fen += ' ' + halfMoveClock + ' ' + fullMoveNumber;
  
  console.log("Generated FEN:", fen);
  return fen;
}

/**
 * Convert FEN position string to board state object in dictionary format
 * @param {string} positionStr - FEN position part
 * @returns {Object} - Board state object {square: {type, color}}
 */
export function fenToBoard(positionStr) {
  console.log("Starting fenToBoard conversion");
  console.log("FEN position to convert:", positionStr);

  const board = {};
  const ranks = positionStr.split('/');
  
  ranks.forEach((rank, rankIndex) => {
    let fileIndex = 0;
    
    for (let i = 0; i < rank.length; i++) {
      const char = rank.charAt(i);
      
      if (isNaN(parseInt(char))) {
        // It's a piece
        const square = fileRankToSquare(fileIndex + 1, 8 - rankIndex);
        const isUpperCase = char === char.toUpperCase();
        let pieceType;
        
        switch(char.toLowerCase()) {
          case 'p': pieceType = 'pawn'; break;
          case 'r': pieceType = 'rook'; break;
          case 'n': pieceType = 'knight'; break;
          case 'b': pieceType = 'bishop'; break;
          case 'q': pieceType = 'queen'; break;
          case 'k': pieceType = 'king'; break;
          default: pieceType = 'unknown'; break; // Added default case
        }
        
        board[square] = {
          type: pieceType,
          color: isUpperCase ? 'white' : 'black'
        };
        fileIndex++;
      } else {
        // It's a number representing empty squares
        fileIndex += parseInt(char);
      }
    }
  });
  
  console.log("Generated board state:", board);
  return board;
}

/**
 * Convert FEN position string to board state array
 * @param {string} positionStr - FEN position part
 * @returns {Array} - 8x8 board array
 */
export function fenToBoardArray(positionStr) {
  console.log("Starting fenToBoardArray conversion");
  console.log("FEN position to convert:", positionStr);

  // Initialize empty 8x8 board
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  const ranks = positionStr.split('/');
  
  ranks.forEach((rank, rankIndex) => {
    let fileIndex = 0;
    
    for (let i = 0; i < rank.length; i++) {
      const char = rank.charAt(i);
      
      if (isNaN(parseInt(char))) {
        // It's a piece
        const isUpperCase = char === char.toUpperCase();
        let pieceType;
        
        switch(char.toLowerCase()) {
          case 'p': pieceType = 'pawn'; break;
          case 'r': pieceType = 'rook'; break;
          case 'n': pieceType = 'knight'; break;
          case 'b': pieceType = 'bishop'; break;
          case 'q': pieceType = 'queen'; break;
          case 'k': pieceType = 'king'; break;
          default: pieceType = 'unknown'; break; // Added default case
        }
        
        board[rankIndex][fileIndex] = {
          type: pieceType,
          color: isUpperCase ? 'white' : 'black'
        };
        fileIndex++;
      } else {
        // It's a number representing empty squares
        fileIndex += parseInt(char);
      }
    }
  });
  
  console.log("Generated board array:", board);
  return board;
}

/**
 * Converts file and rank coordinates to square name
 * @param {number} file - File number (1-8)
 * @param {number} rank - Rank number (1-8)
 * @returns {string} - Square name (e.g. 'a1')
 */
export function fileRankToSquare(file, rank) {
  const files = 'abcdefgh';
  return files[file - 1] + rank;
}

/**
 * Parse a FEN string into its component parts
 * @param {string} fen - FEN string
 * @returns {Object} - Object with parsed FEN components
 */
export function parseFen(fen) {
  console.log("Starting parseFen");
  console.log("FEN to parse:", fen);

  const [position, turn, castling, enPassant, halfmove, fullmove] = fen.split(' ');
  
  const parsedFen = {
    position,
    turn,
    castling,
    enPassant: enPassant === '-' ? null : enPassant,
    halfMoveClock: parseInt(halfmove),
    fullMoveNumber: parseInt(fullmove)
  };

  console.log("Parsed FEN components:", parsedFen);
  return parsedFen;
}

/**
 * Get the initial FEN position
 * @returns {string} - Standard starting position in FEN
 */
export function getInitialFen() {
  return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
}

/**
 * Generate an initial board state from the starting position in dictionary format
 * @returns {Object} - Initial board state {square: {type, color}}
 */
export function getInitialBoard() {
  return fenToBoard('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
}

/**
 * Generate an initial board state array from the starting position
 * @returns {Array} - Initial 8x8 board array
 */
export function getInitialBoardArray() {
  return fenToBoardArray('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
}

/**
 * Updates FEN data based on a new move for dictionary-style board
 * @param {string} currentFen - Current FEN notation
 * @param {Object} move - Move information {from, to, piece, promotion}
 * @returns {string} - Updated FEN notation
 */
export function updateFenAfterMove(currentFen, move) {
  console.log("Starting updateFenAfterMove");
  console.log("Current FEN:", currentFen);
  console.log("Move to apply:", move);

  const { from, to, piece, promotion } = move;
  
  // Parse current FEN
  const fenParts = parseFen(currentFen);
  
  // Convert FEN position to board
  const board = fenToBoard(fenParts.position);
  
  // Track if this move should reset the halfmove clock 
  let resetHalfmoveClock = false;
  
  // Store piece that's moving
  const movingPiece = board[from] || piece;
  
  // Check if this is a capture move
  const isCapture = board[to] !== undefined;
  if (isCapture) {
    resetHalfmoveClock = true;
  }
  
  // Check if this is a pawn move
  if (movingPiece.type === 'pawn') {
    resetHalfmoveClock = true;
  }
  
  // Update castling rights if needed
  let castlingRights = fenParts.castling;
  if (movingPiece.type === 'king') {
    if (movingPiece.color === 'white') {
      castlingRights = castlingRights.replace(/[KQ]/g, '');
    } else {
      castlingRights = castlingRights.replace(/[kq]/g, '');
    }
  } else if (movingPiece.type === 'rook') {
    if (from === 'a1') castlingRights = castlingRights.replace('Q', '');
    if (from === 'h1') castlingRights = castlingRights.replace('K', '');
    if (from === 'a8') castlingRights = castlingRights.replace('q', '');
    if (from === 'h8') castlingRights = castlingRights.replace('k', '');
  }
  if (castlingRights === '') castlingRights = '-';
  
  // Handle en passant target square
  let enPassantTarget = '-';
  if (movingPiece.type === 'pawn') {
    const fromRank = parseInt(from.charAt(1));
    const toRank = parseInt(to.charAt(1));
    if (Math.abs(fromRank - toRank) === 2) {
      // Pawn moved two squares
      const file = from.charAt(0);
      const enPassantRank = movingPiece.color === 'white' ? 3 : 6;
      enPassantTarget = file + enPassantRank;
    }
    
    // Handle en passant capture
    if (to === fenParts.enPassant) {
      const captureRank = movingPiece.color === 'white' ? 5 : 4;
      const captureFile = to.charAt(0);
      const capturedPawnSquare = captureFile + captureRank;
      delete board[capturedPawnSquare]; // Remove captured pawn
    }
  }
  
  // Move the piece
  delete board[from];
  
  // Handle promotion
  if (promotion) {
    board[to] = {
      type: promotion,
      color: movingPiece.color
    };
  } else {
    board[to] = { ...movingPiece };
  }
  
  // Handle castling moves
  if (movingPiece.type === 'king') {
    if (from === 'e1' && to === 'g1') {
      // White kingside castle
      delete board['h1'];
      board['f1'] = { type: 'rook', color: 'white' };
    } else if (from === 'e1' && to === 'c1') {
      // White queenside castle
      delete board['a1'];
      board['d1'] = { type: 'rook', color: 'white' };
    } else if (from === 'e8' && to === 'g8') {
      // Black kingside castle
      delete board['h8'];
      board['f8'] = { type: 'rook', color: 'black' };
    } else if (from === 'e8' && to === 'c8') {
      // Black queenside castle
      delete board['a8'];
      board['d8'] = { type: 'rook', color: 'black' };
    }
  }
  
  // Update turn
  const newTurn = fenParts.turn === 'w' ? 'b' : 'w';
  
  // Update halfmove clock
  let halfMoveClock = resetHalfmoveClock ? 0 : fenParts.halfMoveClock + 1;
  
  // Update fullmove number (increments after black's move)
  let fullMoveNumber = fenParts.fullMoveNumber;
  if (newTurn === 'w') {
    fullMoveNumber++;
  }
  
  // Generate new board position in FEN format
  const newFen = boardToFen(
    board, 
    newTurn, 
    { 
      K: castlingRights.includes('K'), 
      Q: castlingRights.includes('Q'),
      k: castlingRights.includes('k'),
      q: castlingRights.includes('q')
    },
    enPassantTarget === '-' ? null : enPassantTarget,
    halfMoveClock,
    fullMoveNumber
  );
  
  console.log("Updated FEN:", newFen);
  return newFen;
}
