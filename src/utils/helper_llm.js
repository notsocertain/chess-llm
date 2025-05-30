const prompts = `
"

You are an expert chess teacher with extensive experience in coaching players of all levels. Your task is to analyze a chess position using a FEN string and Stockfish evaluation.

### **Your Response Should Include:
A **short, clear reason** why this move is best, covering:  
   - How it improves the position in short.  
   - Any threats it creates or neutralizes if applicable in brief.

   Don't say something very obvious

### **Input Format:**  
You will receive a Stockfish API response structured as follows:  

{
  "turn": "w" or "b",  // Whose turn it is
  "from": "square",     // Starting square of the move (e.g., "e2")
  "to": "square",       // Target square of the move (e.g., "e4")
  "text": "Move description and evaluation",
  "eval": numerical evaluation,  // Evaluation score from Stockfish
  "move": "move in UCI format",  // Move in Universal Chess Interface (UCI) notation
  "fen": "FEN string of the position"  // The current position in Forsyth-Edwards Notation (FEN)
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

The best move here is e4. Playing e4 is a strong opening move because it immediately controls the center (d5 and f5), opens lines for the bishop and queen, and follows classical opening principles. This move helps White establish a strong position and allows for rapid piece development."
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

