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

        // Check for response status first
        if (!response.ok) {
            console.error("TTS API Error Status:", response.status, response.statusText);
            
            // Try to safely get response content for debugging
            try {
                const responseText = await response.text();
                console.error("Error response content:", responseText.substring(0, 150) + "...");
            } catch (e) {
                console.error("Couldn't read error response");
            }
            
            return null;
        }

        // Get response text first to safely handle parsing
        const responseText = await response.text();
        console.log("Raw TTS response:", responseText.substring(0, 100) + "...");
        
        // Try to parse the response as JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error("Failed to parse TTS response as JSON:", parseError);
            console.error("Received non-JSON response (first 150 chars):", 
                responseText.substring(0, 150));
            return null;
        }

        console.log("TTS Response parsed:", data);
        
        // Transform HTTP audio URLs to use our proxy
        if (data.audio_url && data.audio_url.startsWith('http://')) {
            // Replace the HTTP URL with our proxy path
            const transformedUrl = data.audio_url.replace(
                'http://165.73.253.224:8005/',
                '/'
            );
            console.log("Original audio URL:", data.audio_url);
            console.log("Transformed audio URL:", transformedUrl);
            return transformedUrl;
        }
        
        return data.audio_url;
    } catch (error) {
        console.error("Error in TTS request:", error);
        return null;
    }
};

export default generateSpeech;
