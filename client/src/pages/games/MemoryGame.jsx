import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, RotateCcw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div;

const CARDS = [
    { id: 1, content: '🐶', color: 'bg-red-100' },
    { id: 2, content: '🐱', color: 'bg-blue-100' },
    { id: 3, content: '🐰', color: 'bg-green-100' },
    { id: 4, content: '🦊', color: 'bg-orange-100' },
    { id: 5, content: '🐻', color: 'bg-yellow-100' },
    { id: 6, content: '🐼', color: 'bg-purple-100' },
];

const MemoryGame = () => {
    const navigate = useNavigate();
    const [cards, setCards] = useState([]);
    const [flipped, setFlipped] = useState([]);
    const [solved, setSolved] = useState([]);
    const [disabled, setDisabled] = useState(false);
    const [moves, setMoves] = useState(0);

    const shuffle = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    const initializeGame = useCallback(() => {
        const duplicatedCards = [...CARDS, ...CARDS].map((card, index) => ({
            ...card,
            uniqueId: index,
        }));
        setCards(shuffle(duplicatedCards));
        setFlipped([]);
        setSolved([]);
        setMoves(0);
        setDisabled(false);
    }, []);

    useEffect(() => {
        initializeGame();
    }, [initializeGame]);

    const handleClick = (id) => {
        if (disabled || flipped.includes(id) || solved.includes(id)) return;

        if (flipped.length === 0) {
            setFlipped([id]);
            return;
        }

        setFlipped([flipped[0], id]);
        setDisabled(true);
        setMoves(prev => prev + 1);

        const firstCard = cards.find(card => card.uniqueId === flipped[0]);
        const secondCard = cards.find(card => card.uniqueId === id);

        if (firstCard.id === secondCard.id) {
            setSolved([...solved, flipped[0], id]);
            setFlipped([]);
            setDisabled(false);
        } else {
            setTimeout(() => {
                setFlipped([]);
                setDisabled(false);
            }, 1000);
        }
    };

    const isGameOver = solved.length === cards.length && cards.length > 0;

    return (
        <div className="min-h-screen bg-[#F3E5F5] font-title relative overflow-hidden">
            <div className="bg-[#7B1FA2] p-4 shadow-lg sticky top-0 z-20 flex items-center justify-between">
                <button onClick={() => navigate('/games')} className="bg-white/20 p-2 rounded-full text-white hover:bg-white/30 transition-colors">
                    <ArrowLeft size={32} />
                </button>
                <h1 className="text-3xl font-extrabold text-white drop-shadow-md flex items-center gap-2">
                    <Brain size={32} className="animate-bounce" /> 카드 뒤집기
                </h1>
                <div className="w-12"></div>
            </div>

            <div className="max-w-2xl mx-auto p-6 flex flex-col items-center">
                <div className="bg-white px-8 py-3 rounded-2xl shadow-md border-2 border-purple-200 mb-8">
                    <span className="text-gray-500 font-bold text-lg">움직인 횟수: </span>
                    <span className="text-2xl font-black text-purple-600">{moves}</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 w-full">
                    {cards.map((card) => (
                        <div
                            key={card.uniqueId}
                            className={`aspect-square relative cursor-pointer perspective-1000`}
                            onClick={() => handleClick(card.uniqueId)}
                        >
                            <MotionDiv
                                className={`w-full h-full rounded-2xl shadow-lg border-4 border-white transition-all duration-500 transform-style-3d`}
                                initial={{ rotateY: 0 }}
                                animate={{ rotateY: flipped.includes(card.uniqueId) || solved.includes(card.uniqueId) ? 180 : 0 }}
                            >
                                {/* Front (Hidden) */}
                                <div className="absolute inset-0 bg-purple-400 rounded-xl backface-hidden flex items-center justify-center">
                                    <Sparkles className="text-white/50 w-8 h-8" />
                                </div>
                                {/* Back (Revealed) */}
                                <div className={`absolute inset-0 ${card.color} rounded-xl backface-hidden rotate-y-180 flex items-center justify-center text-4xl`}>
                                    {card.content}
                                </div>
                            </MotionDiv>
                        </div>
                    ))}
                </div>

                {isGameOver && (
                    <MotionDiv
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    >
                        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border-4 border-purple-300">
                            <h2 className="text-4xl font-black text-purple-600 mb-4">성공! 🎉</h2>
                            <p className="text-xl text-gray-600 mb-8">총 {moves}번 움직였어요!</p>
                            <button
                                onClick={initializeGame}
                                className="bg-purple-500 text-white px-8 py-4 rounded-xl font-bold text-xl shadow-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-2 w-full"
                            >
                                <RotateCcw /> 다시 하기
                            </button>
                        </div>
                    </MotionDiv>
                )}
            </div>
        </div>
    );
};

export default MemoryGame;
