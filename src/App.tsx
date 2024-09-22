import React, { useState, useCallback, useEffect, useRef } from "react";

const GRID_SIZE = 128;
const CANVAS_SIZE = 512;
const PIXEL_SIZE = CANVAS_SIZE / GRID_SIZE;
const GRAVITY = 0.05;
const INTERVAL = 16;
const INITIAL_VELOCITY = 0.1;

interface Particle {
    x: number;
    y: number;
    vy: number;
    isBlue: boolean;
}

const Grid: React.FC<{
    grid: Uint8Array;
    setFallingCubes: React.Dispatch<React.SetStateAction<Uint8Array>>;
    particles: Particle[];
    brushSize: number;
    isBlueMode: boolean;
}> = React.memo(
    ({ grid, setFallingCubes, particles, brushSize, isBlueMode }) => {
        const canvasRef = useRef<HTMLCanvasElement>(null);

        const drawGrid = useCallback(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const scale = canvas.width / GRID_SIZE;

            for (let i = 0; i < grid.length; i++) {
                if (grid[i] !== 0) {
                    const x = (i % GRID_SIZE) * scale;
                    const y = Math.floor(i / GRID_SIZE) * scale;
                    ctx.fillStyle = grid[i] === 1 ? "orange" : "blue";
                    ctx.fillRect(x, y, scale, scale);
                }
            }

            particles.forEach((particle) => {
                const x = Math.floor(particle.x / PIXEL_SIZE) * scale;
                const y = Math.floor(particle.y / PIXEL_SIZE) * scale;
                ctx.fillStyle = particle.isBlue ? "blue" : "orange";
                ctx.fillRect(x, y, scale, scale);
            });
        }, [grid, particles]);

        useEffect(() => {
            const resizeCanvas = () => {
                const canvas = canvasRef.current;
                if (canvas) {
                    const container = canvas.parentElement;
                    if (container) {
                        canvas.width = container.clientWidth;
                        canvas.height = container.clientHeight;
                        drawGrid();
                    }
                }
            };

            resizeCanvas();
            window.addEventListener("resize", resizeCanvas);

            return () => window.removeEventListener("resize", resizeCanvas);
        }, [drawGrid]);

        useEffect(() => {
            drawGrid();
        }, [drawGrid]);

        const activateCell = useCallback(
            (x: number, y: number) => {
                const canvas = canvasRef.current;
                if (!canvas) return;

                const scale = canvas.width / GRID_SIZE;
                const centerRow = Math.floor(y / scale);
                const centerCol = Math.floor(x / scale);

                const radius = brushSize / 2;

                setFallingCubes((prev) => {
                    const newGrid = new Uint8Array(prev);
                    for (let i = 0; i < brushSize; i++) {
                        for (let j = 0; j < brushSize; j++) {
                            const row =
                                centerRow - Math.floor(brushSize / 2) + i;
                            const col =
                                centerCol - Math.floor(brushSize / 2) + j;
                            const distanceFromCenter = Math.sqrt(
                                Math.pow(i - radius + 0.5, 2) +
                                    Math.pow(j - radius + 0.5, 2)
                            );
                            if (
                                distanceFromCenter <= radius &&
                                row >= 0 &&
                                row < GRID_SIZE &&
                                col >= 0 &&
                                col < GRID_SIZE
                            ) {
                                const index = row * GRID_SIZE + col;
                                newGrid[index] = isBlueMode ? 2 : 1;
                            }
                        }
                    }
                    return newGrid;
                });
            },
            [setFallingCubes, brushSize, isBlueMode]
        );

        const handleMouseMove = useCallback(
            (e: React.MouseEvent<HTMLCanvasElement>) => {
                if (e.buttons === 1) {
                    const rect = canvasRef.current?.getBoundingClientRect();
                    if (rect) {
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        activateCell(x, y);
                    }
                }
            },
            [activateCell]
        );

        return (
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "12px",
                    boxShadow:
                        "0 10px 30px rgba(0, 0, 0, 0.1), 0 1px 8px rgba(0, 0, 0, 0.2)",
                    backgroundColor: "#ffffff",
                }}
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseMove}
            />
        );
    }
);

