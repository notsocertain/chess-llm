import React, { useState, useEffect, useCallback } from 'react';
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
import { getLLMNextMove } from '../utils/llm';
import { getBestMove } from '../utils/chessAI';
import '../styles/ChessBoard.css';
import PromotionDialog from './PromotionDialog';

const ChessBoard = ({ currentPlayer, onMove, moveHistory, onGameOver, playerColor }) => {
  const [board, setBoard] = useState(initializeBoard());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [checkStatus, setCheckStatus] = useState({
    white: false,
    black: false
  });
  const [enPassantTarget, setEnPassantTarget] = useState(null);
  const [promotionSquare, setPromotionSquare] = useState(null);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Memoize the calculatePossibleMoves function to avoid recreating it on every render
  const calculatePossibleMoves = useCallback((row, col, piece, board, enPassantTarget) => {
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
  }, []);

  // Memoize completeMove function to avoid recreating it on every render
  const completeMove = useCallback((newBoard, fromSquare, toSquare, piece, capturedPiece, isCastling, rookMove = null) => {
    // Make the move
    newBoard[fromSquare.row][fromSquare.col] = null;
    newBoard[toSquare.row][toSquare.col] = piece;

    // Handle castling - move the rook as well
    if (isCastling && rookMove) {
      const rook = newBoard[rookMove.from.row][rookMove.from.col];
      newBoard[rookMove.to.row][rookMove.to.col] = rook;
      newBoard[rookMove.from.row][rookMove.from.col] = null;
    }

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
        { piece, from: fromSquare, to: toSquare, isCastling },
        isCapture,
        isCheck,
        isCheckmate
      )
    };

    // Call the onMove handler from parent component
    onMove(moveNotation);
  }, [onMove]);

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

  // Make AI move when it's the computer's turn
  useEffect(() => {
    const isComputerTurn = currentPlayer !== playerColor;
    
    if (isComputerTurn && !isAiThinking) {
      const makeAIMove = async () => {
        setIsAiThinking(true);

        try {
          // First try the LLM approach
          const move = await getLLMNextMove(moveHistory, board, currentPlayer);
          
          if (move) {
            const newBoard = JSON.parse(JSON.stringify(board));
            const piece = newBoard[move.from.row][move.from.col];
            const capturedPiece = newBoard[move.to.row][move.to.col];
            
            // Update piece properties
            piece.hasMoved = true;
            
            // Make the move on the board
            const isCastling = piece.type === 'king' && Math.abs(move.to.col - move.from.col) > 1;
            let rookMove = null;
            
            // Handle castling - identify rook move
            if (isCastling) {
              const backRow = piece.color === 'white' ? 7 : 0;
              
              if (move.to.col > move.from.col) {  // Kingside
                rookMove = {
                  from: { row: backRow, col: 7 },
                  to: { row: backRow, col: 5 }
                };
              } else {  // Queenside
                rookMove = {
                  from: { row: backRow, col: 0 },
                  to: { row: backRow, col: 3 }
                };
              }
            }
            
            // Complete the move
            completeMove(
              newBoard,
              move.from,
              move.to,
              piece,
              capturedPiece,
              isCastling,
              rookMove
            );
          } else {
            console.log("Using chessAI fallback logic for move generation");
            
            // Generate all possible AI moves
            const allMoves = [];
            for (let row = 0; row < 8; row++) {
              for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.color === currentPlayer) {
                  const moves = calculatePossibleMoves(row, col, piece, board, enPassantTarget);
                  const legalMoves = getLegalMoves(row, col, piece, board, moves);
                  legalMoves.forEach(move => {
                    allMoves.push({
                      from: { row, col },
                      to: move,
                      piece
                    });
                  });
                }
              }
            }
            
            if (allMoves.length > 0) {
              // Use the AI evaluation function to pick the best move
              const bestMove = getBestMove(board, allMoves);
              const newBoard = JSON.parse(JSON.stringify(board));
              const piece = newBoard[bestMove.from.row][bestMove.from.col];
              const capturedPiece = newBoard[bestMove.to.row][bestMove.to.col];
              
              piece.hasMoved = true;
              
              // Check if this is a castling move
              const isCastling = piece.type === 'king' && Math.abs(bestMove.to.col - bestMove.from.col) > 1;
              let rookMove = null;
              
              if (isCastling) {
                const backRow = piece.color === 'white' ? 7 : 0;
                
                if (bestMove.to.col > bestMove.from.col) {  // Kingside
                  rookMove = {
                    from: { row: backRow, col: 7 },
                    to: { row: backRow, col: 5 }
                  };
                } else {  // Queenside
                  rookMove = {
                    from: { row: backRow, col: 0 },
                    to: { row: backRow, col: 3 }
                  };
                }
              }
              
              completeMove(
                newBoard,
                bestMove.from,
                bestMove.to,
                piece,
                capturedPiece,
                isCastling,
                rookMove
              );
            }
          }
        } catch (error) {
          console.error("Error making AI move:", error);
          
          // Fallback to chess AI on any error
          try {
            console.log("Error recovery: Using chessAI logic");
            
            // Generate all possible AI moves
            const allMoves = [];
            for (let row = 0; row < 8; row++) {
              for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.color === currentPlayer) {
                  const moves = calculatePossibleMoves(row, col, piece, board, enPassantTarget);
                  const legalMoves = getLegalMoves(row, col, piece, board, moves);
                  legalMoves.forEach(move => {
                    allMoves.push({
                      from: { row, col },
                      to: move,
                      piece
                    });
                  });
                }
              }
            }
            
            if (allMoves.length > 0) {
              // Use the AI evaluation function to pick the best move
              const bestMove = getBestMove(board, allMoves);
              const newBoard = JSON.parse(JSON.stringify(board));
              const piece = newBoard[bestMove.from.row][bestMove.from.col];
              const capturedPiece = newBoard[bestMove.to.row][bestMove.to.col];
              
              piece.hasMoved = true;
              completeMove(
                newBoard,
                bestMove.from,
                bestMove.to,
                piece,
                capturedPiece,
                false,
                null
              );
            }
          } catch (fallbackError) {
            console.error("Fallback move generation also failed:", fallbackError);
          }
        } finally {
          setIsAiThinking(false);
        }
      };
      
      makeAIMove();
    }
  }, [currentPlayer, board, playerColor, moveHistory, calculatePossibleMoves, completeMove, enPassantTarget, isAiThinking]);

  const handleSquareClick = (row, col) => {
    // Only allow clicks for the human player's turn
    if (currentPlayer !== playerColor) return;
    
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
        
        // Get captured piece and prepare move
        const capturedPiece = newBoard[row][col];
        const isCastling = move.isCastling || false;
        const rookMove = move.rookMove || null;

        // Make the move
        handleMove(
          { row: selectedSquare.row, col: selectedSquare.col },
          { row, col },
          piece,
          capturedPiece,
          isCastling,
          rookMove
        );
        
        // Reset selection
        setSelectedSquare(null);
        setPossibleMoves([]);
      } 
      // If clicking on another piece of the same color, select that piece instead
      else if (board[row][col] && board[row][col].color === currentPlayer) {
        setSelectedSquare({ row, col });
        const allMoves = calculatePossibleMoves(row, col, board[row][col], board, enPassantTarget);
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

  const handleMove = (fromSquare, toSquare, piece, capturedPiece = null, isCastling = false, rookMove = null) => {
    const newBoard = JSON.parse(JSON.stringify(board));
    
    // Handle en passant capture
    const selectedMove = possibleMoves.find(m => m.row === toSquare.row && m.col === toSquare.col);
    if (selectedMove && selectedMove.isEnPassant) {
      capturedPiece = board[selectedMove.capturedPawnPosition.row][selectedMove.capturedPawnPosition.col];
      newBoard[selectedMove.capturedPawnPosition.row][selectedMove.capturedPawnPosition.col] = null;
    }

    // If castling, get the rook move from the selected move
    if (isCastling && !rookMove && selectedMove && selectedMove.rookMove) {
      rookMove = selectedMove.rookMove;
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
        isCastling,
        rookMove
      });
      return; // Wait for promotion selection
    }

    completeMove(newBoard, fromSquare, toSquare, piece, capturedPiece, isCastling, rookMove);
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
      promotionSquare.isCastling,
      promotionSquare.rookMove
    );
    setPromotionSquare(null);
  };

  // Generate the chessboard
  const renderBoard = () => {
    const squares = [];
    
    // Determine if we should flip the board
    const isFlipped = playerColor === PIECE_COLORS.BLACK;
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        // Calculate the actual row and column based on whether the board is flipped
        const row = isFlipped ? 7 - r : r;
        const col = isFlipped ? 7 - c : c;
        
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
      {isAiThinking && (
        <div className="ai-thinking-indicator">AI is thinking...</div>
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
