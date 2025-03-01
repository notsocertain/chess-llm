const PIECE_VALUES = {
    'pawn': 1,
    'knight': 3,
    'bishop': 3,
    'rook': 5,
    'queen': 9,
    'king': 100
};

// Simple position bonus tables (positive values for controlling center/advanced pawns)
const POSITION_BONUS = {
    'pawn': [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [5, 5, 5, 5, 5, 5, 5, 5], // Promotion row bonus
        [1, 1, 2, 3, 3, 2, 1, 1],
        [0.5, 0.5, 1, 2, 2, 1, 0.5, 0.5],
        [0, 0, 0, 1, 1, 0, 0, 0],
        [0.5, 0, 0, 0, 0, 0, 0, 0.5],
        [0.5, 1, 1, -2, -2, 1, 1, 0.5],
        [0, 0, 0, 0, 0, 0, 0, 0]
    ],
    'knight': [
        [-5, -4, -3, -3, -3, -3, -4, -5],
        [-4, -2, 0, 0, 0, 0, -2, -4],
        [-3, 0, 1, 1.5, 1.5, 1, 0, -3],
        [-3, 0.5, 1.5, 2, 2, 1.5, 0.5, -3],
        [-3, 0, 1.5, 2, 2, 1.5, 0, -3],
        [-3, 0.5, 1, 1.5, 1.5, 1, 0.5, -3],
        [-4, -2, 0, 0.5, 0.5, 0, -2, -4],
        [-5, -4, -3, -3, -3, -3, -4, -5]
    ],
    // Default center-favoring bonus for other pieces
    'default': [
        [-2, -1, -1, -0.5, -0.5, -1, -1, -2],
        [-1, 0, 0, 0, 0, 0, 0, -1],
        [-1, 0, 0.5, 1, 1, 0.5, 0, -1],
        [-0.5, 0, 1, 1.5, 1.5, 1, 0, -0.5],
        [-0.5, 0, 1, 1.5, 1.5, 1, 0, -0.5],
        [-1, 0, 0.5, 1, 1, 0.5, 0, -1],
        [-1, 0, 0, 0, 0, 0, 0, -1],
        [-2, -1, -1, -0.5, -0.5, -1, -1, -2]
    ]
};

// Check if a piece is under threat
const isPieceUnderThreat = (board, row, col, piece) => {
    const opponentColor = piece.color === 'white' ? 'black' : 'white';
    
    // Check for all opponent pieces that could capture this piece
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const attackingPiece = board[r][c];
            if (attackingPiece && attackingPiece.color === opponentColor) {
                // Simplified threat detection (in a real implementation, you'd use your move calculation functions)
                if (canCapture(board, r, c, row, col)) {
                    return true;
                }
            }
        }
    }
    return false;
};

// Simplified capture check
const canCapture = (board, fromRow, fromCol, toRow, toCol) => {
    // This is a placeholder - in your real code, you should use your actual move calculation logic
    // to determine if a piece can capture another
    
    // For now, just a simple approximation based on piece types
    const piece = board[fromRow][fromCol];
    if (!piece) return false;
    
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    
    switch (piece.type.toLowerCase()) {
        case 'pawn':
            // Pawns capture diagonally
            return rowDiff === 1 && colDiff === 1;
        case 'knight':
            // Knights move in L-shape
            return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
        case 'bishop':
            // Bishops move diagonally
            return rowDiff === colDiff;
        case 'rook':
            // Rooks move in straight lines
            return rowDiff === 0 || colDiff === 0;
        case 'queen':
            // Queens move like rooks and bishops
            return rowDiff === 0 || colDiff === 0 || rowDiff === colDiff;
        case 'king':
            // Kings move one square in any direction
            return rowDiff <= 1 && colDiff <= 1;
        default:
            return false;
    }
};

// Get position bonus for a piece
const getPositionBonus = (piece, row, col) => {
    const pieceType = piece.type.toLowerCase();
    // Flip the position for black pieces
    const adjustedRow = piece.color === 'white' ? row : 7 - row;
    const adjustedCol = piece.color === 'white' ? col : 7 - col;
    
    if (POSITION_BONUS[pieceType]) {
        return POSITION_BONUS[pieceType][adjustedRow][adjustedCol];
    }
    
    // Use default position bonus for other pieces
    return POSITION_BONUS['default'][adjustedRow][adjustedCol];
};

export const getRandomMove = (possibleMoves) => {
    const index = Math.floor(Math.random() * possibleMoves.length);
    return possibleMoves[index];
};

export const getBestMove = (board, possibleMoves) => {
    let bestMove = null;
    let bestScore = -Infinity;

    possibleMoves.forEach(move => {
        const score = evaluateMove(board, move);
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    });

    // If no good moves found, select random move
    return bestMove || getRandomMove(possibleMoves);
};

const evaluateMove = (board, move) => {
    let score = 0;
    const { from, to, piece } = move;

    // 1. Capture value - highest priority
    if (board[to.row][to.col]) {
        const capturedPiece = board[to.row][to.col];
        score += PIECE_VALUES[capturedPiece.type.toLowerCase()] * 10;
    }

    // 2. Position improvement
    const fromBonus = getPositionBonus(piece, from.row, from.col);
    const toBonus = getPositionBonus(piece, to.row, to.col);
    score += (toBonus - fromBonus) * 3;
    
    // 3. Center control bonus
    const centerDistance = Math.abs(3.5 - to.row) + Math.abs(3.5 - to.col);
    score += (7 - centerDistance) * 0.5;
    
    // 4. Check for piece safety after move
    // Create a temporary board to simulate the move
    const tempBoard = JSON.parse(JSON.stringify(board));
    tempBoard[to.row][to.col] = piece;
    tempBoard[from.row][from.col] = null;
    
    if (isPieceUnderThreat(tempBoard, to.row, to.col, piece)) {
        // Penalize moves that put pieces in danger
        score -= PIECE_VALUES[piece.type.toLowerCase()] * 2;
    }
    
    // 5. Pawn promotion proximity
    if (piece.type.toLowerCase() === 'pawn') {
        const promotionRow = piece.color === 'white' ? 0 : 7;
        const distanceToPromotion = Math.abs(promotionRow - to.row);
        score += (7 - distanceToPromotion) * 0.3;
    }
    
    // 6. Add small random factor for variety
    score += Math.random() * 0.5;

    return score;
};