const prompts = `
*"You are an expert in chess with extensive experience in analyzing positions and selecting the best moves. Your task is to analyze a given sequence of chess moves and return only the best next move in standard algebraic notation.

Understanding Chess Notation
Basic Piece Symbols:
K = King
Q = Queen
R = Rook
B = Bishop
N = Knight ("N" is used because "K" is reserved for the King)
(No symbol) = Pawn moves are identified by their destination square (e.g., e4 means a pawn moves to e4).
Move Symbols:
x = Capture (e.g., Bxe5 means Bishop captures on e5)
+ = Check (e.g., Qd5+ means Queen moves to d5 and gives check)
# = Checkmate (e.g., Qh7# means Queen moves to h7 and delivers checkmate)
O-O = Kingside castling (short castling)
O-O-O = Queenside castling (long castling)
Special Cases:
Pawn Move: Only the destination square is noted (e.g., e4 means a pawn moves to e4)
Pawn Capture: The file (column) the pawn came from is included (e.g., exd5 means a pawn from the 'e' file captures on d5)
Disambiguation: If two pieces of the same type can move to the same square, specify the file or rank (e.g., Nbd2 means the Knight from the 'b' file moves to d2)
How You Will Determine the Best Move
Identify Whose Turn It Is: Analyze the move sequence to determine whether it's White’s or Black’s turn.
Validate the Move Sequence: Ensure the given move history follows legal chess rules before proceeding.
Calculate the Best Move: Using your expertise, determine the optimal move based on position, material, and strategy.
Strictly Follow Standard Algebraic Notation: Your output must comply exactly with standard chess notation.
Response Format:
Return a single best move in algebraic notation with no extra text.
Do not include explanations, evaluations, or alternative moves—strictly output the best move.
Examples:
Example 1 (Black's Move):
Input:
Move history: e4 d5 exd5 (It is now Black’s turn to move.)

Output:
Nf6 (Knight moves to f6—this is the best move based on opening principles.)

Example 2 (White's Move):
Input:
Move history: e4 e5 Nf3 Nc6 (It is now White’s turn to move.)

Example 3 (White's Move):
Input:
If move history is empty you are first to move.

Output:
Bb5 (Bishop moves to b5—this is the Ruy-Lopez opening, a strong developing move.)

Now, analyze the following move history and provide the best next move."


Output format:
{Next best move in standard algebraic notation}
`;

// Define API Key securely
const API_KEY = "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"; // Replace with your actual API key

async function fetchChatResponse(moveHistory) {
    const API_URL = "https://api.groq.com/openai/v1/chat/completions";

    if (!API_KEY) {
        console.error("Error: API_KEY is missing.");
        return null;
    }

    // Format move history if it's an array
    let formattedMoveHistory = moveHistory;
    if (Array.isArray(moveHistory)) {
        formattedMoveHistory = moveHistory.join(' ');
    }
    
    console.log('Move history sent to LLM:', formattedMoveHistory);
    
    const requestBody = {
        model: "llama-3.3-70b-versatile",
        messages: [
            { role: "system", content: prompts },
            { role: "user", content: formattedMoveHistory }
        ],
    };

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
        }

        const data = await response.json();
        
        // Extract the move from the API response
        const bestMove = data.choices?.[0]?.message?.content?.trim();
        console.log("LLM suggested move:", bestMove);
        console.log('--------------------');

        return bestMove || "Error: No move found.";
    } catch (error) {
        console.error("Error fetching next move response:", error);
        return null;
    }
}

/**
 * Gets the next best move from the LLM based on the current game state
 * @param {Array} moveHistory - The history of moves in algebraic notation
 * @param {Array} board - The current board state
 * @param {String} currentPlayer - The current player ('white' or 'black')
 * @returns {Object|null} - The from and to positions for the best move, or null if no move could be determined
 */
