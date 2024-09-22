import React, { useState, useCallback, useEffect, useRef } from "react";

const GRID_SIZE = 128;
const CANVAS_SIZE = 512;
const PIXEL_SIZE = CANVAS_SIZE / GRID_SIZE;
const INTERVAL = 5;
const GRAVITY = 0.05;
const INITIAL_VELOCITY = 0.1;

interface Particle {
    x: number;
    y: number;
    vy: number;
}

const Grid: React.FC<{
    grid: Uint8Array;
    setFallingCubes: React.Dispatch<React.SetStateAction<Uint8Array>>;
    particles: Particle[];
}> = React.memo(({ grid, setFallingCubes, particles }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const drawGrid = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "orange";

        const scale = canvas.width / GRID_SIZE;

        for (let i = 0; i < grid.length; i++) {
            if (grid[i]) {
                const x = (i % GRID_SIZE) * scale;
                const y = Math.floor(i / GRID_SIZE) * scale;
                ctx.fillRect(x, y, scale, scale);
            }
        }

        particles.forEach((particle) => {
            ctx.fillRect(
                (particle.x * scale) / PIXEL_SIZE,
                (particle.y * scale) / PIXEL_SIZE,
                scale,
                scale
            );
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
            const row = Math.floor(y / scale);
            const col = Math.floor(x / scale);
            if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
                const index = row * GRID_SIZE + col;
                setFallingCubes((prev) => {
                    const newGrid = new Uint8Array(prev);
                    newGrid[index] = 1;
                    return newGrid;
                });
            }
        },
        [setFallingCubes]
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
});

function App() {
    const [gridState, setGrid] = useState(
        () => new Uint8Array(GRID_SIZE * GRID_SIZE)
    );
    const [particles, setParticles] = useState<Particle[]>([]);

    const initGrid = () => {
        const newParticles: Particle[] = [];
        for (let i = 0; i < gridState.length; i++) {
            if (gridState[i]) {
                newParticles.push({
                    x: (i % GRID_SIZE) * PIXEL_SIZE,
                    y: Math.floor(i / GRID_SIZE) * PIXEL_SIZE,
                    vy: INITIAL_VELOCITY,
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
                for (let row = GRID_SIZE - 1; row > 0; row--) {
                    for (let col = 0; col < GRID_SIZE; col++) {
                        const currentIndex = row * GRID_SIZE + col;
                        const aboveIndex = (row - 1) * GRID_SIZE + col;
                        if (prev[aboveIndex] && !prev[currentIndex]) {
                            newGrid[currentIndex] = 1;
                            newGrid[aboveIndex] = 0;
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
        }, INTERVAL);
        return () => clearInterval(intervalId);
    }, []);

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
