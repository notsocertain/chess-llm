import React, { useState, useEffect, useRef } from 'react';
import '../styles/TrashTalk.css';
import generateSpeech from '../utils/tts';

const TrashTalk = ({ message, isVisible }) => {
  // State to track if the component should be shown
  const [visible, setVisible] = useState(false);
  const audioRef = useRef(null);
  
  // Handle audio generation and playback whenever a new message comes
  useEffect(() => {
    if (message && isVisible) {
      // Apply random logic once for both audio and visual
      const shouldActivate = Math.random() < 0.6; // 80% probability
      
      if (!shouldActivate) {
        // Skip both audio and visual display
        return;
      }
      
      // Set visual state immediately
      setVisible(true);
      
      // Generate speech and play audio
      const playSpeech = async () => {
        try {
          const audioUrl = await generateSpeech(message);
          console.log("Got audio URL:", audioUrl);
          
          if (audioUrl) {
            // Create a new audio element each time to avoid issues with reusing
            const audio = new Audio(audioUrl);
            
            // Add event listeners for debugging
            audio.addEventListener('play', () => console.log('Audio started playing'));
            audio.addEventListener('error', (e) => console.error('Audio error:', e));
            
            // Set volume and play
            audio.volume = 0.8;
            
            // Ensure the audio loads before attempting to play
            audio.addEventListener('canplaythrough', () => {
              audio.play()
                .then(() => console.log("Audio playing successfully"))
                .catch(err => console.error("Audio play error:", err));
            });
            
            // Store the audio element in ref for cleanup
            audioRef.current = audio;
          }
        } catch (error) {
          console.error("Failed to generate speech:", error);
        }
      };
      
      playSpeech();
      
      // Auto-hide the message after 10 seconds
      const timer = setTimeout(() => {
        setVisible(false);
      }, 10000);
      
      return () => {
        clearTimeout(timer);
        // Stop any playing audio during cleanup
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
      };
    } else {
      setVisible(false);
    }
  }, [message, isVisible]);
  
  if (!visible || !message) return null;
  
  return (
    <div className="trash-talk-container">
      <div className="trash-talk-bubble">
        <div className="trash-talk-avatar">♟️</div>
        <div className="trash-talk-message">
          {message}
        </div>
      </div>
    </div>
  );
};

export default TrashTalk;
