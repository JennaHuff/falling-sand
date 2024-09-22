import React, { useState, useCallback, useEffect, useRef } from "react";

const GRID_SIZE = 128;
const CANVAS_SIZE = 512;
const PIXEL_SIZE = CANVAS_SIZE / GRID_SIZE;
const GRAVITY = 0.05;
const INTERVAL = 12;
const INITIAL_VELOCITY = 0.1;

interface Particle {
    x: number;
    y: number;
    vy: number;
    isBlue: boolean;
    color: string;
}

// Update the grid type
type GridCell = {
    state: number;
    color: string;
};

// Update the Grid component props
const Grid: React.FC<{
    grid: GridCell[];
    setFallingCubes: React.Dispatch<React.SetStateAction<GridCell[]>>;
    particles: Particle[];
    brushSize: number;
    isBlueMode: boolean;
    fallingColor: string;
    risingColor: string;
    onExport: (exportFunc: () => void) => void;
}> = React.memo(
    ({
        grid,
        setFallingCubes,
        particles,
        brushSize,
        isBlueMode,
        fallingColor,
        risingColor,
        onExport,
    }) => {
        const canvasRef = useRef<HTMLCanvasElement>(null);

        const drawGrid = useCallback(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const scale = canvas.width / GRID_SIZE;

            for (let i = 0; i < grid.length; i++) {
                if (grid[i].state !== 0) {
                    const x = (i % GRID_SIZE) * scale;
                    const y = Math.floor(i / GRID_SIZE) * scale;
                    ctx.fillStyle = grid[i].color;
                    ctx.fillRect(x, y, scale, scale);
                }
            }

            particles.forEach((particle) => {
                const x = Math.floor(particle.x / PIXEL_SIZE) * scale;
                const y = Math.floor(particle.y / PIXEL_SIZE) * scale;
                ctx.fillStyle = particle.color;
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
                    const newGrid = [...prev];
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
                                newGrid[index] = {
                                    state: isBlueMode ? 2 : 1,
                                    color: isBlueMode
                                        ? risingColor
                                        : fallingColor,
                                };
                            }
                        }
                    }
                    return newGrid;
                });
            },
            [setFallingCubes, brushSize, isBlueMode, fallingColor, risingColor]
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

        const exportAsPNG = useCallback(() => {
            const canvas = canvasRef.current;
            if (canvas) {
                // Create a temporary canvas with white background
                const tempCanvas = document.createElement("canvas");
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                const tempCtx = tempCanvas.getContext("2d");
                if (tempCtx) {
                    tempCtx.fillStyle = "white";
                    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                    tempCtx.drawImage(canvas, 0, 0);

                    // Convert to PNG and download
                    const dataUrl = tempCanvas.toDataURL("image/png");
                    const link = document.createElement("a");
                    link.download = `falling-sand-simulation-${Date.now()}.png`;
                    link.href = dataUrl;
                    link.click();
                }
            }
        }, []);

        // Use useEffect to set the export function only once
        useEffect(() => {
            onExport(exportAsPNG);
        }, [onExport, exportAsPNG]);

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

