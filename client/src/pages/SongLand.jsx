import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Music, Star, Play, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudIcon } from '../components/Assets';

const MotionDiv = motion.div;

// Song Data (Curated List) -- every id below has been verified against the
// YouTube oEmbed API so the title/category shown actually matches the video.
const SONGS = [
    // Popular
    { id: 'XqZsoesa55w', title: '상어 가족 (Baby Shark)', category: 'popular', color: 'bg-blue-400' },
    { id: 'cyJgx5kFAfI', title: '바나나 차차', category: 'popular', color: 'bg-purple-400' },
    { id: 'E0W5sJZ2d64', title: '뽀로로 오프닝', category: 'popular', color: 'bg-blue-500' },
    { id: 'L0MK7qz13bU', title: 'Let It Go (겨울왕국)', category: 'popular', color: 'bg-cyan-400' },
    { id: 'tIRul7vW_b0', title: '작은 별', category: 'popular', color: 'bg-yellow-400' },
    { id: 'VSNPr2ydsE0', title: '나비야', category: 'popular', color: 'bg-pink-300' },
    { id: 'M2cgndHuG04', title: '동물의 왕 사자', category: 'popular', color: 'bg-orange-400' },
    { id: 'Go7mw5R3_EQ', title: '원숭이 엉덩이는 빨개', category: 'popular', color: 'bg-red-400' },
    { id: 'pOiX3U0Vp-s', title: '경찰차', category: 'popular', color: 'bg-blue-600' },
    { id: 'JnxwbY07jmY', title: '소방차', category: 'popular', color: 'bg-red-500' },
    { id: 'R2PHf8j7nFo', title: '배꼽인사송', category: 'popular', color: 'bg-amber-400' },
    { id: 'wq842bDgOis', title: '둥근 해가 떴어요', category: 'popular', color: 'bg-yellow-300' },
    { id: 'jaEt8qwrahY', title: '치카치카 양치해요', category: 'popular', color: 'bg-sky-400' },
    { id: 'JvfyAtvZRvk', title: '아기상어와 6단계 손씻기', category: 'popular', color: 'bg-teal-300' },
    { id: 'X7jmN8P7XyE', title: '봄 동요 모음집', category: 'popular', color: 'bg-pink-200' },
    { id: '390KbCbX3f4', title: '가을 동요 모음집', category: 'popular', color: 'bg-orange-300' },
    { id: 'DZF06J5Ahzw', title: '나는야 공룡 요리사', category: 'popular', color: 'bg-lime-400' },
    { id: '_kxuz2CnxRg', title: '우리 가족 사랑해 동요', category: 'popular', color: 'bg-rose-300' },

    // Math
    { id: 'amOjQsKqw6k', title: '숫자 쓰기', category: 'math', color: 'bg-green-400' },
    { id: 'b2hNcf3QAyk', title: '숫자 모양송', category: 'math', color: 'bg-green-500' },
    { id: 'oJXpXiiXSyA', title: '시계송 (1초 1분 1시간)', category: 'math', color: 'bg-emerald-400' },
    { id: 'pT6fKuzTrXY', title: '아기상어와 숫자송', category: 'math', color: 'bg-teal-400' },
    { id: 'lcl8uB2AWM0', title: 'Shapes Are All Around', category: 'math', color: 'bg-lime-500' },
    { id: 'jYPWrF6a3i0', title: 'Months Of The Year Song', category: 'math', color: 'bg-emerald-500' },
    { id: 'IFRdn2O7h6M', title: '숫자 노래', category: 'math', color: 'bg-green-600' },

    // English
    { id: '_UR-l3QI2nE', title: 'ABC Song', category: 'english', color: 'bg-pink-500' },
    { id: 'afZuyN3L7-w', title: 'Old MacDonald Had a Farm', category: 'english', color: 'bg-rose-400' },
    { id: 'HVDY3GxjivY', title: 'The Wheels on the Bus', category: 'english', color: 'bg-fuchsia-400' },
    { id: 'eT2rHegFiyA', title: 'Learn Colors with Color Hero', category: 'english', color: 'bg-violet-400' },
    { id: 'ZrnE0XRMNqg', title: 'Che Che Koolay Giraffe', category: 'english', color: 'bg-yellow-500' },
    { id: 'z743VD-OvqE', title: 'Zebra Cadabra', category: 'english', color: 'bg-gray-400' },
    { id: '7DYjfjaZGas', title: 'Monkey Banana', category: 'english', color: 'bg-amber-500' },
    { id: 'y_RNpKIxNM4', title: 'Feelings', category: 'english', color: 'bg-purple-400' },
    { id: 'HKev6QbYTVM', title: 'Opposites', category: 'english', color: 'bg-indigo-400' },
    { id: 'P7-UNYm0P2w', title: 'Big Bigger Biggest', category: 'english', color: 'bg-blue-300' },
];

