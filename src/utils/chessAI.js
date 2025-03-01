const PIECE_VALUES = {
    'pawn': 1,
    'knight': 3,
    'bishop': 3,
    'rook': 5,
    'queen': 9,
    'king': 100
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

    return bestMove || getRandomMove(possibleMoves);
};

const evaluateMove = (board, move) => {
    let score = 0;
    const { to } = move;

    // Capture value
    if (board[to.row][to.col]) {
        score += PIECE_VALUES[board[to.row][to.col].type.toLowerCase()] * 10;
    }

    // Center control bonus
    const centerDistance = Math.abs(3.5 - to.row) + Math.abs(3.5 - to.col);
    score += (7 - centerDistance);

    // Random factor to add variety
    score += Math.random() * 2;

    return score;
};
