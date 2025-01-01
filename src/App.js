import React, { useState, useEffect } from 'react';          // Import React and useState to manage state
import { Chessboard } from 'react-chessboard';    // Import Chessboard component from react-chessboard
import { Chess } from 'chess.js';                 // Import Chess logic from chess.js

// Function to extract best move and evaluation from Stockfish's message
const getEvaluation = (message, turn) => {
    let result = { bestMove: "", evaluation: "" }; // Initialize with default values

    // Check for "bestmove" in the message to get the best move
    if (message.startsWith("bestmove")) {
        result.bestMove = message.split(" ")[1];
    }

    // Check for "info score" message to get the evaluation
    if (message.includes("info") && message.includes("score")) {
        const scoreParts = message.split(" ");
        const scoreIndex = scoreParts.indexOf("score") + 2; // "cp" or "mate" is two words after "score"

        if (scoreParts[scoreIndex - 1] === "cp") {
            // Extract centipawn evaluation and adjust based on turn
            let score = parseInt(scoreParts[scoreIndex], 10);
            if (turn !== "b") {
                score = -score; // Invert score if it was Black's turn
            }
            result.evaluation = `${score / 100}`; // Convert centipawns to pawns

        } else if (scoreParts[scoreIndex - 1] === "mate") {
            // Extract mate score if available
            const mateIn = parseInt(scoreParts[scoreIndex], 10);
            result.evaluation = `Mate in ${Math.abs(mateIn)}`;
        }
    }

    return result;
};

// Main App component
const App = () => {
    // Initialize the game state using useState with a new Chess instance
    const [game, setGame] = useState(new Chess());
    // Initialize state for the Stockfish Web Worker instance
    const [stockfish, setStockfish] = useState(null);
    // Initialize state for storing Stockfish's suggested best move
    const [bestMove, setBestMove] = useState("");
    const [evaluation, setEvaluation] = useState(""); // State to store Stockfish's evaluation

    // useEffect to set up Stockfish as a Web Worker when the component first loads (mounts)
    useEffect(() => {
        // Create a new Web Worker for Stockfish from the JavaScript file we downloaded
        const stockfishWorker = new Worker(`${process.env.PUBLIC_URL}/js/stockfish-16.1-lite-single.js`);
        setStockfish(stockfishWorker); // Save this worker instance in state for access elsewhere in the component

        // Listen for messages sent back from Stockfish
        stockfishWorker.onmessage = (event) => {
            const message = event.data; // Capture the message data from Stockfish
            // Check if Stockfish has sent a "bestmove" response
            if (message.startsWith("bestmove")) {
                const move = message.split(" ")[1]; // Extract the best move from the message
                setBestMove(move); // Save the best move in state to display on the screen
            }
        };

        // Clean up the worker when the component is removed from the screen (unmounted)
        return () => {
            stockfishWorker.terminate(); // Terminates the worker to free up resources
        };
    }, []); // Empty dependency array means this runs only once when the component mounts

    // Function to handle piece movement on the chessboard
    const onDrop = (sourceSquare, targetSquare, piece) => {
        // Create a copy of the current game state using FEN notation
        const gameCopy = new Chess(game.fen());
        console.log(piece, typeof piece);
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

            // Send the new position to Stockfish for analysis
            if (stockfish) {
                stockfish.postMessage(`position fen ${gameCopy.fen()}`); // Send the board position in FEN format
                stockfish.postMessage("go depth 15"); // Instruct Stockfish to analyze the position up to a depth of 15 moves

                // Listen for Stockfish messages and update best move and evaluation
                stockfish.onmessage = (event) => {
                    const { bestMove, evaluation } = getEvaluation(event.data, game.turn());
                    if (bestMove) setBestMove(bestMove);
                    if (evaluation) setEvaluation(evaluation);
                };
            }

            return true; // Return true to indicate a valid move
        } catch (error) {
            // Catch and log any errors that occur during the move attempt
            console.error(error.message);
            return false; // Return false to ignore the invalid move
        }
    };

    return (
        <div className='root'>
            <h1>Chess Game</h1>
            <Chessboard
                position={game.fen()}      // Set the chessboard position to the current game state
                onPieceDrop={onDrop}       // Trigger the onDrop function when a piece is moved
                boardWidth={400}           // Set the width of the chessboard to 500px
                customBoardStyle={{ borderRadius: '5px', boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)' }}
            />
            <div>
                {/* Display Stockfish's suggested best move or show "Calculating..." if no move is available yet */}
                <h3>Best Move: {bestMove || "Calculating..."}</h3>
                <h3>Evaluation: {evaluation || "Evaluating..."}</h3>
            </div>
        </div>
    );
};

export default App;  // Export the App component as the default export
