const prompts = `
"
You are a chess coach helping beginners understand the best move in a given position. Your goal is to explain the move in simple terms without using chess notation.

Your Response Should Include:
The best move, described in plain language (e.g., "Move your left knight forward").
A very short reason (1-2 sentences) explaining why this move is good—mentioning how it helps position, attack, or defend.


### **Input Format:**  
You will receive a Stockfish API response structured as follows:  

{
  "turn": "w" or "b",  // Whose turn it is
  "text": "Move description and evaluation",
  "fen": "FEN string of the position"  // The current position in Forsyth-Edwards Notation (FEN)
}



Examples:
Example Stockfish Response:
{
  'turn': 'w',
  'text': 'Move e2 → e4 [+0.32]. Depth 12.',
  'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
}

Your Response:
Move the pawn on e2 to e4. This helps control the center and makes room for your other pieces to develop.

Example Stockfish Response:
{
    "text": "Move c3 → e2 (Ne2): [-0.15]. The game is balanced. Depth 17.",
    "turn": "w",
    "fen": "r2q1rk1/ppp1bppp/2pnb3/4N3/8/2N4P/PPPP1PP1/R1BQR1K1 w - - 1 10"
}

Your Response:
Move the knight on c3 to e2. This helps reposition the knight to a safer spot and keeps your position solid

`;

// Define API Key securely
const API_KEY = process.env.GROQ_API_KEY // Replace with your actual API key

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
    console.log('STEP 3: Sending Stockfish response to Teacher LLM:', stockfishResponse);
    console.log('-------------------------------------------');
    
    // Ensure we have a valid stockfishResponse
    if (!stockfishResponse || !stockfishResponse.fen) {
        console.error("Invalid stockfish response:", stockfishResponse);
        
        return "sorry there seems to be problem I can't help right now but Goodluck with your game";
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
            console.error(errorText);
            return "sorry there seems to be problem I can't help right now but Goodluck with your game";
        }

        const data = await response.json();
        // Add a delay of 2 seconds (2000 milliseconds)
        // await new Promise(resolve => setTimeout(resolve, 1050));
        
        // Extract the move from the API response
        const responseContent = data.choices?.[0]?.message?.content?.trim();
        console.log("responseContent: ", responseContent);

        return responseContent;
    } catch (error) {
        console.error("Error fetching LLM response:", error);
        throw error; // Re-throw to allow proper fallback
    }
}

// Export the fetchLLMResponse function
export { fetchLLMResponse };
export default fetchLLMResponse;

