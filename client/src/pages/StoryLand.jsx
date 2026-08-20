import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Play, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div;

const STORIES = [
    // Popular Stories (인기 동화)
    { id: 'IAL1v7OUfm4', title: '정글 탐험대의 모험', category: 'story', url: 'https://www.youtube.com/embed/IAL1v7OUfm4' },
    { id: 'kcZTYZDx5_c', title: '도깨비 방망이 외 (인기 전래동화)', category: 'story', url: 'https://www.youtube.com/embed/kcZTYZDx5_c' },
    { id: 'R2rX-m2-g6Y', title: '콩쥐팥쥐 외 (인기 동화)', category: 'story', url: 'https://www.youtube.com/embed/R2rX-m2-g6Y' },

    // Dance/Gymnastics (율동 동요)
    { id: 'ZAmVVIJ1I9E', title: '호이 호이! 알록달록 상어가족', category: 'dance', url: 'https://www.youtube.com/embed/ZAmVVIJ1I9E' },
    { id: 'PZ3Zvu8t1aE', title: '그냥 날 안아줘! 니니모찌', category: 'dance', url: 'https://www.youtube.com/embed/PZ3Zvu8t1aE' },
    { id: 'ANO_Oo6LIU8', title: '알 라 스콩! 아침 발레 인사', category: 'dance', url: 'https://www.youtube.com/embed/ANO_Oo6LIU8' },
    { id: 'U92JqNVD7YM', title: '키가 쑥! 몸이 튼튼! 율동체조', category: 'dance', url: 'https://www.youtube.com/embed/U92JqNVD7YM' },
    { id: 'sPu2kjCXhWU', title: '엄마 아빠를 마니마니 사랑해', category: 'dance', url: 'https://www.youtube.com/embed/sPu2kjCXhWU' },
];

const CATEGORIES = [
    { id: 'all', name: '전체', icon: '📚' },
    { id: 'story', name: '인기 동화', icon: '📖' },
    { id: 'dance', name: '율동 동요', icon: '💃' },
];

const StoryLand = () => {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [playingVideo, setPlayingVideo] = useState(null);

    const filteredStories = selectedCategory === 'all'
        ? STORIES
        : STORIES.filter(story => story.category === selectedCategory);

    return (
        <div className="min-h-screen bg-[#F3E5F5] font-title relative overflow-hidden">
            {/* Header */}
            <div className="bg-[#9C27B0] p-4 shadow-lg sticky top-0 z-20 flex items-center justify-between">
                <button onClick={() => navigate('/')} className="bg-white/20 p-2 rounded-full text-white hover:bg-white/30 transition-colors">
                    <ArrowLeft size={32} />
                </button>
                <h1 className="text-3xl font-extrabold text-white drop-shadow-md flex items-center gap-2">
                    <BookOpen size={32} className="animate-bounce" /> 이야기 나라
                </h1>
                <div className="w-12"></div>
            </div>

            {/* Category Tabs */}
            <div className="flex justify-center gap-4 p-6 overflow-x-auto">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-6 py-3 rounded-full font-bold text-lg shadow-md transition-all transform hover:scale-105 whitespace-nowrap
                            ${selectedCategory === cat.id
                                ? 'bg-[#9C27B0] text-white ring-4 ring-purple-200'
                                : 'bg-white text-purple-600 hover:bg-purple-50'}`}
                    >
                        {cat.icon} {cat.name}
                    </button>
                ))}
            </div>

            {/* Video Grid */}
            <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                {filteredStories.map((story, index) => (
                    <MotionDiv
                        key={story.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-3xl overflow-hidden shadow-xl border-4 border-purple-200 hover:border-purple-400 transition-colors group cursor-pointer"
                        onClick={() => setPlayingVideo(story)}
                    >
                        <div className="aspect-video bg-gray-900 relative">
                            <img
                                src={`https://img.youtube.com/vi/${story.id}/hqdefault.jpg`}
                                alt={story.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                <div className="bg-white/80 p-4 rounded-full shadow-lg transform group-hover:scale-110 transition-transform">
                                    <Play size={32} className="text-[#9C27B0] fill-[#9C27B0]" />
                                </div>
                            </div>
                        </div>
                        <div className="p-4 flex items-center justify-between bg-purple-50">
                            <div className="flex flex-col gap-2 w-full">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-purple-900 truncate">{story.title}</h3>
                                </div>
                                <a
                                    href={`https://www.youtube.com/watch?v=${story.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-xs text-center bg-purple-100 text-purple-700 py-1 rounded-lg hover:bg-purple-200 transition-colors"
                                >
                                    유튜브에서 보기 ↗
                                </a>
                            </div>
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
                            className="bg-black rounded-3xl overflow-hidden shadow-2xl w-full max-w-4xl aspect-video relative border-8 border-[#9C27B0]"
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

export default StoryLand;
