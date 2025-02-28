import React, { useState, useEffect } from 'react';
import Square from './Square';
import { PIECE_COLORS } from '../constants/pieceData';
import { initializeBoard } from '../utils/boardUtils';
import { 
  calculatePawnMoves,
  calculateRookMoves,
  calculateKnightMoves, 
  calculateBishopMoves,
  calculateQueenMoves,
  calculateKingMoves
} from '../utils/moveCalculator';
import {
  isInCheck,
  isInCheckmate,
  isInStalemate,
  getLegalMoves
} from '../utils/checkDetection';
import { moveToAlgebraicNotation } from '../utils/chessNotation';
import '../styles/ChessBoard.css';

const ChessBoard = ({ currentPlayer, onMove, moveHistory, onGameOver }) => {
  const [board, setBoard] = useState(initializeBoard());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [checkStatus, setCheckStatus] = useState({
    white: false,
    black: false
  });

  // Reset the board when a new game starts
  useEffect(() => {
    if (moveHistory && moveHistory.length === 0) {
      setBoard(initializeBoard());
      setSelectedSquare(null);
      setPossibleMoves([]);
      setCheckStatus({ white: false, black: false });
    }
  }, [moveHistory]);

  // Check for check, checkmate, or stalemate after each move
  useEffect(() => {
    const whiteInCheck = isInCheck('white', board);
    const blackInCheck = isInCheck('black', board);
    
    setCheckStatus({
      white: whiteInCheck,
      black: blackInCheck
    });
    
    // Check for checkmate or stalemate for the current player
    if (whiteInCheck && isInCheckmate('white', board)) {
      onGameOver && onGameOver('checkmate', 'black');
    } else if (blackInCheck && isInCheckmate('black', board)) {
      onGameOver && onGameOver('checkmate', 'white');
    } else if (isInStalemate(currentPlayer, board)) {
      onGameOver && onGameOver('stalemate');
    }
  }, [board, currentPlayer, onGameOver]);

  const handleSquareClick = (row, col) => {
    // If no piece is selected yet
    if (!selectedSquare) {
      const piece = board[row][col];
      // Check if the square has a piece and it belongs to the current player
      if (piece && piece.color === currentPlayer) {
        setSelectedSquare({ row, col });
        // Calculate possible moves for this piece
        const allMoves = calculatePossibleMoves(row, col, piece, board);
        // Filter out moves that would put/leave the player in check
        const legalMoves = getLegalMoves(row, col, piece, board, allMoves);
        setPossibleMoves(legalMoves);
      }
    } 
    // If a piece is already selected
    else {
      // Check if the clicked square is a valid move
      const isValidMove = possibleMoves.some(
        move => move.row === row && move.col === col
      );
      
      if (isValidMove) {
        // Make the move
        const newBoard = JSON.parse(JSON.stringify(board)); // Deep clone the board
        const piece = newBoard[selectedSquare.row][selectedSquare.col];
        
        // Check if this is a capture
        const capturedPiece = newBoard[row][col];
        
        // Update the board
        newBoard[selectedSquare.row][selectedSquare.col] = null;
        newBoard[row][col] = piece;
        
        setBoard(newBoard);
        
        // Notify parent component about the move
        handleMove(
          { row: selectedSquare.row, col: selectedSquare.col },
          { row, col },
          piece,
          capturedPiece
        );
        
        // Reset selection
        setSelectedSquare(null);
        setPossibleMoves([]);
      } 
      // If clicking on another piece of the same color, select that piece instead
      else if (board[row][col] && board[row][col].color === currentPlayer) {
        setSelectedSquare({ row, col });
        const allMoves = calculatePossibleMoves(row, col, board[row][col], board);
        const legalMoves = getLegalMoves(row, col, board[row][col], board, allMoves);
        setPossibleMoves(legalMoves);
      } 
      // If clicking elsewhere, reset selection
      else {
        setSelectedSquare(null);
        setPossibleMoves([]);
      }
    }
  };

  const handleMove = (fromSquare, toSquare, piece, capturedPiece = null) => {
    // Determine if this move is a check or checkmate
    const newBoard = JSON.parse(JSON.stringify(board)); // Get latest board state
    newBoard[fromSquare.row][fromSquare.col] = null;
    newBoard[toSquare.row][toSquare.col] = piece;
    
    const opponentColor = piece.color === 'white' ? 'black' : 'white';
    const isCheck = isInCheck(opponentColor, newBoard);
    const isCheckmate = isCheck && isInCheckmate(opponentColor, newBoard);
    const isCapture = capturedPiece !== null;

    // Create move object with proper notation
    const move = {
      piece,
      from: fromSquare,
      to: toSquare,
      capturedPiece,
      // Add other move properties like castling, promotion if your game supports them
      notation: moveToAlgebraicNotation(
        { piece, from: fromSquare, to: toSquare },
        isCapture,
        isCheck,
        isCheckmate
      )
    };

    // Call the onMove handler from parent component
    onMove(move);
  };

  const calculatePossibleMoves = (row, col, piece, board) => {
    switch (piece.type.toLowerCase()) {
      case 'pawn':
        return calculatePawnMoves(row, col, piece, board);
      case 'rook':
        return calculateRookMoves(row, col, piece, board);
      case 'knight':
        return calculateKnightMoves(row, col, piece, board);
      case 'bishop':
        return calculateBishopMoves(row, col, piece, board);
      case 'queen':
        return calculateQueenMoves(row, col, piece, board);
      case 'king':
        return calculateKingMoves(row, col, piece, board);
      default:
        return [];
    }
  };

  // Generate the chessboard
  const renderBoard = () => {
    const squares = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const isLight = (row + col) % 2 === 0;
        const piece = board[row][col];
        const isSelected = selectedSquare && 
          selectedSquare.row === row && 
          selectedSquare.col === col;
        const isValidMove = possibleMoves.some(
          move => move.row === row && move.col === col
        );
        
        // Check if this square contains a king in check
        const isCheck = piece && 
          piece.type.toLowerCase() === 'king' && 
          checkStatus[piece.color];
        
        squares.push(
          <Square
            key={`${row}-${col}`}
            isLight={isLight}
            piece={piece}
            isSelected={isSelected}
            isValidMove={isValidMove}
            isCheck={isCheck}
            onClick={() => handleSquareClick(row, col)}
          />
        );
      }
    }
    return squares;
  };

  return (
    <div className="chess-board">
      {renderBoard()}
      {checkStatus[currentPlayer] && (
        <div className="check-indicator">Check!</div>
      )}
    </div>
  );
};

export default ChessBoard;
