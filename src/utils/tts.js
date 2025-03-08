/**
 * Generates speech from text using the TTS API
 * @param {string} text - The text to convert to speech
 * @returns {Promise<string|null>} - URL to the generated audio
 */
const generateSpeech = async (text) => {
    // Try direct connection first for local development
    const url = "/api/tts";
    const payload = { text };

    try {
        console.log(`Sending TTS request to ${url} with payload:`, payload);
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        console.log(`TTS API responded with status: ${response.status}`);
        
        if (!response.ok) {
            // If we get a 404, try the direct URL as fallback (only for development)
            if (response.status === 404 && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
                console.log("Trying direct connection to TTS server as fallback");
                return await tryDirectTtsConnection(text);
            }
            
            console.error(`TTS API Error: ${response.status} ${response.statusText}`);
            return null;
        }

        // Safely attempt to parse JSON response
        try {
            const data = await response.json();
            console.log("TTS Response:", data);
            
            // If the response contains audio URLs that still use HTTP
            // we need to update those too
            if (data.audio_url && data.audio_url.startsWith('http://')) {
                console.log("Warning: Audio URL is still HTTP:", data.audio_url);
            }
            
            return data.audio_url;
        } catch (jsonError) {
            console.error("Failed to parse API response as JSON:", jsonError);
            return null;
        }
    } catch (error) {
        console.error("Error in TTS request:", error);
        
        // Try direct connection as fallback (only for development)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log("Trying direct connection to TTS server as fallback after error");
            return await tryDirectTtsConnection(text);
        }
        
        return null;
    }
};

// Helper function to try direct connection to TTS server
// This is only for development when Netlify functions aren't working
async function tryDirectTtsConnection(text) {
    try {
        const directUrl = "http://165.73.253.224:8005/tts";
        console.log(`Trying direct TTS connection to ${directUrl}`);
        
        const response = await fetch(directUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
        });
        
        if (!response.ok) {
            console.error(`Direct TTS API Error: ${response.status} ${response.statusText}`);
            return null;
        }
        
        const data = await response.json();
        console.log("Direct TTS Response:", data);
        return data.audio_url;
    } catch (error) {
        console.error("Error in direct TTS request:", error);
        return null;
    }
}

export default generateSpeech;