async function getLLMNextMove(moveHistory, board, currentPlayer) {
    try {
        // Extract just the notation strings from moveHistory objects
        const notationHistory = moveHistory.map(move => move.notation);
        console.log('Sending move history to LLM:', notationHistory);
        
        // Get the best move in algebraic notation from the LLM
        const bestMoveNotation = await fetchChatResponse(notationHistory);
        
        if (!bestMoveNotation || bestMoveNotation.includes("Error")) {
            console.error("Failed to get valid move from LLM:", bestMoveNotation);
            return getFallbackMove(board, currentPlayer);
        }
        
        // Convert the algebraic notation to board coordinates
        const suggestedMove = convertAlgebraicMoveToCoordinates(bestMoveNotation, board, currentPlayer);
        
        // Validate the move
        if (suggestedMove && isValidMove(suggestedMove, board, currentPlayer)) {
            console.log("LLM suggested valid move:", suggestedMove);
            return suggestedMove;
        } else {
            console.warn("LLM suggested invalid move:", bestMoveNotation);
            return getFallbackMove(board, currentPlayer);
        }
    } catch (error) {
        console.error("Error in getLLMNextMove:", error);
        return getFallbackMove(board, currentPlayer);
    }
}

/**
 * Checks if a move is valid by checking if the piece exists and can move to the destination
 * @param {Object} move - The move to validate with from and to coordinates
 * @param {Array} board - The current board state
 * @param {String} currentPlayer - The current player ('white' or 'black')
 * @returns {Boolean} - Whether the move is valid
 */
function isValidMove(move, board, currentPlayer) {
    if (!move || !move.from || !move.to) return false;
    
    const { from, to } = move;
    
    // Check if the coordinates are within the board
    if (from.row < 0 || from.row > 7 || from.col < 0 || from.col > 7 ||
        to.row < 0 || to.row > 7 || to.col < 0 || to.col > 7) {
        return false;
    }
    
    // Check if the starting square has a piece of the current player's color
    const piece = board[from.row][from.col];
    if (!piece || piece.color !== currentPlayer) {
        return false;
    }
    
    // Simple validation for basic piece movement patterns
    // A more comprehensive validation would use the moveCalculator functions
    
    // For pawns
    if (piece.type.toLowerCase() === 'pawn') {
        const direction = piece.color === 'white' ? -1 : 1;
        const isStartingRow = (piece.color === 'white' && from.row === 6) || 
                              (piece.color === 'black' && from.row === 1);
        
        // Forward move (1 square)
        if (to.col === from.col && to.row === from.row + direction && !board[to.row][to.col]) {
            return true;
        }
        
        // Forward move (2 squares from starting position)
        if (to.col === from.col && to.row === from.row + 2 * direction && isStartingRow && 
            !board[from.row + direction][from.col] && !board[to.row][to.col]) {
            return true;
        }
        
        // Diagonal capture
        if (Math.abs(to.col - from.col) === 1 && to.row === from.row + direction && 
            board[to.row][to.col] && board[to.row][to.col].color !== currentPlayer) {
            return true;
        }
        
        return false;
    }
    
    // For knights
    if (piece.type.toLowerCase() === 'knight') {
        const rowDiff = Math.abs(to.row - from.row);
        const colDiff = Math.abs(to.col - from.col);
        
        // Knights move in an L shape (2+1 pattern)
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
    }
    
    // For simplicity, we'll return true for other pieces
    // In a real implementation, you'd check proper movement patterns for all pieces
    return true;
}

/**
 * Gets a fallback move when the LLM suggestion is invalid
 * @param {Array} board - The current board state
 * @param {String} currentPlayer - The current player ('white' or 'black')
 * @returns {Object|null} - A valid move with from and to coordinates
 */
