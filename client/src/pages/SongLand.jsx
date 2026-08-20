import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Music, Star, Play, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div;

// Song Data (Curated List)
const SONGS = [
    // Popular
    { id: 'XqZsoesa55w', title: '상어 가족 (Baby Shark)', category: 'popular', color: 'bg-blue-400' },
    { id: '761ae_KDg_Q', title: '반짝반짝 작은 별', category: 'popular', color: 'bg-yellow-400' },
    { id: 'cyJgx5kFAfI', title: '바나나 차차', category: 'popular', color: 'bg-purple-400' },
    { id: 'cyVzjoj96vs', title: '뽀로로 오프닝', category: 'popular', color: 'bg-blue-500' },
    { id: 'L0MK7qz13bU', title: 'Let It Go (겨울왕국)', category: 'popular', color: 'bg-cyan-400' },

    // Math
    { id: '6Gr7p29e6QA', title: '핑크퐁 인기 동요 모음', category: 'math', color: 'bg-green-400' }, // Using compilation as fallback for specific songs
    { id: '2HEfl2wHQ-w', title: '핑크퐁 베스트 동요', category: 'math', color: 'bg-green-500' },

    // English
    { id: 'J8Lwfg7gpdc', title: 'Baby Shark & Spring Songs', category: 'english', color: 'bg-pink-400' },
    { id: '_UR-l3QI2nE', title: 'Baby Shark (English)', category: 'english', color: 'bg-pink-500' },

    // Korean
    { id: 'kcZTYZDx5_c', title: '인기 동요 모음', category: 'popular', color: 'bg-orange-400' },
];

const CATEGORIES = [
    { id: 'all', name: '전체', icon: '🎵' },
    { id: 'popular', name: '인기 동요', icon: '🌟' },
    { id: 'story', name: '동화 나라', icon: '📖' },
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
        <div className="min-h-screen bg-[#FFF3E0] font-title relative overflow-x-hidden">
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
