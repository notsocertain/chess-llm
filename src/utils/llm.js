const prompts = `
"
You are an expert in chess with extensive experience in analyzing positions and selecting the best moves. Your task is to analyze a given chess position provided as a FEN string and Stockfish evaluation. You will return a JSON object with two key elements:

Best Move: The optimal next move in standard algebraic notation.
Trash Talk: A confident and humorous statement about how the move will dominate the opponent.

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


Response Format:
Return a JSON object containing:

{
  "best_move": "{best move in standard algebraic notation}",
  "trash_talk": "{confident and humorous statement about crushing the opponent}"
}

No extra text, only the JSON output.
The trash talk should be short no longer than single phrase

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
{
  "best_move": "e4",
  "trash_talk": "Bow down, my pawn marches forth like a king in disguise. Your defense? Nonexistent!"
}


Now, analyze the following Stockfish response and provide the best move in standard algebraic notation."


Strictly Enforced Output Format:
You must return a valid JSON object with the correct syntax and no additional text or explanation. The JSON must follow this structure exactly:

json
Copy
Edit
{
  "best_move": "{best move in standard algebraic notation}",
  "trash_talk": "{confident and humorous statement about crushing the opponent}"
}
The best move must be in correct standard algebraic notation.
The trash talk must be witty, competitive, and fun but not offensive.
No extra text, comments, or formatting issues—strictly return valid JSON.

DONT FORGET COMMA AFTER A KEY IN JSON
AND CURLY BRACES ARE USED TO DEFINE OBJECTS IN JSON
DOUBLE CHECK THE RESPONSE JSON FORMAT
`;

const fix_prompt = `
You are an expert in JSON syntax correction. Your task is to analyze a given JSON-like input that may have syntax errors, such as:

Missing or extra brackets {}
Missing commas between key-value pairs
Unquoted string keys or values
Any other common JSON syntax issues
Your goal is to:

Detect errors in the input.
Fix the syntax to produce valid JSON while preserving the original structure and meaning.
Strictly return only the corrected JSON—no explanations, additional text, or formatting outside valid JSON.
Example Input:
{
  "best_move": "Nc6",
  "trash_talk": "Ah, you think a simple pawn push is enough? Ha! I'll respond with a knight attack and turn the tables on your feeble defense. Bring it on!"


Example Output:
{
  "best_move": "Nc6",
  "trash_talk": "Ah, you think a simple pawn push is enough? Ha! I'll respond with a knight attack and turn the tables on your feeble defense. Bring it on!"
}
Rules:

If the input is already valid JSON, return it unchanged.
If the input has errors, fix them and return only the corrected JSON.
Do not include explanations, additional text, or formatting outside valid JSON.
`;

// Define API Key securely
const API_KEY = "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"; // Replace with your actual API key

/**
 * Fetches the LLM response based on a Stockfish analysis
 * @param {Object} stockfishResponse - The response from Stockfish API
 * @returns {Promise<string|null>} - The algebraic notation for the best movek
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
        // Add a delay of 2 seconds (2000 milliseconds)
        await new Promise(resolve => setTimeout(resolve, 1050));

        
        // Extract the move from the API response
        const responseContent = data.choices?.[0]?.message?.content?.trim();
        console.log("responseContent: ", responseContent);

        const requestBody_fix = {
            model: "llama3-8b-8192",
            messages: [
                { role: "system", content: fix_prompt },
                { role: "user", content: responseContent }
            ],
        };
        const response_fix = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify(requestBody_fix)
        });

        if (!response_fix.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
        }

        const data_final = await response_fix.json();
        const responseContent_fix = data_final.choices?.[0]?.message?.content?.trim();
        console.log("responseContent after FIX: ", responseContent_fix);

        


        const parsedResponse = JSON.parse(responseContent_fix);
        const bestMove_parsed = parsedResponse.best_move;
        const trash_talk = parsedResponse.trash_talk;

        console.log("bestMove_parsed: ", bestMove_parsed);
        console.log("trash_talk: ", trash_talk);
        
        console.log('-------------------------------------------');
        console.log('STEP 4: LLM suggested move:', bestMove_parsed);
        console.log('-------------------------------------------');

        if (!bestMove_parsed) {
            throw new Error("Empty response from LLM");
        }

        return { bestMove: bestMove_parsed, trashTalk: trash_talk };
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
        let result;
        try {
            result = await fetchLLMResponse(stockfishResponse);
        } catch (llmError) {
            console.error("LLM error:", llmError);
            throw new Error("LLM error: " + llmError.message);
        }
        
        // Validate the algebraic move
        if (!result || !result.bestMove || result.bestMove.includes("Error")) {
            throw new Error("Invalid move from LLM: " + result?.bestMove);
        }
        
        const finalResult = {
            notation: result.bestMove,
            from: stockfishResponse.from,
            to: stockfishResponse.to,
            fen: stockfishResponse.fen,
            evaluation: stockfishResponse.eval,
            trashTalk: result.trashTalk
        };
        
        console.log('-------------------------------------------');
        console.log('STEP 5: Final move result:', finalResult);
        console.log('-------------------------------------------');
        
        return finalResult;
    } catch (error) {
        console.error("Error in getNextMove:", error);
        throw error; // Re-throw the error to ensure the fallback is used
    }
}

// Export both the original getLLMNextMove name for backward compatibility
// and the new getNextMove name
export { fetchLLMResponse, getNextMove, getNextMove as getLLMNextMove };