const CATEGORIES = [
    { id: 'all', name: '전체', icon: '🎵' },
    { id: 'popular', name: '인기 동요', icon: '🌟' },
    { id: 'math', name: '수학 동요', icon: '🔢' },
    { id: 'english', name: '영어 동요', icon: '🅰️' },
];

const SongLand = () => {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [playingVideo, setPlayingVideo] = useState(null);

    const filteredSongs = selectedCategory === 'all'
        ? SONGS
        : SONGS.filter(song => song.category === selectedCategory);

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#FFE0B2] to-[#FFF3E0] font-title relative overflow-x-hidden">
            {/* Ambient decoration */}
            <CloudIcon className="absolute top-6 left-8 w-24 h-16 text-white/60 animate-float-cloud-slow pointer-events-none" />
            <CloudIcon className="absolute top-20 right-12 w-16 h-11 text-white/50 animate-float-cloud-fast pointer-events-none" />
            <Star className="absolute top-32 left-1/4 text-white/60 w-6 h-6 animate-float-cloud-slow pointer-events-none" />

            {/* Header */}
            <div className="bg-[#FF9800] p-4 shadow-lg sticky top-0 z-20 flex items-center justify-between">
                <button onClick={() => navigate('/')} className="bg-white/20 p-2 rounded-full text-white hover:bg-white/30 transition-colors">
                    <ArrowLeft size={32} />
                </button>
                <h1 className="text-3xl font-extrabold text-white drop-shadow-md flex items-center gap-2">
                    <Music size={32} className="animate-bounce" /> 동요 나라
                </h1>
                <div className="w-12"></div> {/* Spacer */}
            </div>

            {/* Category Tabs */}
            <div className="flex justify-center gap-4 p-6 overflow-x-auto">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-6 py-3 rounded-full font-bold text-lg shadow-md transition-all transform hover:scale-105 whitespace-nowrap
                            ${selectedCategory === cat.id
                                ? 'bg-[#FF6F00] text-white ring-4 ring-orange-200'
                                : 'bg-white text-orange-600 hover:bg-orange-50'}`}
                    >
                        {cat.icon} {cat.name}
                    </button>
                ))}
            </div>

            {/* Video Grid */}
            <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 pb-20">
                {filteredSongs.map((song, index) => (
                    <MotionDiv
                        key={song.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -10 }}
                        className="bg-white rounded-3xl overflow-hidden shadow-xl border-4 border-white cursor-pointer group relative"
                        onClick={() => setPlayingVideo(song)}
                    >
                        {/* Thumbnail */}
                        <div className="relative aspect-video bg-gray-200">
                            <img
                                src={`https://img.youtube.com/vi/${song.id}/hqdefault.jpg`}
                                alt={song.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                <div className="bg-white/80 p-4 rounded-full shadow-lg transform group-hover:scale-110 transition-transform">
                                    <Play size={32} className="text-[#FF6F00] fill-[#FF6F00]" />
                                </div>
                            </div>
                        </div>

                        {/* Title */}
                        <div className={`p-4 ${song.color} text-white`}>
                            <h3 className="font-bold text-lg truncate text-center drop-shadow-sm mb-2">{song.title}</h3>
                            <a
                                href={`https://www.youtube.com/watch?v=${song.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="block text-xs text-center bg-white/20 text-white py-1 rounded-lg hover:bg-white/30 transition-colors"
                            >
                                유튜브에서 보기 ↗
                            </a>
                        </div>
                    </MotionDiv>
                ))}
            </div>

            {/* Video Player Modal */}
            <AnimatePresence>
                {playingVideo && (
                    <MotionDiv
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setPlayingVideo(null)}
                    >
                        <MotionDiv
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="bg-black rounded-3xl overflow-hidden shadow-2xl w-full max-w-4xl aspect-video relative border-8 border-[#FF9800]"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setPlayingVideo(null)}
                                className="absolute top-4 right-4 z-10 bg-white/20 p-2 rounded-full text-white hover:bg-white/40 transition-colors"
                            >
                                <X size={32} />
                            </button>
                            <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${playingVideo.id}?autoplay=1`}
                                title={playingVideo.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </MotionDiv>
                    </MotionDiv>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SongLand;
