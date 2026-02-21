import React, { useState, useEffect } from 'react';          // Import React and useState to manage state
import { Chessboard } from 'react-chessboard';    // Import Chessboard component from react-chessboard
import { Chess } from 'chess.js';                 // Import Chess logic from chess.js
import { customPieces } from './customPieces.js';

// Main App component
const App = () => {
    // Initialize the game state using useState with a new Chess instance
    const [game, setGame] = useState(new Chess());
    // Initialize state for the Stockfish Web Worker instance
    const [stockfish, setStockfish] = useState(null);
    const [currentLines, setCurrentLines] = useState([]); // Holds evaluations for the current move
    const [previousLines, setPreviousLines] = useState([]); // Holds evaluations for the previous move
    const [bestEvaluation, setBestEvaluation] = useState(null); // Stores the eval value of the best move
    const [lastMove, setLastMove] = useState(null); // Stores the last move played by the user
    const [moveCategory, setMoveCategory] = useState(""); // Stores the category of the user's move
    // State variables for tracking the last move's from and to squares
    const [fromSquare, setFromSquare] = useState(null); // Holds the starting square of the last move
    const [toSquare, setToSquare] = useState(null);     // Holds the destination square of the last move
    // State to hold the best move's starting and ending squares for the arrow
    const [bestMoveArrow, setBestMoveArrow] = useState([]);
    const [boardOrientation, setBorderOrientation] = useState("white");

    // useEffect to set up Stockfish as a Web Worker when the component first loads (mounts)
    useEffect(() => {
        // Create a new Web Worker for Stockfish from the JavaScript file we downloaded
        const stockfishWorker = new Worker(`${process.env.PUBLIC_URL}/js/stockfish-16.1-lite-single.js`);
        setStockfish(stockfishWorker); // Save this worker instance in state for access elsewhere in the component

        // Clean up the worker when the component is removed from the screen (unmounted)
        return () => {
            stockfishWorker.terminate(); // Terminates the worker to free up resources
        };
    }, []); // Empty dependency array means this runs only once when the component mounts

    const getEvaluation = (fen) => {
        return new Promise((resolve) => {
            const lines = []; // Array to store the top 3 lines of evaluations
            stockfish.postMessage("setoption name MultiPV value 3"); // Set Stockfish to calculate top 3 PVs
            stockfish.postMessage(`position fen ${fen}`); // Set the position to the current FEN
            stockfish.postMessage("go depth 15"); // Instruct Stockfish to calculate up to a depth of 12

            const isBlackTurn = fen.split(" ")[1] === "b"; // Check if it's Black's turn from the FEN string

            // Handle messages from Stockfish
            stockfish.onmessage = (event) => {
                const message = event.data;

                // Check for "bestmove" in the message to get the best move
                if (message.startsWith("bestmove")) {
                    const bestMove = message.split(" ")[1];

                    if (bestMove) {
                        // Extract starting and ending squares from the best move
                        const fromSquare = bestMove.slice(0, 2); // First two characters
                        const toSquare = bestMove.slice(2, 4);   // Last two characters
                        setBestMoveArrow([[fromSquare, toSquare]]); // Set arrow for best move
                    }
                }

                // Only process messages that contain evaluations at depth 12
                if (message.startsWith("info depth 15")) {
                    // Check for "info score" message to get the evaluation
                    if (message.includes("info") && message.includes("score")) {
                        const scoreParts = message.split(" ");
                        const scoreIndex = scoreParts.indexOf("score") + 2; // "cp" or "mate" is two words after "score"
                        const moves = message.split(" pv ")[1].split(" "); // Split moves into an array

                        if (scoreParts[scoreIndex - 1] === "cp") {
                            // Extract centipawn evaluation and adjust based on turn
                            let evalScore = parseInt(scoreParts[scoreIndex], 10) / 100;
                            // Flip the evaluation score if it's Black's turn
                            if (isBlackTurn) {
                                evalScore = -evalScore;
                            }
                            // Add the evaluation and moves to the lines array
                            lines.push({ eval: evalScore, moves });
                        } else if (scoreParts[scoreIndex - 1] === "mate") {
                            // Extract mate score if available
                            const mateIn = parseInt(scoreParts[scoreIndex], 10);
                            lines.push({ eval: `Mate in ${Math.abs(mateIn)}`, moves });
                        }

                        // Stop and resolve once we have the top 3 lines at depth 15
                        if (lines.length === 3) {
                            stockfish.postMessage("stop"); // Stop Stockfish once we have 3 evaluations

                            // Sort lines based on whose turn it is
                            lines.sort((a, b) => (isBlackTurn ? a.eval - b.eval : b.eval - a.eval));

                            // Update previousLines with the current currentLines before refreshing currentLines
                            setPreviousLines(currentLines);
                            // Update currentLines with the new sorted evaluations
                            setCurrentLines(lines);
                            // Set bestEvaluation to the eval value of the top line for comparison
                            setBestEvaluation(lines[0].eval);
                            resolve(lines); // Resolve the promise with the top 3 lines
                        }
                    }
                }
            };
        });
    };

    // Function to handle piece movement on the chessboard
    const onDrop = async (sourceSquare, targetSquare, piece) => {
        // Create a copy of the current game state using FEN notation
        const gameCopy = new Chess(game.fen());
        try {
            // Attempt to make the move on the game copy
            const move = gameCopy.move({
                from: sourceSquare,   // Starting square of the move
                to: targetSquare,     // Target square of the move
                promotion: piece[1].toLowerCase()
            });

            // If the move is invalid, move will be null, so we return false to ignore the move
            if (move === null) {
                return false;
            }

            // If the move is valid, update the game state with the new position
            setGame(gameCopy);
            // Update last move states for highlighting
            setFromSquare(sourceSquare); // Update the starting square of the last move
            setToSquare(targetSquare);   // Update the destination square of the last move
            setLastMove(`${sourceSquare}${targetSquare}`); // Save the last move played

            await getEvaluation(gameCopy.fen());

            return true; // Return true to indicate a valid move
        } catch (error) {
            // Catch and log any errors that occur during the move attempt
            console.error(error.message);
            return false; // Return false to ignore the invalid move
        }
    };

    // Function to define custom styles for the last move's from and to squares
    const getSquareStyles = () => {
        const styles = {}; // Initialize an empty object for square styles
        if (fromSquare) {
            styles[fromSquare] = { backgroundColor: "rgba(205, 210, 106, 0.8)" }; // Light blue for the from-square
        }
        if (toSquare) {
            styles[toSquare] = { backgroundColor: "rgba(205, 210, 106, 0.8)" }; // Light green for the to-square
        }
        return styles; // Return the styles object
    };

    return (
        <div className='root'>
            <h1>Chess Game</h1>
            <div className='board-container'>
                <Chessboard
                    position={game.fen()}      // Set the chessboard position to the current game state
                    onPieceDrop={onDrop}       // Trigger the onDrop function when a piece is moved
                    boardWidth={window.innerWidth > 400 ? window.innerWidth * 0.3 : window.innerWidth * 0.9}           // Set the width of the chessboard to 500px
                    customBoardStyle={{ borderRadius: '5px', boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)' }}
                    customPieces={customPieces} // Pass custom pieces
                    customSquareStyles={getSquareStyles()} // Apply last move highlight styles
                    customArrows={bestMoveArrow} // Pass the best move arrow to render on the board
                    customArrowColor={"rgba(67, 160, 71, 0.8)"} // Set the custom arrow color
                    arePremovesAllowed={false}
                    boardOrientation={boardOrientation}
                />
                <div className='settings'>
                    <button onClick={() => setBorderOrientation(boardOrientation === "white" ? "black" : "white")}>Flip</button>
                </div>
            </div>
            <div className='analize'>
                <ul className='list'>
                    {currentLines.map((line, index) => (
                        <li key={index} className='item'>
                            <strong>Line {index + 1}:</strong> {line.eval} <br />
                            <strong>Moves:</strong> {line.moves.join(" ")}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default App;  // Export the App component as the default export
