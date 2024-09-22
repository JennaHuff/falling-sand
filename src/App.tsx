import { useState, useCallback, useEffect } from "react";

const GRID_SIZE = 32;
const INTERVAL = 100;
const PIXEL_SIZE = "20px";

function Grid({
    grid,
    setFallingCubes,
}: {
    grid: boolean[][];
    setFallingCubes: React.Dispatch<React.SetStateAction<boolean[][]>>;
}) {
    const activateCell = useCallback(
        (rowIndex: number, colIndex: number) => {
            setFallingCubes((prevGrid) => {
                const newGrid = prevGrid.map((row) => [...row]);
                newGrid[rowIndex][colIndex] = true;
                return newGrid;
            });
        },
        [setFallingCubes]
    );

    return (
        <div style={{ display: "inline-block", border: "1px solid black" }}>
            {grid.map((row, rowIndex) => (
                <div key={rowIndex} style={{ display: "flex" }}>
                    {row.map((cell, colIndex) => (
                        <div
                            key={`${rowIndex}-${colIndex}`}
                            style={{
                                backgroundColor: cell ? "orange" : "white",
                                width: PIXEL_SIZE,
                                height: PIXEL_SIZE,
                                userSelect: "none",
                            }}
                            onMouseEnter={(e) => {
                                if (e.buttons === 1) {
                                    activateCell(rowIndex, colIndex);
                                }
                            }}
                            onMouseDown={() => activateCell(rowIndex, colIndex)}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

function App() {
    const [gridState, setGrid] = useState(() => {
        const grid = [];
        for (let i = 0; i < GRID_SIZE; i++) {
            const row = Array(GRID_SIZE).fill(false);
            grid.push(row);
        }
        return grid;
    });
    useEffect(() => {
        const intervalId = setInterval(() => {
            const newTab = [...gridState];

            for (let row = newTab.length - 1; row > 0; row--) {
                for (let col = 0; col < newTab[row].length; col++) {
                    if (
                        newTab[row - 1][col] === true &&
                        newTab[row][col] === false
                    ) {
                        newTab[row][col] = true;
                        newTab[row - 1][col] = false;
                    }
                }
            }
            setGrid(() => newTab);
        }, INTERVAL);
        return () => clearInterval(intervalId);
    }, [gridState]);

    return <Grid grid={gridState} setFallingCubes={setGrid} />;
}

export default App;
