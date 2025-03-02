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
import { getNextMove } from '../utils/llm';
// Remove evaluateBoard from import since it's not used
import { getBestMove } from '../utils/chessAI';
import { 
  boardArrayToFen
} from '../utils/chessUtils';
import '../styles/ChessBoard.css';
import PromotionDialog from './PromotionDialog';

const ChessBoard = ({ currentPlayer, onMove, moveHistory, onGameOver, playerColor }) => {
  // Initialize with properly converted board from FEN
  // const initialFen = getInitialFen();
  const [board, setBoard] = useState(() => initializeBoard());
  // Remove the currentFen state since it's not used in the UI
  // Instead, we'll generate it when needed without storing it in state
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [checkStatus, setCheckStatus] = useState({
    white: false,
    black: false
  });
  const [enPassantTarget, setEnPassantTarget] = useState(null);
  const [promotionSquare, setPromotionSquare] = useState(null);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Track castling rights
  const [castlingRights, setCastlingRights] = useState({
    K: true, // White kingside
    Q: true, // White queenside
    k: true, // Black kingside
    q: true  // Black queenside
  });
  
  // Track halfmove clock (resets on pawn moves and captures)
  const [halfmoveClock, setHalfmoveClock] = useState(0);
  
  // Track fullmove number (increments after Black's move)
  const [fullmoveNumber, setFullmoveNumber] = useState(1);

  // Function to generate accurate FEN from current board state
  const generateCurrentFen = useCallback(() => {
    const turn = currentPlayer === 'white' ? 'w' : 'b';
    let enPassantStr = '-'; // Default value if no en passant target
    
    if (enPassantTarget) {
      // The enPassant target is the square behind the pawn that just made a double move
      // For white pawn that moved from row 6 to 4, the enPassant square is on row 5
      // For black pawn that moved from row 1 to 3, the enPassant square is on row 2
      const file = String.fromCharCode(97 + enPassantTarget.col); // 'a' to 'h'
      
      // The rank depends on the direction the pawn moved
      let rank;
      if (enPassantTarget.color === 'white') {
        // White pawn moved down the board (from row 6 to row 4)
        rank = 3; // The square behind is on rank 3 (index 5)
      } else {
        // Black pawn moved up the board (from row 1 to row 3)
        rank = 6; // The square behind is on rank 6 (index 2)
      }
      
      enPassantStr = file + (8 - rank);
    }
    
    // Generate FEN with all the proper state
    const fen = boardArrayToFen(
      board, 
      turn, 
      castlingRights, 
      enPassantStr,
      halfmoveClock,
      fullmoveNumber
    );
    
    console.log("Generated FEN:", fen);
    return fen;
  }, [board, castlingRights, currentPlayer, enPassantTarget, halfmoveClock, fullmoveNumber]);

  // Update debug logs whenever board changes, but don't save to state
  useEffect(() => {
    if (board) {
      const newFen = generateCurrentFen();
      
      // Debug: Validate the board matches the FEN
      console.log("Current board state:", board);
      console.log("Current FEN state:", newFen);
    }
  }, [board, generateCurrentFen]);

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
  // Remove enPassantTarget from dependencies since it's only used inside a callback
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

    // Update castling rights if king or rook moves
    const newCastlingRights = { ...castlingRights };
    
    if (piece.type === 'king') {
      if (piece.color === 'white') {
        newCastlingRights.K = false;
        newCastlingRights.Q = false;
      } else {
        newCastlingRights.k = false;
        newCastlingRights.q = false;
      }
    } else if (piece.type === 'rook') {
      // Check if it's a corner rook
      if (fromSquare.row === 7 && fromSquare.col === 0) newCastlingRights.Q = false; // White queenside
      if (fromSquare.row === 7 && fromSquare.col === 7) newCastlingRights.K = false; // White kingside
      if (fromSquare.row === 0 && fromSquare.col === 0) newCastlingRights.q = false; // Black queenside
      if (fromSquare.row === 0 && fromSquare.col === 7) newCastlingRights.k = false; // Black kingside
    }
    
    // If a rook is captured in its original corner, remove castling right for that side
    if (capturedPiece && capturedPiece.type === 'rook') {
      if (toSquare.row === 0 && toSquare.col === 0) newCastlingRights.q = false; // Black queenside
      if (toSquare.row === 0 && toSquare.col === 7) newCastlingRights.k = false; // Black kingside
      if (toSquare.row === 7 && toSquare.col === 0) newCastlingRights.Q = false; // White queenside
      if (toSquare.row === 7 && toSquare.col === 7) newCastlingRights.K = false; // White kingside
    }
    
    setCastlingRights(newCastlingRights);
    
    // Update halfmove clock
    let newHalfmoveClock = halfmoveClock;
    if (piece.type === 'pawn' || capturedPiece !== null) {
      // Reset on pawn moves or captures
      newHalfmoveClock = 0;
    } else {
      // Increment otherwise
      newHalfmoveClock++;
    }
    setHalfmoveClock(newHalfmoveClock);
    
    // Update fullmove number (increments after Black's move)
    let newFullmoveNumber = fullmoveNumber;
    if (piece.color === 'black') {
      newFullmoveNumber++;
    }
    setFullmoveNumber(newFullmoveNumber);

    // Update the board state
    setBoard(newBoard);

    // Set en passant target if pawn moves two squares
    if (piece.type === 'pawn' && Math.abs(toSquare.row - fromSquare.row) === 2) {
      // Store the pawn's position and the square it moved through (the actual en passant target)
      const targetRow = piece.color === 'white' ? fromSquare.row - 1 : fromSquare.row + 1;
      
      setEnPassantTarget({
        row: targetRow,
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
  }, [onMove, castlingRights, halfmoveClock, fullmoveNumber]); // Removed enPassantTarget dependency

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
        console.log("===========================================");
        console.log("STARTING AI MOVE PROCESS");
        console.log("===========================================");

        try {
          // Generate the current FEN state using our utility function
          const currentFenState = generateCurrentFen();
          console.log("===========================================");
          console.log("GENERATED FEN FOR CURRENT POSITION:", currentFenState);
          console.log("CURRENT TURN:", currentPlayer);
          console.log("===========================================");
          
          // Try to get move from Stockfish+LLM pipeline
          let move = null;
          
          try {
            console.log("Attempting to get move from Stockfish+LLM pipeline");
            move = await getNextMove(currentFenState);
            console.log("===========================================");
            console.log("RECEIVED MOVE FROM LLM:", move);
            console.log("===========================================");
          } catch (llmError) {
            console.error("Error in LLM/Stockfish pipeline:", llmError);
            console.log("===========================================");
            console.log("LLM PIPELINE FAILED, WILL USE CHESS AI FALLBACK");
            console.log("===========================================");
            move = null;
          }
          
          // If we got a valid move from the LLM pipeline, use it
          if (move && move.from && move.to) {
            // Convert algebraic notation (e.g., e2) to board coordinates (row, col)
            const fromCoords = algebraicToCoords(move.from);
            const toCoords = algebraicToCoords(move.to);
            console.log("Converted from coordinates:", fromCoords);
            console.log("Converted to coordinates:", toCoords);
            
            const newBoard = JSON.parse(JSON.stringify(board));
            
            if (fromCoords && toCoords && newBoard[fromCoords.row]?.[fromCoords.col]) {
              const piece = newBoard[fromCoords.row][fromCoords.col];
              const capturedPiece = newBoard[toCoords.row][toCoords.col];
              
              console.log("Piece to move:", piece);
              console.log("Captured piece:", capturedPiece);
            
              // Update piece properties
              if (piece) {
                piece.hasMoved = true;
                
                // Make the move on the board
                const isCastling = piece.type === 'king' && Math.abs(toCoords.col - fromCoords.col) > 1;
                let rookMove = null;
                
                // Handle castling - identify rook move
                if (isCastling) {
                  console.log("This is a castling move");
                  const backRow = piece.color === 'white' ? 7 : 0;
                  
                  if (toCoords.col > fromCoords.col) {  // Kingside
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
                
                console.log("Executing move on the board from LLM suggestion");
                // Complete the move
                completeMove(
                  newBoard,
                  fromCoords,
                  toCoords,
                  piece,
                  capturedPiece,
                  isCastling,
                  rookMove
                );
                return; // Successfully made the move, exit the function
              }
            } else {
              console.error("Invalid coordinates from LLM move:", fromCoords, toCoords);
              // Will fall back to chess AI
            }
          }
          
          // If we get here, the LLM move was null or invalid, use chessAI fallback
          console.log("===========================================");
          console.log("USING CHESSAI FALLBACK LOGIC FOR MOVE GENERATION");
          console.log("===========================================");
          
          // Generate all possible AI moves using standard chess logic
          const allMoves = [];
          console.log("Generating all legal moves for AI...");
          
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
          
          console.log(`Generated ${allMoves.length} possible moves`);
          
          if (allMoves.length > 0) {
            // Use the chessAI evaluation function to pick the best move
            console.log("Evaluating moves and selecting best move...");
            const bestMove = getBestMove(board, allMoves);
            console.log("Selected best move:", bestMove);
            
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
            
            console.log("Executing move from chessAI");
            completeMove(
              newBoard,
              bestMove.from,
              bestMove.to,
              piece,
              capturedPiece,
              isCastling,
              rookMove
            );
          } else {
            console.error("No legal moves available for AI!");
            // Handle game over scenario
            onGameOver && onGameOver('stalemate');
          }
        } catch (error) {
          console.error("Critical error making AI move:", error);
          
          // Final fallback - attempt to make any valid move
          try {
            console.log("===========================================");
            console.log("EMERGENCY FALLBACK: TRYING ANY VALID MOVE");
            console.log("===========================================");
            
            const allMoves = [];
            for (let row = 0; row < 8; row++) {
              for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.color === currentPlayer) {
                  const moves = calculatePossibleMoves(row, col, piece, board, enPassantTarget);
                  moves.forEach(move => allMoves.push({
                    from: { row, col },
                    to: move,
                    piece
                  }));
                }
              }
            }
            
            if (allMoves.length > 0) {
              // Just pick a random move
              const randomMove = allMoves[Math.floor(Math.random() * allMoves.length)];
              const newBoard = JSON.parse(JSON.stringify(board));
              const piece = newBoard[randomMove.from.row][randomMove.from.col];
              const capturedPiece = newBoard[randomMove.to.row][randomMove.to.col];
              
              completeMove(
                newBoard,
                randomMove.from,
                randomMove.to,
                piece,
                capturedPiece,
                false,
                null
              );
            }
          } catch (fallbackError) {
            console.error("All AI move attempts failed:", fallbackError);
          }
        } finally {
          setIsAiThinking(false);
          console.log("===========================================");
          console.log("AI MOVE PROCESS COMPLETED");
          console.log("===========================================");
        }
      };
      
      makeAIMove();
    }
  }, [currentPlayer, board, playerColor, moveHistory, calculatePossibleMoves, completeMove, 
      enPassantTarget, isAiThinking, onGameOver, generateCurrentFen]); // Removed evaluateBoard

  // Helper function to convert algebraic notation (e.g., "e2") to board coordinates
  const algebraicToCoords = (square) => {
    if (!square || typeof square !== 'string' || square.length !== 2) {
      return null;
    }
    
    const file = square.charCodeAt(0) - 'a'.charCodeAt(0); // 'a' -> 0, 'b' -> 1, etc.
    const rank = 8 - parseInt(square.charAt(1));           // '1' -> 7, '2' -> 6, etc.
    
    if (file < 0 || file > 7 || rank < 0 || rank > 7) {
      return null;
    }
    
    return { row: rank, col: file };
  };

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
    
    // Handle en passant capture - Add a check for selectedMove existence
    const selectedMove = possibleMoves.find(m => m.row === toSquare.row && m.col === toSquare.col);
    if (selectedMove && selectedMove.isEnPassant && selectedMove.capturedPawnPosition) {
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
      
      {/* Add FEN display for debugging */}
      {/* <div className="fen-display" style={{position: 'absolute', bottom: '-30px', left: 0, fontSize: '10px', width: '100%', textAlign: 'center'}}>
        FEN: {currentFen}
      </div> */}
    </div>
  );
};

export default ChessBoard;
