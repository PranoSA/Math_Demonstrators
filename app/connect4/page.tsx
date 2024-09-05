'use client';

import { useEffect, useState, useRef } from 'react';

const Connect4 = () => {
  const [board, setBoard] = useState<number[][]>(
    Array.from({ length: 6 }, () => Array(7).fill(0))
  );

  //boardRef -> interact with boardRef directly and use setBoard for rendering only
  const boardRef = useRef<number[][]>(
    Array.from({ length: 6 }, () => Array(7).fill(0))
  );

  const [isYourTurn, setIsYourTurn] = useState(true);
  const [winner, setWinner] = useState<null | string>(null);
  const [isSinglePlayer, setIsSinglePlayer] = useState(true);
  const ws = useRef<WebSocket | null>(null);

  const [winningMoves, setWinningMoves] = useState<number[][]>([]);
  const [extraEncodingBits, setExtraEncodingBits] = useState<number[][]>([]);

  useEffect(() => {
    if (!isSinglePlayer) {
      ws.current = new WebSocket('ws://your-websocket-url');

      ws.current.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'your_turn') {
          setIsYourTurn(true);
        } else if (message.type === 'turn') {
          handleOpponentTurn(message.column);
        } else if (message.type === 'winner') {
          setWinner(message.winner);
        }
      };

      return () => {
        ws.current?.close();
      };
    }
  }, [isSinglePlayer]);

  useEffect(() => {
    if (!isYourTurn && isSinglePlayer && !winner) {
      const availableColumns = board[0]
        .map((_, colIndex) => colIndex)
        .filter((colIndex) => !board[0][colIndex]);
      const randomColumn =
        availableColumns[Math.floor(Math.random() * availableColumns.length)];
      placePiece(randomColumn, 2); // 2 represents the opponent's piece
      setIsYourTurn(true);
    }
  }, [board, isYourTurn, isSinglePlayer, winner]);

  const handleOpponentTurn = (column: number) => {
    placePiece(column, 2); // 2 represents the opponent's piece
    setIsYourTurn(true);
  };

  const placePiece = (column: number, player: number) => {
    const newBoard = boardRef.current.map((row) => row.slice());
    for (let row = 5; row >= 0; row--) {
      if (!newBoard[row][column]) {
        newBoard[row][column] = player;
        break;
      }
    }
    setBoard(newBoard);
    checkWinner(newBoard, column);
    boardRef.current = newBoard;
    console.log(newBoard);
  };

  const checkWinner = (board: (null | number)[][], column: number) => {
    // Infer the row of the last move
    let row = -1;
    for (let r = 0; r < board.length; r++) {
      if (board[r][column] !== null && board[r][column] !== 0) {
        row = r;
        break;
      }
    }

    if (row === -1) return; // No move found in this column

    const player = board[row][column];

    // Helper function to check a line of four cells
    const checkLine = (cells: (null | number)[]) => {
      return cells.every((cell) => cell === player);
    };

    //get length of board
    const top_row = board.length - 1;

    //we now have row, column, player
    // so if row is 3 or more, we can check vertical
    /**
     * ^
     * |
     * |
     * |
     *
     */
    if (row <= top_row - 3) {
      if (
        checkLine([
          board[row][column],
          board[row + 1][column],
          board[row + 2][column],
          board[row + 3][column],
        ])
      ) {
        setWinner(player === 1 ? 'Player' : 'Opponent');
        setWinningMoves([
          [row, column],
          [row + 1, column],
          [row + 2, column],
          [row + 3, column],
        ]);

        return;
      }
    }

    /**             >
     *     -|
     * -}
     */
    //if row is 5 or more, and column is 3 or less, we can check diagonal (bottom--rhg to top left)
    //This did not work for some reason?
    const left_col = board[0].length - 1;

    //if row is more than 3 higher than bottom row
    if (row <= top_row - 3 && column <= left_col - 3) {
      if (
        checkLine([
          board[row][column],
          board[row + 1][column + 1],
          board[row + 2][column + 2],
          board[row + 3][column + 3],
        ])
      ) {
        setWinner(player === 1 ? 'Player' : 'Opponent');
        setWinningMoves([
          [row, column],
          [row + 1, column + 1],
          [row + 2, column + 2],
          [row + 3, column + 3],
        ]);

        return;
      }
    }

    //if row is 5 or more, and column ir 5 or more, we can check diagonal (bottom-left to top right-
    if (row <= top_row - 3 && column >= 3) {
      if (
        checkLine([
          board[row][column],
          board[row + 1][column - 1],
          board[row + 2][column - 2],
          board[row + 3][column - 3],
        ])
      ) {
        setWinner(player === 1 ? 'Player' : 'Opponent');
        setWinningMoves([
          [row, column],
          [row + 1, column - 1],
          [row + 2, column - 2],
          [row + 3, column - 3],
        ]);
        return;
      }
    }

    // if column is 3 or more, we can check horizontal to the left
    if (column >= 3) {
      if (
        checkLine([
          board[row][column],
          board[row][column - 1],
          board[row][column - 2],
          board[row][column - 3],
        ])
      ) {
        setWinner(player === 1 ? 'Player' : 'Opponent');
        setWinningMoves([
          [row, column],
          [row, column - 1],
          [row, column - 2],
          [row, column - 3],
        ]);
        return;
      }
    }

    // if column is 3 or less, we can check horizontal to the right
    if (column <= left_col - 3) {
      if (
        checkLine([
          board[row][column],
          board[row][column + 1],
          board[row][column + 2],
          board[row][column + 3],
        ])
      ) {
        setWinner(player === 1 ? 'Player' : 'Opponent');
        setWinningMoves([
          [row, column],
          [row, column + 1],
          [row, column + 2],
          [row, column + 3],
        ]);
        return;
      }
    }
  };

  const handleColumnClick = (column: number) => {
    if (!isYourTurn || winner) return;

    placePiece(column, 1); // 1 represents the player's piece
    setIsYourTurn(false);
  };

  const toggleGameMode = () => {
    setIsSinglePlayer(!isSinglePlayer);
    resetGame();
  };

  const resetGame = () => {
    setBoard(Array.from({ length: 6 }, () => Array(7).fill(null)));
    setIsYourTurn(true);
    setWinner(null);
  };

  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Connect4</h1>
      {winner && <h2 className="text-xl text-red-500 mb-4">{winner} wins!</h2>}
      <button
        onClick={toggleGameMode}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition"
      >
        Switch to {isSinglePlayer ? 'Multiplayer' : 'Single Player'} Mode
      </button>
      <div className="grid grid-cols-7 gap-1">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isWinningCell = winningMoves.some(
              ([winRow, winCol]) => winRow === rowIndex && winCol === colIndex
            );
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleColumnClick(colIndex)}
                onMouseEnter={() => setHoveredColumn(colIndex)}
                onMouseLeave={() => setHoveredColumn(null)}
                className={`w-12 h-12 border flex items-center justify-center cursor-pointer transition ${
                  cell === 1
                    ? 'bg-red-500'
                    : cell === 2
                    ? 'bg-black'
                    : 'bg-white'
                } ${
                  hoveredColumn === colIndex && rowIndex === 5
                    ? 'hover:bg-yellow-300'
                    : ''
                } ${
                  isWinningCell ? 'border-4 border-green-500' : 'border-black'
                }`}
              />
            );
          })
        )}
      </div>
      {!isYourTurn && !winner && (
        <h2 className="text-lg text-gray-500 mt-4">Waiting for opponent...</h2>
      )}
    </div>
  );
};

export default Connect4;
