import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Music, Play, RotateCcw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div;

const NOTES = [
    { id: 1, key: 'D', label: '쿵', color: 'bg-red-500', x: '25%' },
    { id: 2, key: 'F', label: '짝', color: 'bg-blue-500', x: '42%' },
    { id: 3, key: 'J', label: '쿵', color: 'bg-red-500', x: '58%' },
    { id: 4, key: 'K', label: '짝', color: 'bg-blue-500', x: '75%' },
];

const RhythmGame = () => {
    const navigate = useNavigate();
    const [isPlaying, setIsPlaying] = useState(false);
    const [score, setScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [fallingNotes, setFallingNotes] = useState([]);
    const [feedback, setFeedback] = useState(null);
    const gameLoopRef = useRef(null);
    const noteSpawnRef = useRef(null);

    const hitNote = useCallback((laneIndex) => {
        if (!isPlaying) return;

        const laneX = NOTES[laneIndex].x;
        const hitZoneY = 500;
        const hitWindow = 50;

        setFallingNotes(prev => {
            const hitNoteIndex = prev.findIndex(n =>
                n.x === laneX && Math.abs(n.y - hitZoneY) < hitWindow
            );

            if (hitNoteIndex !== -1) {
                setCombo(prevCombo => {
                    const nextCombo = prevCombo + 1;
                    setScore(s => s + 100 + (prevCombo * 10));
                    return nextCombo;
                });
                setFeedback('PERFECT!');

                const newNotes = [...prev];
                newNotes.splice(hitNoteIndex, 1);
                return newNotes;
            }

            return prev;
        });
    }, [isPlaying]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            const key = e.key.toUpperCase();
            const noteIndex = NOTES.findIndex(n => n.key === key);
            if (noteIndex !== -1) hitNote(noteIndex);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [hitNote]);

    const startGame = () => {
        setIsPlaying(true);
        setScore(0);
        setCombo(0);
        setFallingNotes([]);

        // Spawn notes loop
        noteSpawnRef.current = setInterval(() => {
            const randomNote = Math.floor(Math.random() * 4);
            const id = Date.now();
            setFallingNotes(prev => [...prev, { ...NOTES[randomNote], id, y: -100 }]);
        }, 800); // Spawn rate

        // Game loop (move notes)
        gameLoopRef.current = setInterval(() => {
            setFallingNotes(prev => {
                const nextNotes = prev.map(note => ({ ...note, y: note.y + 5 })); // Speed
                // Remove missed notes
                const missed = nextNotes.filter(n => n.y > 600);
                if (missed.length > 0) {
                    setCombo(0);
                    setFeedback('MISS');
                }
                return nextNotes.filter(n => n.y <= 600);
            });
        }, 16); // ~60FPS
    };

    const stopGame = () => {
        setIsPlaying(false);
        clearInterval(gameLoopRef.current);
        clearInterval(noteSpawnRef.current);
    };

    useEffect(() => {
        if (feedback) {
            const timer = setTimeout(() => setFeedback(null), 500);
            return () => clearTimeout(timer);
        }
    }, [feedback]);

    return (
        <div className="min-h-screen bg-[#212121] font-title relative overflow-hidden flex flex-col items-center">
            {/* Night-sky twinkles -- kept the dark arcade theme (better contrast for
                falling notes) but added a touch of the app's usual sparkle */}
            <Sparkles className="absolute top-16 left-10 text-white/20 w-5 h-5 animate-float-cloud-slow pointer-events-none" />
            <Sparkles className="absolute top-28 right-14 text-white/15 w-4 h-4 animate-float-cloud-fast pointer-events-none" />
            <Sparkles className="absolute bottom-40 left-16 text-white/15 w-4 h-4 animate-float-cloud-slow pointer-events-none" />

            {/* Header */}
            <div className="w-full bg-[#424242] p-4 shadow-lg flex items-center justify-between z-20">
                <button onClick={() => { stopGame(); navigate('/games'); }} className="bg-white/20 p-2 rounded-full text-white hover:bg-white/30 transition-colors">
                    <ArrowLeft size={32} />
                </button>
                <h1 className="text-3xl font-extrabold text-white drop-shadow-md flex items-center gap-2">
                    <Music size={32} className="animate-bounce text-yellow-400" /> 리듬 북
                </h1>
                <div className="w-12"></div>
            </div>

            {/* Score & Combo */}
            <div className="absolute top-24 left-1/2 transform -translate-x-1/2 text-center z-10">
                <div className="text-5xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                    {score.toLocaleString()}
                </div>
                {combo > 1 && (
                    <MotionDiv
                        initial={{ scale: 1.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        key={combo}
                        className="text-3xl font-bold text-yellow-400 mt-2"
                    >
                        {combo} COMBO!
                    </MotionDiv>
                )}
                <AnimatePresence>
                    {feedback && (
                        <MotionDiv
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={`text-4xl font-black mt-4 ${feedback === 'MISS' ? 'text-red-500' : 'text-green-400'}`}
                        >
                            {feedback}
                        </MotionDiv>
                    )}
                </AnimatePresence>
            </div>

            {/* Game Lane */}
            <div className="relative w-full max-w-2xl h-[600px] bg-gradient-to-b from-[#333] to-[#111] border-x-4 border-[#555] mt-8 overflow-hidden">
                {/* Lanes */}
                {NOTES.map((note, i) => (
                    <div key={i} className="absolute top-0 bottom-0 w-1 bg-white/10" style={{ left: note.x }}></div>
                ))}

                {/* Hit Line */}
                <div className="absolute bottom-20 left-0 w-full h-2 bg-white/50 shadow-[0_0_15px_white]"></div>

                {/* Falling Notes */}
                {fallingNotes.map((note) => (
                    <div
                        key={note.id}
                        className={`absolute w-16 h-8 rounded-full ${note.color} shadow-lg border-2 border-white`}
                        style={{ left: note.x, top: note.y, transform: 'translateX(-50%)' }}
                    ></div>
                ))}

                {/* Key Indicators */}
                {NOTES.map((note, i) => (
                    <div
                        key={i}
                        className="absolute bottom-4 transform -translate-x-1/2 flex flex-col items-center"
                        style={{ left: note.x }}
                    >
                        <div className={`w-16 h-16 rounded-full border-4 border-white/30 flex items-center justify-center text-white font-bold text-xl bg-white/5`}>
                            {note.key}
                        </div>
                        <span className="text-white/50 text-sm mt-1">{note.label}</span>
                    </div>
                ))}
            </div>

            {/* Start Button */}
            {!isPlaying && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-30">
                    <button
                        onClick={startGame}
                        className="bg-yellow-500 text-black px-12 py-6 rounded-full font-black text-3xl shadow-[0_0_30px_rgba(255,235,59,0.5)] hover:scale-110 transition-transform flex items-center gap-4"
                    >
                        <Play size={40} fill="black" /> GAME START
                    </button>
                </div>
            )}

            {/* Mobile Controls (Optional) */}
            <div className="fixed bottom-0 w-full h-32 bg-black/50 flex items-center justify-around sm:hidden z-40">
                {NOTES.map((note, i) => (
                    <button
                        key={i}
                        onTouchStart={() => hitNote(i)}
                        className={`w-20 h-20 rounded-full ${note.color} opacity-80 border-4 border-white active:scale-95 transition-transform`}
                    >
                    </button>
                ))}
            </div>
        </div>
    );
};

export default RhythmGame;
