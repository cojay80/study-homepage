import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Music, Gamepad2, Star, Heart, Sun, Tv, ShoppingBag, Mic } from 'lucide-react';
import { motion } from 'framer-motion';
import { clearAuth, getUser } from '../utils/api';

const MotionH1 = motion.h1;
const MotionButton = motion.button;

const Home = () => {
    const navigate = useNavigate();
    const user = getUser();

    const handleLogout = () => {
        clearAuth();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[#FFF9C4] relative overflow-hidden font-title">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-32 bg-[#4FC3F7] rounded-b-[50%] scale-x-150 z-0"></div>
            <Sun className="absolute top-4 right-10 text-yellow-400 w-24 h-24 animate-spin-slow z-0" />
            <Cloud className="absolute top-10 left-20 text-white w-32 h-20 opacity-80 animate-bounce-slow z-0" />
            <Cloud className="absolute top-20 right-40 text-white w-24 h-16 opacity-60 animate-bounce-slow delay-1000 z-0" />

            {/* Header */}
            <div className="relative z-10 flex flex-col items-center pt-12 mb-10">
                <MotionH1
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-5xl font-extrabold text-[#FF6F00] drop-shadow-white tracking-widest"
                >
                    공부 나라
                </MotionH1>
                <div className="mt-4">
                    <div className="bg-white/90 backdrop-blur-sm px-6 py-2 rounded-full shadow-lg flex items-center gap-4 border-2 border-pink-200">
                        <span className="font-bold text-gray-700">
                            반가워요, <span className="text-pink-500 text-lg">{user?.username || '친구'}</span>님! 👑
                        </span>
                        <button
                            onClick={() => navigate('/myroom')}
                            className="bg-pink-100 hover:bg-pink-200 text-pink-600 px-4 py-1 rounded-full text-sm font-bold transition-colors flex items-center gap-1"
                        >
                            🏠 마이 룸
                        </button>
                        <button
                            onClick={handleLogout}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-1 rounded-full text-sm font-bold transition-colors"
                        >
                            로그아웃
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Navigation Grid */}
            <div className="relative z-10 max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">

                {/* Study Land */}
                <MenuCard
                    title="공부 나라"
                    icon={<BookOpen size={56} className="text-white" />}
                    color="bg-[#8BC34A]"
                    borderColor="border-[#689F38]"
                    onClick={() => navigate('/study')}
                    delay={0}
                    desc="수학, 국어, 영어 여행!"
                />

                {/* Song Land */}
                <MenuCard
                    title="동요 나라"
                    icon={<Music size={56} className="text-white" />}
                    color="bg-[#F06292]"
                    borderColor="border-[#C2185B]"
                    onClick={() => navigate('/songs')}
                    delay={0.1}
                    desc="신나는 노래 부르기!"
                />

                {/* Game Land */}
                <MenuCard
                    title="게임 나라"
                    icon={<Gamepad2 size={56} className="text-white" />}
                    color="bg-[#4FC3F7]"
                    borderColor="border-[#0288D1]"
                    onClick={() => navigate('/games')}
                    delay={0.2}
                    desc="재미있는 미니게임!"
                />

                {/* AI English Talk */}
                <MenuCard
                    title="AI 영어 대화"
                    icon={<Mic size={56} className="text-white" />}
                    color="bg-sky-500"
                    borderColor="border-sky-700"
                    onClick={() => navigate('/english-talk')}
                    delay={0.25}
                    desc="말하면서 영어 연습!"
                />

                {/* Story Land */}
                <MenuCard
                    title="이야기 나라"
                    icon={<BookOpen size={56} className="text-white" />}
                    color="bg-[#AB47BC]"
                    borderColor="border-[#7B1FA2]"
                    onClick={() => navigate('/stories')}
                    delay={0.3}
                    desc="재미있는 동화책!"
                />

                {/* Video Land */}
                <MenuCard
                    title="영상 나라"
                    icon={<Tv size={56} className="text-white" />}
                    color="bg-[#26C6DA]"
                    borderColor="border-[#0097A7]"
                    onClick={() => navigate('/videos')}
                    delay={0.4}
                    desc="호기심 해결 팡팡!"
                />

                {/* Store Land */}
                <MenuCard
                    title="상점 나라"
                    icon={<ShoppingBag size={56} className="text-white" />}
                    color="bg-[#FFCA28]"
                    borderColor="border-[#FFA000]"
                    onClick={() => navigate('/store')}
                    delay={0.5}
                    desc="별 모아서 쇼핑해요!"
                />
            </div>

            {/* Footer / Character Area */}
            <div className="absolute bottom-0 w-full h-48 bg-[url('https://www.transparenttextures.com/patterns/grass.png')] bg-[#AED581] border-t-8 border-[#7CB342] flex justify-center items-end pb-10 z-0">
                <div className="text-[#33691E] font-bold text-lg opacity-50">
                    © 2025 Magic Learning Kingdom
                </div>
            </div>
        </div>
    );
};

const MenuCard = ({ title, icon, color, borderColor, onClick, delay, desc }) => {
    return (
        <MotionButton
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay, type: "spring", stiffness: 200 }}
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`relative group h-64 rounded-3xl ${color} border-b-8 ${borderColor} shadow-xl flex flex-col items-center justify-center gap-4 p-6 transition-all`}
        >
            {/* Shine Effect */}
            <div className="absolute top-4 right-4 w-8 h-8 bg-white/30 rounded-full blur-sm"></div>

            <div className="bg-white/20 p-6 rounded-full shadow-inner backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                {icon}
            </div>

            <div className="text-center">
                <h2 className="text-3xl font-black text-white drop-shadow-md mb-2">{title}</h2>
                <p className="text-white/90 font-medium text-lg">{desc}</p>
            </div>

            {/* Floating Decor */}
            <Star className="absolute top-4 left-4 text-yellow-300 w-6 h-6 animate-pulse" />
            <Heart className="absolute bottom-4 right-4 text-pink-300 w-6 h-6 animate-bounce" />
        </MotionButton>
    );
};

// Simple Cloud Component
const Cloud = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.5,19c-3.037,0-5.5-2.463-5.5-5.5c0-0.402,0.046-0.793,0.13-1.172C11.137,12.115,10.096,12,9,12c-2.761,0-5,2.239-5,5s2.239,5,5,5h8.5c1.933,0,3.5-1.567,3.5-3.5S19.433,15,17.5,15c-0.344,0-0.676,0.051-0.992,0.144C16.896,15.896,17.5,17.362,17.5,19z" />
    </svg>
);

export default Home;
