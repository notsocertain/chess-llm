import React, { useState, useEffect } from 'react';
import '../styles/TrashTalk.css';

const TrashTalk = ({ message, isVisible }) => {
  // State to track if the component should be shown
  const [visible, setVisible] = useState(false);
  
  // Reset the visibility when a new message comes in
  useEffect(() => {
    if (isVisible && message) {
      setVisible(true);
      
      // Auto-hide the message after 5 seconds
      const timer = setTimeout(() => {
        setVisible(false);
      }, 6000);
      
      return () => clearTimeout(timer);
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