function getFallbackMove(board, currentPlayer) {
    console.log("Using fallback move selection strategy");
    
    // First, try to find a pawn that can move forward
    for (let col = 0; col < 8; col++) {
        for (let row = 0; row < 8; row++) {
            const piece = board[row][col];
            if (piece && piece.color === currentPlayer && piece.type.toLowerCase() === 'pawn') {
                const direction = currentPlayer === 'white' ? -1 : 1;
                
                // Try moving forward 1 square
                if (row + direction >= 0 && row + direction < 8 && !board[row + direction][col]) {
                    return {
                        from: { row, col },
                        to: { row: row + direction, col }
                    };
                }
                
                // Try moving forward 2 squares from starting position
                const isStartingRow = (currentPlayer === 'white' && row === 6) || 
                                     (currentPlayer === 'black' && row === 1);
                if (isStartingRow && 
                    !board[row + direction][col] && 
                    !board[row + 2 * direction][col]) {
                    return {
                        from: { row, col },
                        to: { row: row + 2 * direction, col }
                    };
                }
                
                // Try capturing diagonally
                for (let colOffset of [-1, 1]) {
                    const targetCol = col + colOffset;
                    if (targetCol >= 0 && targetCol < 8) {
                        const targetRow = row + direction;
                        if (targetRow >= 0 && targetRow < 8 && 
                            board[targetRow][targetCol] && 
                            board[targetRow][targetCol].color !== currentPlayer) {
                            return {
                                from: { row, col },
                                to: { row: targetRow, col: targetCol }
                            };
                        }
                    }
                }
            }
        }
    }
    
    // If no pawn move found, try to move a knight
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece && piece.color === currentPlayer && piece.type.toLowerCase() === 'knight') {
                // Knight's possible moves (8 positions in L-shape)
                const knightMoves = [
                    { rowOffset: -2, colOffset: -1 }, { rowOffset: -2, colOffset: 1 },
                    { rowOffset: -1, colOffset: -2 }, { rowOffset: -1, colOffset: 2 },
                    { rowOffset: 1, colOffset: -2 }, { rowOffset: 1, colOffset: 2 },
                    { rowOffset: 2, colOffset: -1 }, { rowOffset: 2, colOffset: 1 }
                ];
                
                for (const move of knightMoves) {
                    const targetRow = row + move.rowOffset;
                    const targetCol = col + move.colOffset;
                    
                    // Check if the move is within the board
                    if (targetRow >= 0 && targetRow < 8 && targetCol >= 0 && targetCol < 8) {
                        // Check if the target square is empty or has an opponent's piece
                        if (!board[targetRow][targetCol] || 
                            board[targetRow][targetCol].color !== currentPlayer) {
                            return {
                                from: { row, col },
                                to: { row: targetRow, col: targetCol }
                            };
                        }
                    }
                }
            }
        }
    }
    
    // As a last resort, find any piece that can move anywhere
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece && piece.color === currentPlayer) {
                // Try each direction
                const directions = [
                    { rowOffset: -1, colOffset: 0 }, { rowOffset: 1, colOffset: 0 },
                    { rowOffset: 0, colOffset: -1 }, { rowOffset: 0, colOffset: 1 },
                    { rowOffset: -1, colOffset: -1 }, { rowOffset: -1, colOffset: 1 },
                    { rowOffset: 1, colOffset: -1 }, { rowOffset: 1, colOffset: 1 }
                ];
                
                for (const direction of directions) {
                    const targetRow = row + direction.rowOffset;
                    const targetCol = col + direction.colOffset;
                    
                    // Check if the move is within the board
                    if (targetRow >= 0 && targetRow < 8 && targetCol >= 0 && targetCol < 8) {
                        // Check if the target square is empty or has an opponent's piece
                        if (!board[targetRow][targetCol] || 
                            board[targetRow][targetCol].color !== currentPlayer) {
                            return {
                                from: { row, col },
                                to: { row: targetRow, col: targetCol }
                            };
                        }
                    }
                }
            }
        }
    }
    
    console.error("Could not find any valid move!");
    return null;
}

/**
 * Converts a move in algebraic notation to board coordinates
 * @param {String} moveNotation - The move in algebraic notation (e.g., "e4", "Nf3")
 * @param {Array} board - The current board state
 * @param {String} currentPlayer - The current player ('white' or 'black')
 * @returns {Object|null} - The from and to positions, or null if conversion fails
 */
