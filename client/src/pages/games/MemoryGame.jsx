import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, RotateCcw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudIcon } from '../../components/Assets';

const MotionDiv = motion.div;

const THEMES = {
    animal: { name: '동물', icon: '🐶', color: 'bg-orange-400', cards: ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🐯', '🐮'] },
    fruit: { name: '과일', icon: '🍎', color: 'bg-red-400', cards: ['🍎', '🍌', '🍇', '🍓', '🍉', '🍑', '🍒', '🥝', '🍍', '🍊'] },
    ocean: { name: '바다', icon: '🐠', color: 'bg-blue-400', cards: ['🐠', '🐬', '🐙', '🦀', '🐢', '🦈', '🐳', '🦑', '🐡', '🦐'] },
    space: { name: '우주', icon: '🚀', color: 'bg-indigo-500', cards: ['🚀', '🌟', '🪐', '🌙', '☄️', '👽', '🛸', '🌍', '⭐', '🌌'] },
};

const DIFFICULTIES = {
    easy: { label: '쉬움', pairs: 6, cols: 'grid-cols-3 sm:grid-cols-4' },
    medium: { label: '보통', pairs: 8, cols: 'grid-cols-4' },
    hard: { label: '어려움', pairs: 10, cols: 'grid-cols-4 sm:grid-cols-5' },
};

const MemoryGame = () => {
    const navigate = useNavigate();
    const [themeId, setThemeId] = useState(null);
    const [difficultyId, setDifficultyId] = useState('easy');
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
        if (!themeId) return;
        const theme = THEMES[themeId];
        const pairCount = DIFFICULTIES[difficultyId].pairs;
        const deck = theme.cards.slice(0, pairCount).map((content, i) => ({ id: i, content }));
        const duplicatedCards = [...deck, ...deck].map((card, index) => ({
            ...card,
            uniqueId: index,
        }));
        setCards(shuffle(duplicatedCards));
        setFlipped([]);
        setSolved([]);
        setMoves(0);
        setDisabled(false);
    }, [themeId, difficultyId]);

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

    const isGameOver = cards.length > 0 && solved.length === cards.length;
    const cols = DIFFICULTIES[difficultyId].cols;

    if (!themeId) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#E1BEE7] to-[#F3E5F5] font-title relative overflow-hidden">
                <CloudIcon className="absolute top-6 left-8 w-24 h-16 text-white/60 animate-float-cloud-slow pointer-events-none" />
                <CloudIcon className="absolute top-20 right-12 w-16 h-11 text-white/50 animate-float-cloud-fast pointer-events-none" />
                <Sparkles className="absolute top-32 right-1/4 text-white/60 w-6 h-6 animate-float-cloud-slow pointer-events-none" />

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
                    <div className="bg-white rounded-3xl p-8 w-full shadow-xl border-4 border-purple-200 mb-6">
                        <h2 className="text-2xl font-black text-purple-700 mb-4 text-center">테마를 골라주세요</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {Object.entries(THEMES).map(([id, theme]) => (
                                <button
                                    key={id}
                                    onClick={() => setThemeId(id)}
                                    className={`${theme.color} rounded-2xl p-6 text-white font-bold text-xl shadow-md hover:scale-105 transition-transform flex flex-col items-center gap-2`}
                                >
                                    <span className="text-4xl">{theme.icon}</span>
                                    {theme.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-8 w-full shadow-xl border-4 border-purple-200">
                        <h2 className="text-2xl font-black text-purple-700 mb-4 text-center">난이도를 골라주세요</h2>
                        <div className="grid grid-cols-3 gap-3">
                            {Object.entries(DIFFICULTIES).map(([id, d]) => (
                                <button
                                    key={id}
                                    onClick={() => setDifficultyId(id)}
                                    className={`rounded-2xl py-4 font-bold text-lg shadow-md transition-all ${difficultyId === id
                                        ? 'bg-purple-500 text-white ring-4 ring-purple-200'
                                        : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}
                                >
                                    {d.label}
                                    <div className="text-xs font-normal opacity-80">{d.pairs}쌍</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#E1BEE7] to-[#F3E5F5] font-title relative overflow-hidden">
            <CloudIcon className="absolute top-6 left-8 w-24 h-16 text-white/60 animate-float-cloud-slow pointer-events-none" />
            <CloudIcon className="absolute top-20 right-12 w-16 h-11 text-white/50 animate-float-cloud-fast pointer-events-none" />
            <Sparkles className="absolute top-32 right-1/4 text-white/60 w-6 h-6 animate-float-cloud-slow pointer-events-none" />

            <div className="bg-[#7B1FA2] p-4 shadow-lg sticky top-0 z-20 flex items-center justify-between">
                <button onClick={() => setThemeId(null)} className="bg-white/20 p-2 rounded-full text-white hover:bg-white/30 transition-colors">
                    <ArrowLeft size={32} />
                </button>
                <h1 className="text-3xl font-extrabold text-white drop-shadow-md flex items-center gap-2">
                    <Brain size={32} className="animate-bounce" /> {THEMES[themeId].name} 카드 뒤집기
                </h1>
                <div className="w-12"></div>
            </div>

            <div className="max-w-2xl mx-auto p-6 flex flex-col items-center">
                <div className="bg-white px-8 py-3 rounded-2xl shadow-md border-2 border-purple-200 mb-8">
                    <span className="text-gray-500 font-bold text-lg">움직인 횟수: </span>
                    <span className="text-2xl font-black text-purple-600">{moves}</span>
                </div>

                <div className={`grid ${cols} gap-4 w-full`}>
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
                                <div className="absolute inset-0 bg-purple-50 rounded-xl backface-hidden rotate-y-180 flex items-center justify-center text-4xl">
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
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={initializeGame}
                                    className="bg-purple-500 text-white px-8 py-4 rounded-xl font-bold text-xl shadow-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-2 w-full"
                                >
                                    <RotateCcw /> 다시 하기
                                </button>
                                <button
                                    onClick={() => setThemeId(null)}
                                    className="bg-purple-50 text-purple-600 px-8 py-3 rounded-xl font-bold text-lg hover:bg-purple-100 transition-colors w-full"
                                >
                                    다른 테마 하기
                                </button>
                            </div>
                        </div>
                    </MotionDiv>
                )}
            </div>
        </div>
    );
};

export default MemoryGame;
