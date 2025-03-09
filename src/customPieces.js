// Define the custom pieces logic
export const customPieces = {
    wP: ({ squareWidth }) => (
        <img
            src={`${process.env.PUBLIC_URL}/img/pieces/wP.svg`}
            style={{ width: squareWidth, height: squareWidth }}
            alt="White Pawn"
        />
    ),
    wN: ({ squareWidth }) => (
        <img
            src={`${process.env.PUBLIC_URL}/img/pieces/wN.svg`}
            style={{ width: squareWidth, height: squareWidth }}
            alt="White Knight"
        />
    ),
    wB: ({ squareWidth }) => (
        <img
            src={`${process.env.PUBLIC_URL}/img/pieces/wB.svg`}
            style={{ width: squareWidth, height: squareWidth }}
            alt="White Bishop"
        />
    ),
    wR: ({ squareWidth }) => (
        <img
            src={`${process.env.PUBLIC_URL}/img/pieces/wR.svg`}
            style={{ width: squareWidth, height: squareWidth }}
            alt="White Rook"
        />
    ),
    wQ: ({ squareWidth }) => (
        <img
            src={`${process.env.PUBLIC_URL}/img/pieces/wQ.svg`}
            style={{ width: squareWidth, height: squareWidth }}
            alt="White Queen"
        />
    ),
    wK: ({ squareWidth }) => (
        <img
            src={`${process.env.PUBLIC_URL}/img/pieces/wK.svg`}
            style={{ width: squareWidth, height: squareWidth }}
            alt="White King"
        />
    ),
    bP: ({ squareWidth }) => (
        <img
            src={`${process.env.PUBLIC_URL}/img/pieces/bP.svg`}
            style={{ width: squareWidth, height: squareWidth }}
            alt="Black Pawn"
        />
    ),
    bN: ({ squareWidth }) => (
        <img
            src={`${process.env.PUBLIC_URL}/img/pieces/bN.svg`}
            style={{ width: squareWidth, height: squareWidth }}
            alt="Black Knight"
        />
    ),
    bB: ({ squareWidth }) => (
        <img
            src={`${process.env.PUBLIC_URL}/img/pieces/bB.svg`}
            style={{ width: squareWidth, height: squareWidth }}
            alt="Black Bishop"
        />
    ),
    bR: ({ squareWidth }) => (
        <img
            src={`${process.env.PUBLIC_URL}/img/pieces/bR.svg`}
            style={{ width: squareWidth, height: squareWidth }}
            alt="Black Rook"
        />
    ),
    bQ: ({ squareWidth }) => (
        <img
            src={`${process.env.PUBLIC_URL}/img/pieces/bQ.svg`}
            style={{ width: squareWidth, height: squareWidth }}
            alt="Black Queen"
        />
    ),
    bK: ({ squareWidth }) => (
        <img
            src={`${process.env.PUBLIC_URL}/img/pieces/bK.svg`}
            style={{ width: squareWidth, height: squareWidth }}
            alt="Black King"
        />
    ),
};