function App() {
    const [gridState, setGrid] = useState(
        () => new Uint8Array(GRID_SIZE * GRID_SIZE)
    );
    const [particles, setParticles] = useState<Particle[]>([]);
    const [brushSize, setBrushSize] = useState(1);
    const [isBlueMode, setIsBlueMode] = useState(false);
    const [intervalRate, setIntervalRate] = useState(INTERVAL);

    const initGrid = () => {
        const newParticles: Particle[] = [];
        for (let i = 0; i < gridState.length; i++) {
            if (gridState[i] !== 0) {
                newParticles.push({
                    x: (i % GRID_SIZE) * PIXEL_SIZE,
                    y: Math.floor(i / GRID_SIZE) * PIXEL_SIZE,
                    vy:
                        gridState[i] === 2
                            ? -INITIAL_VELOCITY
                            : INITIAL_VELOCITY,
                    isBlue: gridState[i] === 2,
                });
            }
        }
        setParticles(newParticles);
        setGrid(new Uint8Array(GRID_SIZE * GRID_SIZE));
    };

    useEffect(() => {
        const intervalId = setInterval(() => {
            setGrid((prev) => {
                const newGrid = new Uint8Array(prev);
                // Move orange particles down
                for (let row = GRID_SIZE - 1; row > 0; row--) {
                    for (let col = 0; col < GRID_SIZE; col++) {
                        const currentIndex = row * GRID_SIZE + col;
                        const aboveIndex = (row - 1) * GRID_SIZE + col;
                        if (
                            prev[aboveIndex] === 1 &&
                            prev[currentIndex] === 0
                        ) {
                            newGrid[currentIndex] = 1;
                            newGrid[aboveIndex] = 0;
                        }
                    }
                }
                // Move blue particles up
                for (let row = 0; row < GRID_SIZE - 1; row++) {
                    for (let col = 0; col < GRID_SIZE; col++) {
                        const currentIndex = row * GRID_SIZE + col;
                        const belowIndex = (row + 1) * GRID_SIZE + col;
                        if (
                            prev[belowIndex] === 2 &&
                            prev[currentIndex] === 0
                        ) {
                            newGrid[currentIndex] = 2;
                            newGrid[belowIndex] = 0;
                        }
                    }
                }
                return newGrid;
            });

            setParticles((prevParticles) => {
                return prevParticles
                    .map((particle) => ({
                        ...particle,
                        y: particle.y + particle.vy,
                        vy: particle.vy + GRAVITY,
                    }))
                    .filter((particle) => particle.y < CANVAS_SIZE);
            });
        }, intervalRate);
        return () => clearInterval(intervalId);
    }, [intervalRate]);

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100vh",
                width: "100%",
                backgroundColor: "#f0f0f0",
                fontFamily:
                    "'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    alignItems: "stretch",
                    padding: "20px",
                    gap: "20px",
                    flex: 1,
                    overflow: "auto",
                }}
            >
                <div
                    style={{
                        flex: "1 1 300px",
                        minWidth: 0,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            maxWidth: `${CANVAS_SIZE}px`,
                            aspectRatio: "1 / 1",
                        }}
                    >
                        <Grid
                            grid={gridState}
                            setFallingCubes={setGrid}
                            particles={particles}
                            brushSize={brushSize}
                            isBlueMode={isBlueMode}
                        />
                    </div>
                </div>
                <div
                    style={{
                        flex: "1 1 300px",
                        minWidth: 0,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "stretch",
                        gap: "20px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "stretch",
                            marginBottom: "20px",
                        }}
                    >
                        <label
                            htmlFor="brushSize"
                            style={{
                                marginBottom: "5px",
                                fontFamily: "'Poppins', 'Segoe UI', sans-serif",
                                fontSize: "14px",
                                color: "#333",
                            }}
                        >
                            Brush Size: {brushSize}x{brushSize}
                        </label>
                        <input
                            type="range"
                            id="brushSize"
                            min="1"
                            max="20"
                            value={brushSize}
                            onChange={(e) =>
                                setBrushSize(Number(e.target.value))
                            }
                            style={{
                                width: "100%",
                                accentColor: "#4a90e2",
                            }}
                        />
                    </div>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "stretch",
                            marginBottom: "20px",
                        }}
                    >
                        <label
                            htmlFor="intervalRate"
                            style={{
                                marginBottom: "5px",
                                fontFamily: "'Poppins', 'Segoe UI', sans-serif",
                                fontSize: "14px",
                                color: "#333",
                            }}
                        >
                            Update Interval: {intervalRate}ms
                        </label>
                        <input
                            type="range"
                            id="intervalRate"
                            min="1"
                            max="100"
                            value={intervalRate}
                            onChange={(e) =>
                                setIntervalRate(Number(e.target.value))
                            }
                            style={{
                                width: "100%",
                                accentColor: "#4a90e2",
                            }}
                        />
                    </div>
                    <button
                        onClick={() => setIsBlueMode(!isBlueMode)}
                        style={{
                            padding: "12px 24px",
                            fontSize: "16px",
                            fontWeight: "bold",
                            color: "#ffffff",
                            backgroundColor: isBlueMode ? "#4a90e2" : "#e29a4a",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            boxShadow:
                                "0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08)",
                            fontFamily: "'Poppins', 'Segoe UI', sans-serif",
                            marginBottom: "10px",
                        }}
                    >
                        Fall direction: {isBlueMode ? "Up" : "Down"}
                    </button>
                    <button
                        onClick={initGrid}
                        style={{
                            padding: "12px 24px",
                            fontSize: "16px",
                            fontWeight: "bold",
                            color: "#ffffff",
                            backgroundColor: "#4a90e2",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            boxShadow:
                                "0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08)",
                            fontFamily: "'Poppins', 'Segoe UI', sans-serif",
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = "#357ae8";
                            e.currentTarget.style.transform =
                                "translateY(-1px)";
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = "#4a90e2";
                            e.currentTarget.style.transform = "translateY(0)";
                        }}
                    >
                        Clear Board
                    </button>
                    <div
                        style={{
                            backgroundColor: "#ffffff",
                            borderRadius: "8px",
                            padding: "20px",
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                        }}
                    >
                        <h2
                            style={{
                                color: "#333",
                                borderBottom: "2px solid #4a90e2",
                                paddingBottom: "10px",
                                marginBottom: "20px",
                                fontFamily: "'Poppins', 'Segoe UI', sans-serif",
                                fontSize: "24px",
                                fontWeight: 600,
                            }}
                        >
                            Frequently Asked Questions
                        </h2>
                        <dl
                            style={{
                                margin: 0,
                                padding: 0,
                            }}
                        >
                            <dt
                                style={{
                                    fontWeight: 600,
                                    color: "#4a90e2",
                                    marginBottom: "5px",
                                    fontSize: "18px",
                                    fontFamily:
                                        "'Poppins', 'Segoe UI', sans-serif",
                                }}
                            >
                                What is this?
                            </dt>
                            <dd
                                style={{
                                    marginBottom: "15px",
                                    paddingLeft: "20px",
                                    fontSize: "16px",
                                    lineHeight: 1.6,
                                }}
                            >
                                This is a falling sand simulator, inspired by
                                various cellular automata projects.
                            </dd>

                            <dt
                                style={{
                                    fontWeight: 600,
                                    color: "#4a90e2",
                                    marginBottom: "5px",
                                    fontSize: "18px",
                                    fontFamily:
                                        "'Poppins', 'Segoe UI', sans-serif",
                                }}
                            >
                                How does it work?
                            </dt>
                            <dd
                                style={{
                                    marginBottom: "15px",
                                    paddingLeft: "20px",
                                    fontSize: "16px",
                                    lineHeight: 1.6,
                                }}
                            >
                                The simulator uses a grid where each cell can
                                contain different types of particles. These
                                particles interact with each other based on
                                simple rules, creating complex behaviors.
                            </dd>

                            <dt
                                style={{
                                    fontWeight: 600,
                                    color: "#4a90e2",
                                    marginBottom: "5px",
                                    fontSize: "18px",
                                    fontFamily:
                                        "'Poppins', 'Segoe UI', sans-serif",
                                }}
                            >
                                Can I interact with the simulation?
                            </dt>
                            <dd
                                style={{
                                    marginBottom: "15px",
                                    paddingLeft: "20px",
                                    fontSize: "16px",
                                    lineHeight: 1.6,
                                }}
                            >
                                Yes! You can click and drag on the grid to add
                                particles. Try different types to see how they
                                interact.
                            </dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
