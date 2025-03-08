import React, { useState, useEffect } from 'react';
import '../styles/HelpButton.css';
import { getBestMove } from '../utils/stockfishapi';
import generateSpeech from '../utils/tts';

// Import our helper_llm functionality
const fetchLLMResponse = async (stockfishResponse) => {
  // Dynamically import to avoid bundling issues
  const module = await import('../utils/helper_llm');
  return module.default ? module.default(stockfishResponse) : module.fetchLLMResponse(stockfishResponse);
};

const HelpButton = ({ currentFen, isPlayerTurn }) => {
  const [advice, setAdvice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvice, setShowAdvice] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioElement, setAudioElement] = useState(null);
  
  // Clean up speech when component unmounts
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);

  const speakAdvice = async (text) => {
    if (!text) return;
    
    // Stop any currently playing audio
    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
    }
    
    try {
      // Clean text for speech (remove HTML tags)
      const cleanText = text.replace(/<[^>]*>/g, '');
      
      // Generate speech and get audio URL
      const audioUrl = await generateSpeech(cleanText);
      if (!audioUrl) {
        console.error("Failed to generate speech audio");
        return;
      }
      
      console.log("Generated audio URL:", audioUrl);
      
      // Create and play audio element
      const audio = new Audio(audioUrl);
      setAudioElement(audio);
      
      // Set up event handlers
      audio.onplay = () => {
        setIsSpeaking(true);
        console.log("Audio started playing");
      };
      
      audio.onended = () => {
        setIsSpeaking(false);
        console.log("Audio finished playing");
      };
      
      audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        setIsSpeaking(false);
      };
      
      // Start playing
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Audio play error:", error);
          setIsSpeaking(false);
        });
      }
    } catch (error) {
      console.error("Error in speech generation:", error);
      setIsSpeaking(false);
    }
  };

  const stopSpeech = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
    }
    setIsSpeaking(false);
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      stopSpeech();
    } else if (advice) {
      speakAdvice(advice);
    }
  };

  const getHelpAdvice = async () => {
    if (!currentFen || isLoading) return;
    
    try {
      setIsLoading(true);
      setAdvice(null);
      setShowAdvice(true);
      
      // Stop any ongoing speech
      stopSpeech();
      
      // Step 1: Get Stockfish analysis
      console.log('Getting Stockfish analysis for:', currentFen);
      const stockfishResponse = await getBestMove(currentFen);
      
      if (!stockfishResponse) {
        throw new Error("Failed to get analysis from Stockfish");
      }
      
      // Step 2: Get educational explanation from LLM
      console.log('Getting educational advice from LLM');
      const teacherResponse = await fetchLLMResponse(stockfishResponse);
      
      // Set the advice
      setAdvice(teacherResponse);
      
      // Automatically speak the advice
      speakAdvice(teacherResponse);
      
      // Auto-hide the advice after 30 seconds
      const timer = setTimeout(() => {
        setShowAdvice(false);
        stopSpeech();
      }, 30000);
      
      return () => clearTimeout(timer);
    } catch (error) {
      console.error("Error getting chess advice:", error);
      setAdvice("Sorry, I couldn't analyze this position right now. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle closing the advice bubble
  const handleCloseAdvice = () => {
    setShowAdvice(false);
    stopSpeech();
  };

  return (
    <div className="help-button-container">
      <button 
        className="help-button"
        onClick={getHelpAdvice}
        disabled={isLoading || !isPlayerTurn}
        title={!isPlayerTurn ? "You can only request help during your turn" : "Get advice on your current position"}
      >
        {isLoading ? "Analyzing..." : "Coach Advice"}
      </button>
      
      {(showAdvice || isLoading) && (
        <div className="advice-bubble-container">
          <div className="advice-bubble">
            <div className="advice-avatar">👨‍🏫</div>
            <div className="advice-message">
              {isLoading ? (
                <div className="loading-advice">
                  <p>Analyzing the position...</p>
                  <div className="loading-spinner"></div>
                </div>
              ) : (
                <div className="advice-text">
                  {advice ? (
                    <div dangerouslySetInnerHTML={{ __html: advice.replace(/\n/g, '<br>') }} />
                  ) : (
                    <p>Coach is thinking...</p>
                  )}
                </div>
              )}
            </div>
            <div className="advice-controls">
              {!isLoading && advice && (
                <button 
                  className={`speech-button ${isSpeaking ? 'speaking' : ''}`}
                  onClick={toggleSpeech}
                  title={isSpeaking ? "Stop speaking" : "Listen to advice"}
                >
                  {isSpeaking ? '🔊' : '🔈'}
                </button>
              )}
            </div>
            <button className="close-advice" onClick={handleCloseAdvice}>×</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpButton;
