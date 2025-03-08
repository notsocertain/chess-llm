const url = "http://165.73.253.224:8005/tts";

const generateSpeech = async (text) => {
    const payload = { text: text };

    try {
        console.log("TTS payload:", payload);
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json" // Ensure correct content type
            },
            body: JSON.stringify(payload) // Ensure the payload is properly stringified
        });

        if (!response.ok) {
            const errorResponse = await response.json();
            console.error("TTS API Error:", errorResponse);
            return null;
        }

        const data = await response.json();
        console.log("TTS Response:", data);
        console.log("Audio File URL:", data.audio_url);
        return data.audio_url; // Return the audio URL for use in components
    } catch (error) {
        console.error("Error:", error);
        return null;
    }
};

export default generateSpeech;
