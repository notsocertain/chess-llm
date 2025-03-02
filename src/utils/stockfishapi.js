/**
 * StockfishAPI utility for chess analysis
 * Provides functions to get best moves from a chess position using FEN notation
 */

// API configuration - could be moved to environment variables
const API_URL = "https://chess-api.com/v1";

/**
 * Sends a request to the chess analysis API
 * @param {Object} data - Request data including FEN and search depth
 * @param {string} data.fen - FEN notation of the chess position
 * @param {number} data.depth - Search depth for the engine (optional)
 * @returns {Promise<Object>} - API response with move recommendation
 */
async function postChessApi(data = {}) {
    const headers = {
        "Content-Type": "application/json"
    };
    
    try {
        console.log("-------------------------------------------");
        console.log("Stockfish API request data:", data);
        console.log("-------------------------------------------");
        
        const response = await fetch(API_URL, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log("-------------------------------------------");
        console.log("Stockfish API response:", result);
        console.log("-------------------------------------------");
        
        return result;
    } catch (error) {
        console.error("StockfishAPI request failed:", error);
        throw error;
    }
}

/**
 * Gets the best move for a given chess position
 * @param {string} fen - FEN notation of the chess position
 * @param {number} depth - Search depth (optional, default: 12)
 * @returns {Promise<Object>} - Best move information
 */
async function getBestMove(fen, depth = 18) {
    try {
        const response = await postChessApi({ fen, depth });
        
        // Extract relevant move information
        const { turn, from, to, text, eval: evaluation, move, fen: resultFen } = response;
        
        const result = { turn, from, to, text, evaluation, move, fen: resultFen };
        console.log("-------------------------------------------");
        console.log("Processed Stockfish move data:", result);
        console.log("-------------------------------------------");
        
        return result;
    } catch (error) {
        console.error("Failed to get best move:", error);
        throw error;
    }
}

// Create an object before exporting as default
const stockfishApi = {
    getBestMove,
    postChessApi
};

export { getBestMove, postChessApi };
export default stockfishApi;
