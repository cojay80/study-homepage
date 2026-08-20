import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Hammer, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div;

const MoleGame = () => {
    const navigate = useNavigate();
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [isPlaying, setIsPlaying] = useState(false);
    const moles = new Array(9).fill(false);
    const [activeMole, setActiveMole] = useState(null);
    const timerRef = useRef(null);
    const moleTimerRef = useRef(null);

    useEffect(() => {
        if (!isPlaying) return;

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    clearInterval(moleTimerRef.current);
                    timerRef.current = null;
                    moleTimerRef.current = null;
                    setIsPlaying(false);
                    setActiveMole(null);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        moleTimerRef.current = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * 9);
            setActiveMole(randomIndex);
            setTimeout(() => {
                setActiveMole(null);
            }, Math.random() * 500 + 500);
        }, 1000);

        return () => {
            clearInterval(timerRef.current);
            clearInterval(moleTimerRef.current);
            timerRef.current = null;
            moleTimerRef.current = null;
        };
    }, [isPlaying]);

    const startGame = () => {
        setScore(0);
        setTimeLeft(30);
        setIsPlaying(true);
    };

    const whackMole = (index) => {
        if (index === activeMole && isPlaying) {
            setScore(prev => prev + 10);
            setActiveMole(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#E1F5FE] font-title relative overflow-hidden select-none cursor-[url('https://cdn-icons-png.flaticon.com/32/2983/2983826.png'),_auto]">
            <div className="bg-[#0288D1] p-4 shadow-lg sticky top-0 z-20 flex items-center justify-between">
                <button onClick={() => navigate('/games')} className="bg-white/20 p-2 rounded-full text-white hover:bg-white/30 transition-colors">
                    <ArrowLeft size={32} />
                </button>
                <h1 className="text-3xl font-extrabold text-white drop-shadow-md flex items-center gap-2">
                    <Hammer size={32} className="animate-bounce" /> 두더지 잡기
                </h1>
                <div className="w-12"></div>
            </div>

            <div className="max-w-2xl mx-auto p-6 flex flex-col items-center">
                <div className="flex gap-8 mb-8">
                    <div className="bg-white px-8 py-4 rounded-2xl shadow-lg border-4 border-yellow-400 flex flex-col items-center">
                        <span className="text-gray-500 font-bold">점수</span>
                        <span className="text-4xl font-black text-yellow-600">{score}</span>
                    </div>
                    <div className="bg-white px-8 py-4 rounded-2xl shadow-lg border-4 border-pink-400 flex flex-col items-center">
                        <span className="text-gray-500 font-bold">시간</span>
                        <span className={`text-4xl font-black ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-pink-600'}`}>
                            {timeLeft}
                        </span>
                    </div>
                </div>

                <div className="bg-[#8D6E63] p-6 rounded-[3rem] shadow-2xl border-b-8 border-[#5D4037] relative">
                    <div className="grid grid-cols-3 gap-6">
                        {moles.map((_, index) => (
                            <div key={index} className="relative w-24 h-24 sm:w-32 sm:h-32 bg-[#3E2723] rounded-full shadow-inner overflow-hidden border-4 border-[#5D4037]">
                                <div className="absolute top-0 left-0 w-full h-4 bg-black/30 rounded-full blur-sm"></div>
                                <AnimatePresence>
                                    {activeMole === index && (
                                        <MotionDiv
                                            initial={{ y: 100, x: "-50%" }}
                                            animate={{ y: 0, x: "-50%" }}
                                            exit={{ y: 100, x: "-50%" }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                            className="absolute bottom-0 left-1/2 w-20 h-24 sm:w-28 sm:h-28 cursor-pointer flex justify-center"
                                            onMouseDown={() => whackMole(index)}
                                        >
                                            <div className="w-full h-full bg-[#795548] rounded-t-full relative border-4 border-[#5D4037]">
                                                <div className="absolute top-6 left-4 w-3 h-3 bg-black rounded-full">
                                                    <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white rounded-full"></div>
                                                </div>
                                                <div className="absolute top-6 right-4 w-3 h-3 bg-black rounded-full">
                                                    <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white rounded-full"></div>
                                                </div>
                                                <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-6 h-4 bg-pink-300 rounded-full"></div>
                                            </div>
                                        </MotionDiv>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </div>

                {!isPlaying && (
                    <MotionDiv
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mt-8 text-center"
                    >
                        {timeLeft === 0 && (
                            <div className="mb-6">
                                <h2 className="text-4xl font-black text-[#0288D1] mb-2">게임 종료!</h2>
                                <p className="text-xl text-gray-600">최종 점수: {score}점</p>
                            </div>
                        )}
                        <button
                            onClick={startGame}
                            className="bg-[#0288D1] text-white px-10 py-4 rounded-full font-bold text-2xl shadow-lg hover:bg-[#0277BD] transition-transform transform hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto"
                        >
                            {timeLeft === 0 ? <RotateCcw /> : <Hammer />}
                            {timeLeft === 0 ? '다시 하기' : '게임 시작'}
                        </button>
                    </MotionDiv>
                )}
            </div>
        </div>
    );
};

export default MoleGame;
