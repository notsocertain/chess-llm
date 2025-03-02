import React, { useState, useEffect } from 'react';
import { 
  boardToFen, 
  getInitialFen, 
  updateFenAfterMove, 
  getInitialBoard, 
  fenToBoard 
} from '../utils/chessUtils';
import { getNextMove } from '../utils/llm';

const ChessBoard = () => {
  // Initialize board with starting position
  const [board, setBoard] = useState(getInitialBoard());
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  // Initialize FEN with starting position
  const [currentFen, setCurrentFen] = useState(getInitialFen());
  const [currentTurn, setCurrentTurn] = useState('white'); // white starts
  const [gameStatus, setGameStatus] = useState('active'); // active, check, checkmate, stalemate
  const [aiThinking, setAiThinking] = useState(false);

  // Check if a square is valid for the selected piece to move to
  const isValidMove = (from, to) => {
    const piece = board[from];
    if (!piece) return false;
    
    // Don't allow moving opponent's pieces
    if (piece.color !== currentTurn) return false;
    
    const toSquare = board[to];
    
    // Don't allow capturing own pieces
    if (toSquare && toSquare.color === piece.color) return false;
    
    // Here you would add more rules for piece movement based on type
    // This is a simplified version
    
    return true;
  };

  // Handle selecting and moving pieces
  const handleSquareClick = (square) => {
    // If game is over, don't allow moves
    if (gameStatus === 'checkmate' || gameStatus === 'stalemate') return;
    
    // If AI is thinking, don't allow moves
    if (aiThinking) return;
    
    if (selectedPiece) {
      // Attempt to move the piece
      if (isValidMove(selectedPiece, square)) {
        handleMove(selectedPiece, square);
      }
      // Always clear selection after an attempt
      setSelectedPiece(null);
    } else if (board[square] && board[square].color === currentTurn) {
      // Select the piece
      setSelectedPiece(square);
    }
  };

  // Handle piece movement
  const handleMove = (from, to) => {
    // Create a copy of the board
    const newBoard = { ...board };
    
    // Store the piece that is moving
    const piece = { ...newBoard[from] };
    
    // Check if this is a promotion move
    let promotion = null;
    if (piece.type === 'pawn') {
      if ((piece.color === 'white' && to[1] === '8') || 
          (piece.color === 'black' && to[1] === '1')) {
        promotion = 'queen'; // Default promotion to queen
      }
    }
    
    // Create the move object
    const move = { 
      from, 
      to, 
      piece, 
      promotion,
      notation: generateMoveNotation(from, to, piece, newBoard, promotion) // Add move notation
    };
    
    // Update move history
    const newMoveHistory = [...moveHistory, move];
    setMoveHistory(newMoveHistory);
    
    // Update FEN with the new move
    const newFen = updateFenAfterMove(currentFen, move);
    setCurrentFen(newFen);
    
    // Update the board
    delete newBoard[from];
    if (promotion) {
      newBoard[to] = { type: promotion, color: piece.color };
    } else {
      newBoard[to] = piece;
    }
    setBoard(newBoard);
    
    // Switch turn
    setCurrentTurn(currentTurn === 'white' ? 'black' : 'white');
    
    // Update game status (check, checkmate, etc.)
    updateGameStatus(newBoard, newFen);
  };
  
  // Generate algebraic notation for a move
  const generateMoveNotation = (from, to, piece, board, promotion) => {
    // This is a simplified notation generator
    // In a real implementation, you'd check for checks, captures, etc.
    const pieceSymbol = getPieceSymbol(piece);
    return `${pieceSymbol}${from}-${to}${promotion ? `=${promotion.charAt(0).toUpperCase()}` : ''}`;
  };
  
  // Get symbol for piece type
  const getPieceSymbol = (piece) => {
    if (piece.type === 'pawn') return '';
    const symbols = { 'king': 'K', 'queen': 'Q', 'rook': 'R', 'bishop': 'B', 'knight': 'N' };
    return symbols[piece.type] || '';
  };
  
  // Request move from AI using Stockfish and LLM
  const requestAIMove = async () => {
    if (gameStatus === 'checkmate' || gameStatus === 'stalemate') return;
    
    try {
      setAiThinking(true);
      
      // Get move recommendation using FEN through Stockfish and LLM
      const moveData = await getNextMove(currentFen);
      
      if (moveData && moveData.from && moveData.to) {
        handleMove(moveData.from, moveData.to);
        
        // If the response includes a new FEN, update it
        if (moveData.fen) {
          setCurrentFen(moveData.fen);
          setBoard(fenToBoard(moveData.fen.split(' ')[0]));
          setCurrentTurn(moveData.fen.split(' ')[1] === 'w' ? 'white' : 'black');
        }
      } else {
        console.error("Invalid move data received from AI");
      }
    } catch (error) {
      console.error("Error getting AI move:", error);
    } finally {
      setAiThinking(false);
    }
  };
  
  // Check game status (check, checkmate, stalemate)
  const updateGameStatus = (board, fen) => {
    // In a real implementation, you would analyze the position
    // to determine if the king is in check, if it's checkmate, etc.
    // For simplicity, we're just setting it to 'active' here
    setGameStatus('active');
  };
  
  // Reset game to starting position
  const resetGame = () => {
    setBoard(getInitialBoard());
    setSelectedPiece(null);
    setMoveHistory([]);
    setCurrentFen(getInitialFen());
    setCurrentTurn('white');
    setGameStatus('active');
  };

  // Undo last move
  const undoMove = () => {
    if (moveHistory.length === 0) return;
    
    // Remove last move from history
    const newMoveHistory = [...moveHistory];
    newMoveHistory.pop();
    setMoveHistory(newMoveHistory);
    
    // If there are no previous moves, reset to starting position
    if (newMoveHistory.length === 0) {
      resetGame();
      return;
    }
    
    // Rebuild board and FEN from initial state + move history
    let newFen = getInitialFen();
    const newBoard = getInitialBoard();
    
    // Apply all moves except the last one
    for (const move of newMoveHistory) {
      newFen = updateFenAfterMove(newFen, move);
    }
    
    // Update state
    setCurrentFen(newFen);
    setBoard(fenToBoard(newFen.split(' ')[0]));
    setCurrentTurn(newFen.split(' ')[1] === 'w' ? 'white' : 'black');
    updateGameStatus(newBoard, newFen);
  };

  // Render chessboard
  return (
    <div className="chess-game">
      <div className="game-info">
        <div>Turn: {currentTurn}</div>
        <div>Status: {gameStatus}</div>
        {aiThinking && <div className="ai-thinking-indicator">AI is thinking...</div>}
      </div>
      
      <div className="chess-board">
        {/* Generate 8x8 board */}
        {Array.from({ length: 8 }, (_, rankIndex) => {
          const rank = 8 - rankIndex;
          return (
            <div key={rank} className="board-rank">
              {Array.from({ length: 8 }, (_, fileIndex) => {
                const file = String.fromCharCode(97 + fileIndex); // 'a' through 'h'
                const square = file + rank;
                const piece = board[square];
                const isSelected = selectedPiece === square;
                const squareColor = (fileIndex + rankIndex) % 2 === 0 ? 'white-square' : 'black-square';
                
                return (
                  <div 
                    key={square} 
                    className={`chess-square ${squareColor} ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSquareClick(square)}
                  >
                    {piece && (
                      <div className={`chess-piece ${piece.color} ${piece.type}`}>
                        {/* Display piece - in a real app, you'd use images or unicode */}
                        {getPieceUnicode(piece)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      
      <div className="game-controls">
        <button onClick={resetGame}>Reset Game</button>
        <button onClick={undoMove}>Undo Move</button>
        <button onClick={requestAIMove}>Get AI Move</button>
      </div>
      
      <div className="move-history">
        <h3>Move History</h3>
        <ul>
          {moveHistory.map((move, index) => (
            <li key={index}>
              {index % 2 === 0 ? `${Math.floor(index/2) + 1}.` : ''} 
              {move.notation || `${move.from}-${move.to}`}
              {move.promotion ? ` (promoted to ${move.promotion})` : ''}
            </li>
          ))}
        </ul>
      </div>
      
      <div className="fen-display">
        <h3>Current FEN</h3>
        <div className="fen-text">{currentFen}</div>
      </div>
    </div>
  );
};

// Helper function to get Unicode chess symbols
function getPieceUnicode(piece) {
  const pieceSymbols = {
    'white': {
      'king': '♔', 'queen': '♕', 'rook': '♖',
      'bishop': '♗', 'knight': '♘', 'pawn': '♙'
    },
    'black': {
      'king': '♚', 'queen': '♛', 'rook': '♜',
      'bishop': '♝', 'knight': '♞', 'pawn': '♟'
    }
  };
  
  return pieceSymbols[piece.color][piece.type];
}

export default ChessBoard;