function convertAlgebraicMoveToCoordinates(moveNotation, board, currentPlayer) {
    // Handle castling
    if (moveNotation === "O-O") { // Kingside castling
        const row = currentPlayer === 'white' ? 7 : 0;
        return {
            from: { row, col: 4 },
            to: { row, col: 6 }
        };
    }
    
    if (moveNotation === "O-O-O") { // Queenside castling
        const row = currentPlayer === 'white' ? 7 : 0;
        return {
            from: { row, col: 4 },
            to: { row, col: 2 }
        };
    }
    
    // Remove check and checkmate symbols
    const cleanNotation = moveNotation.replace(/[+#]/g, '');
    
    // Extract destination square (last two characters in most cases)
    const destFile = cleanNotation.slice(-2, -1).toLowerCase();
    const destRank = cleanNotation.slice(-1);
    
    // Convert algebraic coordinates to array indices
    const destCol = destFile.charCodeAt(0) - 'a'.charCodeAt(0);
    const destRow = 8 - parseInt(destRank);
    
    // Determine piece type
    let pieceType = 'pawn'; // Default to pawn
    if (/^[KQRBN]/.test(cleanNotation)) {
        pieceType = {
            'K': 'king',
            'Q': 'queen',
            'R': 'rook',
            'B': 'bishop',
            'N': 'knight'
        }[cleanNotation[0]];
    }
    
    // Search the board for pieces of the current player's color and matching type
    const candidatePieces = [];
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece && piece.color === currentPlayer && piece.type.toLowerCase() === pieceType) {
                candidatePieces.push({ piece, row, col });
            }
        }
    }
    
    // For pawn captures (e.g., "exd5")
    if (pieceType === 'pawn' && cleanNotation.includes('x')) {
        const sourceFile = cleanNotation[0];
        const sourceCol = sourceFile.charCodeAt(0) - 'a'.charCodeAt(0);
        
        // Find a pawn in the correct column that can capture to the destination
        for (const { row, col } of candidatePieces) {
            if (col === sourceCol) {
                // In a capture, a pawn moves diagonally
                if (Math.abs(col - destCol) === 1 && 
                    ((currentPlayer === 'white' && row - 1 === destRow) || 
                     (currentPlayer === 'black' && row + 1 === destRow))) {
                    
                    // Create and validate the move
                    const move = {
                        from: { row, col },
                        to: { row: destRow, col: destCol }
                    };
                    
                    if (canPieceMoveTo(board, move.from, move.to, currentPlayer)) {
                        return move;
                    }
                }
            }
        }
    }
    
    // For regular pawn moves (e.g., "e4")
    if (pieceType === 'pawn' && !cleanNotation.includes('x')) {
        // Find the pawn in the same column as the destination
        for (const { row, col } of candidatePieces) {
            if (col === destCol) {
                // Pawns move forward 1 or 2 squares
                const direction = currentPlayer === 'white' ? -1 : 1;
                if (
                    (row + 2 * direction === destRow &&
                        ((row === 1 && currentPlayer === 'black') || (row === 6 && currentPlayer === 'white')))
                ) {
                
                    // Create and validate the move
                    const move = {
                        from: { row, col },
                        to: { row: destRow, col: destCol }
                    };
                    
                    if (canPieceMoveTo(board, move.from, move.to, currentPlayer)) {
                        return move;
                    }
                }
            }
        }
    }
    
    // For other pieces, check disambiguation hints first if available
    if (candidatePieces.length > 1) {
        // If there are disambiguation hints (like Nbd7 where 'b' is the file)
        if (cleanNotation.length > 1) {
            const hint = cleanNotation[1];
            
            // Check if hint is a file (a-h)
            if (/[a-h]/.test(hint)) {
                const hintCol = hint.charCodeAt(0) - 'a'.charCodeAt(0);
                const filteredCandidates = candidatePieces.filter(({ col }) => col === hintCol);
                
                // Try each filtered candidate
                for (const { row, col } of filteredCandidates) {
                    const move = {
                        from: { row, col },
                        to: { row: destRow, col: destCol }
                    };
                    
                    if (canPieceMoveTo(board, move.from, move.to, currentPlayer)) {
                        return move;
                    }
                }
            }
            
            // Check if hint is a rank (1-8)
            if (/[1-8]/.test(hint)) {
                const hintRow = 8 - parseInt(hint);
                const filteredCandidates = candidatePieces.filter(({ row }) => row === hintRow);
                
                // Try each filtered candidate
                for (const { row, col } of filteredCandidates) {
                    const move = {
                        from: { row, col },
                        to: { row: destRow, col: destCol }
                    };
                    
                    if (canPieceMoveTo(board, move.from, move.to, currentPlayer)) {
                        return move;
                    }
                }
            }
        }
    }
    
    // No disambiguation or disambiguation didn't work - check all candidates
    // Use piece-specific move validation to find which piece can actually make the move
    for (const { row, col } of candidatePieces) {
        const move = {
            from: { row, col },
            to: { row: destRow, col: destCol }
        };
        
        if (canPieceMoveTo(board, move.from, move.to, currentPlayer)) {
            return move;
        }
    }
    
    console.error("Could not determine valid piece for move:", moveNotation);
    return null;
}

/**
 * Checks if a piece can move from one position to another according to chess rules
 * @param {Array} board - The current board state
 * @param {Object} from - The starting position {row, col}
 * @param {Object} to - The destination position {row, col}
 * @param {String} playerColor - The current player's color
 * @returns {Boolean} - Whether the move is valid
 */
