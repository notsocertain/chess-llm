const prompts = `
*"You are an expert in chess with extensive experience in analyzing positions and selecting the best moves. Your task is to analyze a given chess position provided as a FEN string and Stockfish evaluation, then return only the best next move in standard algebraic notation.

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

Strictly Follow Standard Algebraic Notation: Your output must comply exactly with standard chess notation.

Input Format:
You'll receive a Stockfish API response with the following structure:
{
  'turn': 'w' or 'b' (whose turn it is),
  'from': 'square' (e.g., 'e2'),
  'to': 'square' (e.g., 'e4'),
  'text': 'Move description and evaluation',
  'eval': numerical evaluation,
  'move': 'move in UCI format',
  'fen': 'FEN string of the position'
}

Response Format:
Return a single best move in algebraic notation with no extra text.
Do not include explanations, evaluations, or alternative moves—strictly output the best move.

Examples:
Example Stockfish Response:
{
  'turn': 'w',
  'from': 'e2',
  'to': 'e4',
  'text': 'Move e2 → e4 [+0.32]. Depth 12.',
  'eval': 0.32,
  'move': 'e2e4',
  'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
}

Your Response:
e4

Example Stockfish Response:
{
  'turn': 'b',
  'from': 'g8',
  'to': 'f6',
  'text': 'Move g8 → f6 [+0.20]. Depth 12.',
  'eval': 0.2,
  'move': 'g8f6',
  'fen': 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1'
}

Your Response:
Nf6

Now, analyze the following Stockfish response and provide the best move in standard algebraic notation."


Output format:
{Next best move in standard algebraic notation}
`;

// Define API Key securely
const API_KEY = "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"; // Replace with your actual API key

/**
 * Fetches the LLM response based on a Stockfish analysis
 * @param {Object} stockfishResponse - The response from Stockfish API
 * @returns {Promise<string|null>} - The algebraic notation for the best move
 */
