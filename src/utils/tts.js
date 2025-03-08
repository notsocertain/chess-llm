/**
 * Generates speech from text using the TTS API
 * @param {string} text - The text to convert to speech
 * @returns {Promise<string|null>} - URL to the generated audio
 */
const generateSpeech = async (text) => {
    // Use the Netlify proxied URL instead of direct HTTP API
    const url = "/api/tts";
    const payload = { text };

    try {
        console.log("TTS payload:", payload);
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorResponse = await response.json();
            console.error("TTS API Error:", errorResponse);
            return null;
        }

        const data = await response.json();
        console.log("TTS Response:", data);
        
        // If the response contains audio URLs that still use HTTP
        // we need to update those too
        if (data.audio_url && data.audio_url.startsWith('http://')) {
            // Create another redirect for audio files if needed
            // For now, return as is - you might need to handle this separately
            console.log("Warning: Audio URL is still HTTP:", data.audio_url);
        }
        
        return data.audio_url;
    } catch (error) {
        console.error("Error in TTS request:", error);
        return null;
    }
};

export default generateSpeech;