// New FAQ Modal component
const FAQModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
    isOpen,
    onClose,
}) => {
    if (!isOpen) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1000,
            }}
        >
            <div
                style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "8px",
                    padding: "20px",
                    maxWidth: "500px",
                    maxHeight: "80vh",
                    overflow: "auto",
                    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
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
                <dl style={{ margin: 0, padding: 0 }}>
                    <dt
                        style={{
                            fontWeight: 600,
                            color: "#4a90e2",
                            marginBottom: "5px",
                            fontSize: "18px",
                            fontFamily: "'Poppins', 'Segoe UI', sans-serif",
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
                        This is a falling sand simulator, inspired by various
                        cellular automata projects.
                    </dd>

                    <dt
                        style={{
                            fontWeight: 600,
                            color: "#4a90e2",
                            marginBottom: "5px",
                            fontSize: "18px",
                            fontFamily: "'Poppins', 'Segoe UI', sans-serif",
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
                        The simulator uses a grid where each cell can contain
                        different types of particles. These particles interact
                        with each other based on simple rules, creating complex
                        behaviors.
                    </dd>

                    <dt
                        style={{
                            fontWeight: 600,
                            color: "#4a90e2",
                            marginBottom: "5px",
                            fontSize: "18px",
                            fontFamily: "'Poppins', 'Segoe UI', sans-serif",
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
                        particles. Try different types to see how they interact.
                    </dd>
                </dl>
                <button
                    onClick={onClose}
                    style={{
                        padding: "8px 16px",
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: "#ffffff",
                        backgroundColor: "#4a90e2",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        marginTop: "20px",
                    }}
                >
                    Close
                </button>
            </div>
        </div>
    );
};

function App() {
    const [gridState, setGrid] = useState<GridCell[]>(() =>
        Array(GRID_SIZE * GRID_SIZE).fill({ state: 0, color: "" })
    );
    const [particles, setParticles] = useState<Particle[]>([]);
    const [brushSize, setBrushSize] = useState(1);
    const [isBlueMode, setIsBlueMode] = useState(false);
    const [intervalRate, setIntervalRate] = useState(INTERVAL);
    const [fallingColor, setFallingColor] = useState("#FFA500"); // Orange
    const [risingColor, setRisingColor] = useState("#4169E1"); // Royal Blue
    const [isFAQOpen, setIsFAQOpen] = useState(false);
    const [exportFunction, setExportFunction] = useState<() => void>(() => {});

    const initGrid = () => {
        const newParticles: Particle[] = [];
        for (let i = 0; i < gridState.length; i++) {
            if (gridState[i].state !== 0) {
                newParticles.push({
                    x: (i % GRID_SIZE) * PIXEL_SIZE,
                    y: Math.floor(i / GRID_SIZE) * PIXEL_SIZE,
                    vy:
                        gridState[i].state === 2
                            ? -INITIAL_VELOCITY
                            : INITIAL_VELOCITY,
                    isBlue: gridState[i].state === 2,
                    color: gridState[i].color,
                });
            }
        }
        setParticles(newParticles);
        setGrid(Array(GRID_SIZE * GRID_SIZE).fill({ state: 0, color: "" }));
    };

    useEffect(() => {
        const intervalId = setInterval(() => {
            setGrid((prev) => {
                const newGrid = [...prev];
                // Move orange particles down
                for (let row = GRID_SIZE - 1; row > 0; row--) {
                    for (let col = 0; col < GRID_SIZE; col++) {
                        const currentIndex = row * GRID_SIZE + col;
                        const aboveIndex = (row - 1) * GRID_SIZE + col;
                        if (
                            prev[aboveIndex].state === 1 &&
                            prev[currentIndex].state === 0
                        ) {
                            newGrid[currentIndex] = { ...prev[aboveIndex] };
                            newGrid[aboveIndex] = { state: 0, color: "" };
                        }
                    }
                }
                // Move blue particles up
                for (let row = 0; row < GRID_SIZE - 1; row++) {
                    for (let col = 0; col < GRID_SIZE; col++) {
                        const currentIndex = row * GRID_SIZE + col;
                        const belowIndex = (row + 1) * GRID_SIZE + col;
                        if (
                            prev[belowIndex].state === 2 &&
                            prev[currentIndex].state === 0
                        ) {
                            newGrid[currentIndex] = { ...prev[belowIndex] };
                            newGrid[belowIndex] = { state: 0, color: "" };
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

    // console.log(gridState);

    return (
        <div
            style={{
                display: "flex",
                height: "100vh",
                width: "100%",
                backgroundColor: "#f0f0f0",
                fontFamily:
                    "'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
            }}
        >
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "20px",
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
                        fallingColor={fallingColor}
                        risingColor={risingColor}
                        onExport={setExportFunction}
                    />
                </div>
            </div>
            <div
                style={{
                    width: "300px",
                    padding: "20px",
                    backgroundColor: "#ffffff",
                    boxShadow: "-5px 0 15px rgba(0, 0, 0, 0.1)",
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
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
                        Brush Size: {brushSize}
                    </label>
                    <input
                        type="range"
                        id="brushSize"
                        min="1"
                        max="20"
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
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
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "stretch",
                        marginBottom: "20px",
                    }}
                >
                    <label
                        htmlFor="fallingColor"
                        style={{
                            marginBottom: "5px",
                            fontFamily: "'Poppins', 'Segoe UI', sans-serif",
                            fontSize: "14px",
                            color: "#333",
                        }}
                    >
                        Falling Particle Color:
                    </label>
                    <input
                        type="color"
                        id="fallingColor"
                        value={fallingColor}
                        onChange={(e) => setFallingColor(e.target.value)}
                        style={{
                            width: "100%",
                            height: "40px",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
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
                        htmlFor="risingColor"
                        style={{
                            marginBottom: "5px",
                            fontFamily: "'Poppins', 'Segoe UI', sans-serif",
                            fontSize: "14px",
                            color: "#333",
                        }}
                    >
                        Rising Particle Color:
                    </label>
                    <input
                        type="color"
                        id="risingColor"
                        value={risingColor}
                        onChange={(e) => setRisingColor(e.target.value)}
                        style={{
                            width: "100%",
                            height: "40px",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
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
                    Fall direction: {isBlueMode ? "↑" : "↓"}
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
                        e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = "#4a90e2";
                        e.currentTarget.style.transform = "translateY(0)";
                    }}
                >
                    Clear Board
                </button>
                <button
                    onClick={exportFunction}
                    style={{
                        padding: "12px 24px",
                        fontSize: "16px",
                        fontWeight: "bold",
                        color: "#ffffff",
                        backgroundColor: "#4CAF50",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        boxShadow:
                            "0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08)",
                        fontFamily: "'Poppins', 'Segoe UI', sans-serif",
                    }}
                >
                    Export as PNG
                </button>
                <button
                    onClick={() => setIsFAQOpen(true)}
                    style={{
                        padding: "12px 24px",
                        fontSize: "16px",
                        fontWeight: "bold",
                        color: "#ffffff",
                        backgroundColor: "#e24a4a",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        boxShadow:
                            "0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08)",
                        fontFamily: "'Poppins', 'Segoe UI', sans-serif",
                    }}
                >
                    ? Show Help
                </button>
            </div>
            <FAQModal isOpen={isFAQOpen} onClose={() => setIsFAQOpen(false)} />
        </div>
    );
}

export default App;