async function fetchLLMResponse(stockfishResponse) {
    const API_URL = "https://api.groq.com/openai/v1/chat/completions";

    if (!API_KEY) {
        console.error("Error: API_KEY is missing.");
        throw new Error("API_KEY is missing");
    }
    
    console.log('-------------------------------------------');
    console.log('STEP 3: Sending Stockfish response to LLM:', stockfishResponse);
    console.log('-------------------------------------------');
    
    // Ensure we have a valid stockfishResponse
    if (!stockfishResponse || !stockfishResponse.fen) {
        console.error("Invalid stockfish response:", stockfishResponse);
        throw new Error("Invalid stockfish response");
    }
    
    const requestBody = {
        model: "llama3-8b-8192",
        messages: [
            { role: "system", content: prompts },
            { role: "user", content: JSON.stringify(stockfishResponse) }
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
        
        console.log('-------------------------------------------');
        console.log('STEP 4: LLM suggested move:', bestMove);
        console.log('-------------------------------------------');

        if (!bestMove) {
            throw new Error("Empty response from LLM");
        }

        return bestMove;
    } catch (error) {
        console.error("Error fetching LLM response:", error);
        throw error; // Re-throw to allow proper fallback
    }
}

/**
 * Gets the next best move by processing Stockfish response through the LLM
 * @param {string|Object|Array} fenOrBoard - The current FEN notation or board state
 * @param {string} [currentPlayer] - The current player (only needed if board state is provided)
 * @returns {Promise<Object|null>} - The best move information
 */
async function getNextMove(fenOrBoard, currentPlayer) {
    try {
        let fen;
        
        // Handle different input types
        if (typeof fenOrBoard === 'string') {
            // It's already a FEN string - validate it
            if (!fenOrBoard.includes(' ')) {
                console.error("Invalid FEN string (no spaces):", fenOrBoard);
                throw new Error("Invalid FEN format");
            }
            
            // Count components of the FEN string
            const parts = fenOrBoard.split(' ');
            if (parts.length !== 6) {
                console.error("Invalid FEN string (should have 6 parts):", fenOrBoard);
                console.error("Found parts:", parts);
                throw new Error("Invalid FEN format: should have 6 parts");
            }
            
            fen = fenOrBoard;
            console.log('-------------------------------------------');
            console.log('STEP 1: Using provided FEN notation:', fen);
            console.log('-------------------------------------------');
        }
        else {
            // It's a board object, determine which format it is
            try {
                const { boardToFen, boardArrayToFen } = await import('./chessUtils');
                
                // Check if it's a 2D array board
                if (Array.isArray(fenOrBoard) && fenOrBoard.length === 8) {
                    fen = boardArrayToFen(fenOrBoard, currentPlayer === 'white' ? 'w' : 'b');
                    console.log('-------------------------------------------');
                    console.log('STEP 1: Generated FEN from array board:', fen);
                    console.log('-------------------------------------------');
                }
                // Check if it's a dictionary-style board with squares as keys
                else if (typeof fenOrBoard === 'object' && !Array.isArray(fenOrBoard)) {
                    // Check if it has standard square notation keys (a1, b2, etc.)
                    const hasSquareKeys = Object.keys(fenOrBoard).some(key => 
                        /^[a-h][1-8]$/.test(key) && 
                        fenOrBoard[key] && 
                        typeof fenOrBoard[key] === 'object'
                    );
                    
                    if (hasSquareKeys) {
                        fen = boardToFen(fenOrBoard, currentPlayer === 'white' ? 'w' : 'b');
                        console.log('-------------------------------------------');
                        console.log('STEP 1: Generated FEN from dictionary board:', fen);
                        console.log('-------------------------------------------');
                    }
                    // If it has a fen property, use that directly
                    else if (fenOrBoard.fen) {
                        fen = fenOrBoard.fen;
                        console.log('-------------------------------------------');
                        console.log('STEP 1: Using existing FEN from board object:', fen);
                        console.log('-------------------------------------------');
                    }
                    else {
                        throw new Error("Unrecognized board format");
                    }
                }
                else {
                    throw new Error("Unrecognized board format");
                }
            } catch (err) {
                console.error("Error converting board to FEN:", err);
                
                // Last resort: check if the board object has a fen property
                if (fenOrBoard && typeof fenOrBoard === 'object' && fenOrBoard.fen) {
                    fen = fenOrBoard.fen;
                    console.log('-------------------------------------------');
                    console.log('STEP 1: Using FEN from fallback mechanism:', fen);
                    console.log('-------------------------------------------');
                } else {
                    throw new Error("Could not convert board state to FEN notation");
                }
            }
        }
        
        // First get Stockfish analysis
        console.log('-------------------------------------------');
        console.log('STEP 2: Sending FEN to Stockfish API:', fen);
        console.log('-------------------------------------------');
        
        let stockfishResponse;
        try {
            const { getBestMove } = await import('./stockfishapi');
            stockfishResponse = await getBestMove(fen);
            
            if (!stockfishResponse) {
                throw new Error("Failed to get response from Stockfish API");
            }
            
            console.log('-------------------------------------------');
            console.log('STEP 2.5: Received Stockfish response:', stockfishResponse);
            console.log('-------------------------------------------');
        } catch (stockfishError) {
            console.error("Stockfish API error:", stockfishError);
            throw new Error("Stockfish API error: " + stockfishError.message);
        }
        
        // Then send Stockfish analysis to the LLM
        let algebraicMove;
        try {
            algebraicMove = await fetchLLMResponse(stockfishResponse);
        } catch (llmError) {
            console.error("LLM error:", llmError);
            throw new Error("LLM error: " + llmError.message);
        }
        
        // Validate the algebraic move
        if (!algebraicMove || algebraicMove.includes("Error")) {
            throw new Error("Invalid move from LLM: " + algebraicMove);
        }
        
        const result = {
            from: stockfishResponse.from,
            to: stockfishResponse.to,
            notation: algebraicMove,
            fen: stockfishResponse.fen,
            evaluation: stockfishResponse.eval
        };
        
        console.log('-------------------------------------------');
        console.log('STEP 5: Final move result:', result);
        console.log('-------------------------------------------');
        
        return result;
    } catch (error) {
        console.error("Error in getNextMove:", error);
        throw error; // Re-throw the error to ensure the fallback is used
    }
}

// Export both the original getLLMNextMove name for backward compatibility
// and the new getNextMove name
export { fetchLLMResponse, getNextMove, getNextMove as getLLMNextMove };
