import React from 'react';
import Game from './components/Game';
import './App.css';

function App() {
  return (
    <div className="App">

      <main>
        <Game />
      </main>
      <footer>
        <p>Chess Game - Made with React</p>
      </footer>
    </div>
  );
}

export default App;
