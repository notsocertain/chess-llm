import React, { useState, useEffect } from 'react';
import Square from './Square';
// import { PIECE_COLORS } from '../constants/pieceData';
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
import PromotionDialog from './PromotionDialog';
import { getBestMove } from '../utils/chessAI';

const ChessBoard = ({ currentPlayer, onMove, moveHistory, onGameOver }) => {
  const [board, setBoard] = useState(initializeBoard());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [checkStatus, setCheckStatus] = useState({
    white: false,
    black: false
  });
  const [enPassantTarget, setEnPassantTarget] = useState(null);
  const [promotionSquare, setPromotionSquare] = useState(null);

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

  useEffect(() => {
    // Make AI move when it's black's turn
    if (currentPlayer === 'black') {
      const aiMoves = [];
      // Collect all possible moves for black pieces
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = board[row][col];
          if (piece && piece.color === 'black') {
            const moves = calculatePossibleMoves(row, col, piece, board);
            const legalMoves = getLegalMoves(row, col, piece, board, moves);
            legalMoves.forEach(move => {
              aiMoves.push({
                from: { row, col },
                to: move,
                piece
              });
            });
          }
        }
      }
      
      if (aiMoves.length > 0) {
        setTimeout(() => {
          const move = getBestMove(board, aiMoves);
          const newBoard = JSON.parse(JSON.stringify(board));
          const piece = newBoard[move.from.row][move.from.col];
          const capturedPiece = newBoard[move.to.row][move.to.col];
          
          // Make the move on the board
          newBoard[move.to.row][move.to.col] = piece;
          newBoard[move.from.row][move.from.col] = null;
          
          // Update the board
          setBoard(newBoard);
          
          // Notify parent about the move
          completeMove(
            newBoard,
            move.from,
            move.to,
            piece,
            capturedPiece,
            false // isCastling
          );
        }, 500);
      }
    }
  }, [currentPlayer, board]);

  const handleSquareClick = (row, col) => {
    // If no piece is selected yet
    if (!selectedSquare) {
      const piece = board[row][col];
      // Check if the square has a piece and it belongs to the current player
      if (piece && piece.color === currentPlayer) {
        setSelectedSquare({ row, col });
        // Calculate possible moves for this piece
        const allMoves = calculatePossibleMoves(row, col, piece, board, enPassantTarget);
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
        const newBoard = JSON.parse(JSON.stringify(board));
        const piece = newBoard[selectedSquare.row][selectedSquare.col];
        const move = possibleMoves.find(m => m.row === row && m.col === col);
        
        // Update the hasMoved property
        piece.hasMoved = true;
        
        // Handle castling
        if (move.isCastling) {
          // Move the rook
          const rook = newBoard[move.rookMove.from.row][move.rookMove.from.col];
          rook.hasMoved = true;
          newBoard[move.rookMove.to.row][move.rookMove.to.col] = rook;
          newBoard[move.rookMove.from.row][move.rookMove.from.col] = null;
        }
        
        // Update king position
        const capturedPiece = newBoard[row][col];
        newBoard[selectedSquare.row][selectedSquare.col] = null;
        newBoard[row][col] = piece;
        
        setBoard(newBoard);
        
        // Notify parent component about the move
        handleMove(
          { row: selectedSquare.row, col: selectedSquare.col },
          { row, col },
          piece,
          capturedPiece,
          move.isCastling
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

  const handleMove = (fromSquare, toSquare, piece, capturedPiece = null, isCastling = false) => {
    const newBoard = JSON.parse(JSON.stringify(board));
    
    // Handle en passant capture
    const selectedMove = possibleMoves.find(m => m.row === toSquare.row && m.col === toSquare.col);
    if (selectedMove && selectedMove.isEnPassant) {
      capturedPiece = board[selectedMove.capturedPawnPosition.row][selectedMove.capturedPawnPosition.col];
      newBoard[selectedMove.capturedPawnPosition.row][selectedMove.capturedPawnPosition.col] = null;
    }

    // Handle pawn promotion
    if (piece.type === 'pawn' && (toSquare.row === 0 || toSquare.row === 7)) {
      setPromotionSquare({
        row: toSquare.row,
        col: toSquare.col,
        color: piece.color,
        // Store move information
        fromSquare,
        toSquare,
        capturedPiece,
        isCastling
      });
      return; // Wait for promotion selection
    }

    completeMove(newBoard, fromSquare, toSquare, piece, capturedPiece, isCastling);
  };

  const completeMove = (newBoard, fromSquare, toSquare, piece, capturedPiece, isCastling) => {
    // Make the move
    newBoard[fromSquare.row][fromSquare.col] = null;
    newBoard[toSquare.row][toSquare.col] = piece;

    // Update the board state
    setBoard(newBoard);

    // Set en passant target if pawn moves two squares
    if (piece.type === 'pawn' && Math.abs(toSquare.row - fromSquare.row) === 2) {
      setEnPassantTarget({
        row: fromSquare.row,
        col: fromSquare.col,
        pawnPosition: { row: toSquare.row, col: toSquare.col },
        color: piece.color
      });
    } else {
      setEnPassantTarget(null);
    }

    const opponentColor = piece.color === 'white' ? 'black' : 'white';
    const isCheck = isInCheck(opponentColor, newBoard);
    const isCheckmate = isCheck && isInCheckmate(opponentColor, newBoard);
    const isCapture = capturedPiece !== null;

    // Create move object with proper notation
    const moveNotation = {
      piece,
      from: fromSquare,
      to: toSquare,
      capturedPiece,
      isCastling,
      notation: moveToAlgebraicNotation(
        { piece, from: fromSquare, to: toSquare },
        isCapture,
        isCheck,
        isCheckmate,
        isCastling
      )
    };

    // Call the onMove handler from parent component
    onMove(moveNotation);
  };

  const handlePromotion = (pieceType) => {
    if (!promotionSquare) return;

    const newBoard = JSON.parse(JSON.stringify(board));
    const promotedPiece = {
      type: pieceType,
      color: promotionSquare.color,
      hasMoved: true,
      promoted: true
    };

    newBoard[promotionSquare.row][promotionSquare.col] = promotedPiece;
    
    // Use stored move information
    completeMove(
      newBoard,
      promotionSquare.fromSquare,
      promotionSquare.toSquare,
      promotedPiece,
      promotionSquare.capturedPiece,
      promotionSquare.isCastling
    );
    setPromotionSquare(null);
  };

  const calculatePossibleMoves = (row, col, piece, board) => {
    switch (piece.type.toLowerCase()) {
      case 'pawn':
        return calculatePawnMoves(row, col, piece, board, enPassantTarget);
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
      {promotionSquare && (
        <PromotionDialog
          color={promotionSquare.color}
          onSelect={handlePromotion}
          onClose={() => setPromotionSquare(null)}
        />
      )}
    </div>
  );
};

export default ChessBoard;
