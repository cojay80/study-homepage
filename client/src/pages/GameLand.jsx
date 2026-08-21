import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gamepad2, Hammer, Brain, Palette, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { CloudIcon } from '../components/Assets';

const MotionButton = motion.button;

const GameLand = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#B3E5FC] to-[#E1F5FE] font-title relative overflow-hidden">
            {/* Ambient decoration */}
            <CloudIcon className="absolute top-6 left-8 w-24 h-16 text-white/60 animate-float-cloud-slow pointer-events-none" />
            <CloudIcon className="absolute top-20 right-12 w-16 h-11 text-white/50 animate-float-cloud-fast pointer-events-none" />
            <Sparkles className="absolute top-32 left-1/4 text-white/60 w-6 h-6 animate-float-cloud-slow pointer-events-none" />

            {/* Header */}
            <div className="bg-[#0288D1] p-4 shadow-lg sticky top-0 z-20 flex items-center justify-between">
                <button onClick={() => navigate('/')} className="bg-white/20 p-2 rounded-full text-white hover:bg-white/30 transition-colors">
                    <ArrowLeft size={32} />
                </button>
                <h1 className="text-3xl font-extrabold text-white drop-shadow-md flex items-center gap-2">
                    <Gamepad2 size={32} className="animate-bounce" /> 게임 나라
                </h1>
                <div className="w-12"></div>
            </div>

            {/* Game Menu Grid */}
            <div className="max-w-4xl mx-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Mole Game Card */}
                <GameCard
                    title="두더지 잡기"
                    desc="뿅뿅! 튀어나오는 두더지를 잡아요!"
                    icon={<Hammer size={64} className="text-white" />}
                    color="bg-[#8D6E63]"
                    borderColor="border-[#5D4037]"
                    onClick={() => navigate('/games/mole')}
                    delay={0}
                />

                {/* Memory Game Card */}
                <GameCard
                    title="카드 뒤집기"
                    desc="똑같은 그림을 찾아보세요!"
                    icon={<Brain size={64} className="text-white" />}
                    color="bg-[#7B1FA2]"
                    borderColor="border-[#4A148C]"
                    onClick={() => navigate('/games/memory')}
                    delay={0.1}
                />

                {/* Sketchbook Card */}
                <GameCard
                    title="미술 시간"
                    desc="마음껏 그림을 그려봐요!"
                    icon={<Palette size={64} className="text-white" />}
                    color="bg-[#FF6F00]"
                    borderColor="border-[#E65100]"
                    onClick={() => navigate('/games/sketchbook')}
                    delay={0.2}
                />

                {/* Rhythm Game Card */}
                <GameCard
                    title="리듬 북"
                    desc="음악에 맞춰 쿵! 짝!"
                    icon={<Gamepad2 size={64} className="text-white" />}
                    color="bg-[#D32F2F]"
                    borderColor="border-[#B71C1C]"
                    onClick={() => navigate('/games/rhythm')}
                    delay={0.3}
                />

            </div>
        </div>
    );
};

const GameCard = ({ title, desc, icon, color, borderColor, onClick, delay }) => {
    return (
        <MotionButton
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay, type: "spring", stiffness: 200 }}
            whileHover={{ scale: 1.05, rotate: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`relative h-64 rounded-3xl ${color} border-b-8 ${borderColor} shadow-xl flex flex-col items-center justify-center gap-4 p-6 transition-all group`}
        >
            <div className="bg-white/20 p-6 rounded-full shadow-inner backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                {icon}
            </div>
            <div className="text-center">
                <h2 className="text-3xl font-black text-white drop-shadow-md mb-2">{title}</h2>
                <p className="text-white/90 font-medium text-lg">{desc}</p>
            </div>
        </MotionButton>
    );
};

export default GameLand;
