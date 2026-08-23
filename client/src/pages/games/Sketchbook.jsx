import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Palette, Download, Trash2, Pencil, Stamp, Sparkles } from 'lucide-react';
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

const STICKERS = [
    '⭐', '✨', '💖', '💕', '🌈', '☀️', '🌙', '🎈', '🎉', '🦄',
    '🐶', '🐱', '🐰', '🐻', '🦋', '🌸', '🍭', '🎀', '👑', '🍄',
];

const STICKER_SIZES = [
    { label: '작게', size: 40 },
    { label: '보통', size: 60 },
    { label: '크게', size: 90 },
];

const Sketchbook = () => {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const ctxRef = useRef(null);
    const [color, setColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(5);
    const [isDrawing, setIsDrawing] = useState(false);
    const [history, setHistory] = useState([]);
    const [mode, setMode] = useState('draw'); // 'draw' | 'stamp'
    const [selectedSticker, setSelectedSticker] = useState(STICKERS[0]);
    const [stickerSize, setStickerSize] = useState(STICKER_SIZES[1].size);

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

        if (mode === 'stamp') {
            ctx.font = `${stickerSize}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(selectedSticker, offsetX, offsetY);
            saveHistory();
            return;
        }

        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (mode === 'stamp') return;
        const ctx = ctxRef.current;
        if (!ctx) return;
        if (!isDrawing) return;
        const { offsetX, offsetY } = getCoordinates(e);
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (mode === 'stamp') return;
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
                {/* Mode Toggle */}
                <div className="flex justify-center gap-3">
                    <button
                        onClick={() => setMode('draw')}
                        className={`px-6 py-2 rounded-full font-bold text-lg shadow-sm transition-all flex items-center gap-2
                            ${mode === 'draw' ? 'bg-[#FF6F00] text-white ring-4 ring-orange-200' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}
                    >
                        <Pencil size={20} /> 그리기
                    </button>
                    <button
                        onClick={() => setMode('stamp')}
                        className={`px-6 py-2 rounded-full font-bold text-lg shadow-sm transition-all flex items-center gap-2
                            ${mode === 'stamp' ? 'bg-[#FF6F00] text-white ring-4 ring-orange-200' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}
                    >
                        <Stamp size={20} /> 도장
                    </button>
                </div>

                {mode === 'draw' ? (
                    <>
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
                    </>
                ) : (
                    <>
                        {/* Stickers */}
                        <div className="flex justify-center gap-2 overflow-x-auto pb-2 flex-wrap">
                            {STICKERS.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setSelectedSticker(s)}
                                    className={`w-12 h-12 rounded-2xl text-2xl flex items-center justify-center shadow-sm transition-transform transform hover:scale-110
                                        ${selectedSticker === s ? 'bg-orange-100 ring-4 ring-[#FF6F00]' : 'bg-gray-50'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>

                        {/* Sticker Size */}
                        <div className="flex items-center justify-center gap-3">
                            <span className="text-gray-500 font-bold">크기</span>
                            {STICKER_SIZES.map((s) => (
                                <button
                                    key={s.size}
                                    onClick={() => setStickerSize(s.size)}
                                    className={`px-5 py-2 rounded-full font-bold shadow-sm transition-all
                                        ${stickerSize === s.size ? 'bg-[#FF6F00] text-white' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Sketchbook;