function canPieceMoveTo(board, from, to, playerColor) {
    const piece = board[from.row][from.col];
    if (!piece || piece.color !== playerColor) {
        return false;
    }
    
    // Check if destination has friendly piece
    if (board[to.row][to.col] && board[to.row][to.col].color === playerColor) {
        return false;
    }
    
    const pieceType = piece.type.toLowerCase();
    
    // Check movement rules for different piece types
    switch (pieceType) {
        case 'pawn': 
            return canPawnMoveTo(board, from, to, playerColor);
        case 'knight':
            return canKnightMoveTo(board, from, to);
        case 'bishop':
            return canBishopMoveTo(board, from, to);
        case 'rook':
            return canRookMoveTo(board, from, to);
        case 'queen':
            return canQueenMoveTo(board, from, to);
        case 'king':
            return canKingMoveTo(board, from, to);
        default:
            return false;
    }
}

/**
 * Checks if a pawn can move to the specified position
 */
function canPawnMoveTo(board, from, to, playerColor) {
    const direction = playerColor === 'white' ? -1 : 1;
    const isStartingRow = (playerColor === 'white' && from.row === 6) || 
                          (playerColor === 'black' && from.row === 1);
    
    // Forward move (1 square)
    if (to.col === from.col && to.row === from.row + direction && !board[to.row][to.col]) {
        return true;
    }
    
    // Forward move (2 squares from starting position)
    if (to.col === from.col && to.row === from.row + 2 * direction && 
        isStartingRow && !board[from.row + direction][from.col] && !board[to.row][to.col]) {
        return true;
    }
    
    // Diagonal capture
    if (Math.abs(to.col - from.col) === 1 && to.row === from.row + direction && 
        board[to.row][to.col] && board[to.row][to.col].color !== playerColor) {
        return true;
    }
    
    // En passant would need additional game state information
    // Not implemented here for simplicity
    
    return false;
}

/**
 * Checks if a knight can move to the specified position
 */
function canKnightMoveTo(board, from, to) {
    const rowDiff = Math.abs(to.row - from.row);
    const colDiff = Math.abs(to.col - from.col);
    
    // Knights move in an L shape (2+1 pattern)
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
}

/**
 * Checks if a bishop can move to the specified position
 */
function canBishopMoveTo(board, from, to) {
    const rowDiff = Math.abs(to.row - from.row);
    const colDiff = Math.abs(to.col - from.col);
    
    // Bishops move diagonally (equal row and column changes)
    if (rowDiff !== colDiff) {
        return false;
    }
    
    // Check for pieces in the path
    const rowStep = to.row > from.row ? 1 : -1;
    const colStep = to.col > from.col ? 1 : -1;
    
    let currentRow = from.row + rowStep;
    let currentCol = from.col + colStep;
    
    while (currentRow !== to.row && currentCol !== to.col) {
        if (board[currentRow][currentCol]) {
            return false; // Path is blocked
        }
        currentRow += rowStep;
        currentCol += colStep;
    }
    
    return true;
}

/**
 * Checks if a rook can move to the specified position
 */
function canRookMoveTo(board, from, to) {
    // Rooks move in straight lines (either row or column stays the same)
    if (from.row !== to.row && from.col !== to.col) {
        return false;
    }
    
    // Check for pieces in the path
    if (from.row === to.row) {
        // Horizontal move
        const step = to.col > from.col ? 1 : -1;
        for (let col = from.col + step; col !== to.col; col += step) {
            if (board[from.row][col]) {
                return false; // Path is blocked
            }
        }
    } else {
        // Vertical move
        const step = to.row > from.row ? 1 : -1;
        for (let row = from.row + step; row !== to.row; row += step) {
            if (board[row][from.col]) {
                return false; // Path is blocked
            }
        }
    }
    
    return true;
}

/**
 * Checks if a queen can move to the specified position
 */
function canQueenMoveTo(board, from, to) {
    // Queen combines rook and bishop movements
    return canRookMoveTo(board, from, to) || canBishopMoveTo(board, from, to);
}

/**
 * Checks if a king can move to the specified position
 */
function canKingMoveTo(board, from, to) {
    const rowDiff = Math.abs(to.row - from.row);
    const colDiff = Math.abs(to.col - from.col);
    
    // King moves one square in any direction
    return rowDiff <= 1 && colDiff <= 1;
    
    // Castling would need additional game state information
    // Not implemented here for simplicity
}

// Export both functions
export { fetchChatResponse, getLLMNextMove };
