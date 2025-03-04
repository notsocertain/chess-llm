const url = "https://api.murf.ai/v1/speech/generate";
const SPEECH_API_KEY ="ap2_9a21d52d-cc82-488a-88b6-cb01396aadae"

const generateSpeech = async (text) => {
    const payload = {
        voiceId: "en-UK-ruby",
        style: "Conversational",
        text: text,
        rate: 0,
        pitch: 10,
        sampleRate: 48000,
        format: "MP3",
        channelType: "MONO",
        pronunciationDictionary: {},
        encodeAsBase64: false,
        modelVersion: "GEN2"
    };

    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'api-key': SPEECH_API_KEY
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        console.log("Audio File URL:", data.audioFile);
        console.log("Remaining token:", data.remainingCharacterCount);
        return data.audioFile; // Return the audio URL for use in components
    } catch (error) {
        console.error("Error:", error);
        return null;
    }
};

export default generateSpeech;