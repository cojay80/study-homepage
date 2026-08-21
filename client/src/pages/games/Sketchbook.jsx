import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Palette, Eraser, Download, Trash2, Undo, Sparkles } from 'lucide-react';
import { CloudIcon } from '../../components/Assets';

const COLORS = [
    '#000000', // Black
    '#FF0000', // Red
    '#FF9800', // Orange
    '#FFEB3B', // Yellow
    '#4CAF50', // Green
    '#2196F3', // Blue
    '#9C27B0', // Purple
    '#E91E63', // Pink
    '#795548', // Brown
    '#FFFFFF', // White (Eraser)
];

const Sketchbook = () => {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const ctxRef = useRef(null);
    const [color, setColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(5);
    const [isDrawing, setIsDrawing] = useState(false);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const parent = canvas.parentElement;

        const updateSize = () => {
            const { width, height } = parent.getBoundingClientRect();
            if (width === 0 || height === 0) return; // not laid out yet
            if (canvas.width === width && canvas.height === height) return;
            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext('2d');
            context.lineCap = 'round';
            context.lineJoin = 'round';
            ctxRef.current = context;
        };

        // A plain mount-time measurement can run before the flex layout (and
        // the rounded canvas frame it sits in) has finished settling, locking
        // the canvas to a too-small size. ResizeObserver re-measures whenever
        // the container's actual size changes, including that first settle.
        updateSize();
        const observer = new ResizeObserver(updateSize);
        observer.observe(parent);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const ctx = ctxRef.current;
        if (!ctx) return;
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
    }, [color, lineWidth]);

    const startDrawing = (e) => {
        const ctx = ctxRef.current;
        if (!ctx) return;
        const { offsetX, offsetY } = getCoordinates(e);
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const draw = (e) => {
        const ctx = ctxRef.current;
        if (!ctx) return;
        if (!isDrawing) return;
        const { offsetX, offsetY } = getCoordinates(e);
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
    };

    const stopDrawing = () => {
        const ctx = ctxRef.current;
        if (!ctx) return;
        if (isDrawing) {
            ctx.closePath();
            setIsDrawing(false);
            saveHistory();
        }
    };

    const getCoordinates = (e) => {
        if (e.nativeEvent instanceof TouchEvent) {
            const rect = canvasRef.current.getBoundingClientRect();
            return {
                offsetX: e.nativeEvent.touches[0].clientX - rect.left,
                offsetY: e.nativeEvent.touches[0].clientY - rect.top
            };
        }
        return {
            offsetX: e.nativeEvent.offsetX,
            offsetY: e.nativeEvent.offsetY
        };
    };

    const saveHistory = () => {
        // Simple history implementation (could be optimized)
        setHistory([...history, canvasRef.current.toDataURL()]);
    };

    const clearCanvas = () => {
        const ctx = ctxRef.current;
        if (!ctx) return;
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        setHistory([]);
    };

    const saveImage = () => {
        const link = document.createElement('a');
        link.download = 'my-drawing.png';
        link.href = canvasRef.current.toDataURL();
        link.click();
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#FFE0B2] to-[#FFF3E0] font-title relative overflow-hidden flex flex-col">
            <CloudIcon className="absolute top-6 left-8 w-24 h-16 text-white/50 animate-float-cloud-slow pointer-events-none z-0" />
            <Sparkles className="absolute top-20 right-16 text-white/60 w-6 h-6 animate-float-cloud-fast pointer-events-none z-0" />

            {/* Header */}
            <div className="bg-[#FF6F00] p-4 shadow-lg flex items-center justify-between z-20">
                <button onClick={() => navigate('/games')} className="bg-white/20 p-2 rounded-full text-white hover:bg-white/30 transition-colors">
                    <ArrowLeft size={32} />
                </button>
                <h1 className="text-3xl font-extrabold text-white drop-shadow-md flex items-center gap-2">
                    <Palette size={32} className="animate-bounce" /> 미술 시간
                </h1>
                <div className="flex gap-2">
                    <button onClick={saveImage} className="bg-white/20 p-2 rounded-full text-white hover:bg-white/30 transition-colors" title="저장하기">
                        <Download size={28} />
                    </button>
                    <button onClick={clearCanvas} className="bg-white/20 p-2 rounded-full text-white hover:bg-red-500/50 transition-colors" title="지우기">
                        <Trash2 size={28} />
                    </button>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 relative w-full h-full overflow-hidden p-3 z-10">
                <div className="w-full h-full bg-white rounded-3xl shadow-xl border-4 border-white overflow-hidden">
                    <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-full touch-none cursor-crosshair"
                    />
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] flex flex-col gap-4 z-20 rounded-t-3xl">
                {/* Colors */}
                <div className="flex justify-center gap-3 overflow-x-auto pb-2">
                    {COLORS.map((c) => (
                        <button
                            key={c}
                            onClick={() => setColor(c)}
                            className={`w-12 h-12 rounded-full border-4 shadow-sm transition-transform transform hover:scale-110
                                ${color === c ? 'border-gray-800 scale-110' : 'border-white'}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>

                {/* Brush Size */}
                <div className="flex items-center justify-center gap-4">
                    <span className="text-gray-500 font-bold">크기</span>
                    <input
                        type="range"
                        min="1"
                        max="30"
                        value={lineWidth}
                        onChange={(e) => setLineWidth(Number(e.target.value))}
                        className="w-64 h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FF6F00]"
                    />
                    <div
                        className="bg-black rounded-full"
                        style={{ width: `${lineWidth}px`, height: `${lineWidth}px`, backgroundColor: color }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

export default Sketchbook;
