import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Tv, Lightbulb, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { CloudIcon } from '../components/Assets';

const MotionDiv = motion.div;

const VIDEOS = [
    { id: 'CL-FQi1aglg', title: '뇌 청소부 멜라토닌', url: 'https://www.youtube.com/embed/CL-FQi1aglg' },
    { id: 'iXOAqCmoEFU', title: '바쁘다 바빠 멜라토닌', url: 'https://www.youtube.com/embed/iXOAqCmoEFU' },
    { id: 'NrL3rZsgLFQ', title: '안 나와 똥 (변비 비켜!)', url: 'https://www.youtube.com/embed/NrL3rZsgLFQ' },
    { id: 'YmSIIf7HGDo', title: '혈장 실종 사건', url: 'https://www.youtube.com/embed/YmSIIf7HGDo' },
    { id: 'x4XnuKZ33HA', title: '아몬드 공주와 비타민C', url: 'https://www.youtube.com/embed/x4XnuKZ33HA' },
    { id: 'iSa5_7ohwFw', title: '단짠단짠 전쟁', url: 'https://www.youtube.com/embed/iSa5_7ohwFw' },
    { id: 'Bzp86MhCdpA', title: '스트레스와 단 맛', url: 'https://www.youtube.com/embed/Bzp86MhCdpA' },
    { id: 'ibX_7aoMUPg', title: '가짜 호르몬 교란 작전', url: 'https://www.youtube.com/embed/ibX_7aoMUPg' },
    { id: 'NkvMKpXwznI', title: '토마토 최강 용사 리코펜', url: 'https://www.youtube.com/embed/NkvMKpXwznI' },
    { id: 'apNhlPLWzFM', title: '수분 사냥꾼 나트륨', url: 'https://www.youtube.com/embed/apNhlPLWzFM' },
    { id: 'WyiMp-i6pH0', title: '아이스크림 식중독', url: 'https://www.youtube.com/embed/WyiMp-i6pH0' },
    { id: 'ZS7U0Sy7bPk', title: '수두 이길 수 있어', url: 'https://www.youtube.com/embed/ZS7U0Sy7bPk' },
    { id: '5eRx1nOsKAs', title: '똥 냄새의 진짜 주인은?', url: 'https://www.youtube.com/embed/5eRx1nOsKAs' },
    { id: 'l9_P9GsReSo', title: '엣취 재채기', url: 'https://www.youtube.com/embed/l9_P9GsReSo' },
    { id: 'TE9wpehLAWo', title: '슈퍼딱지맨의 새집증후군', url: 'https://www.youtube.com/embed/TE9wpehLAWo' },
    { id: 's0YkeowNF58', title: '납이 몸에 들어오면 안 돼요', url: 'https://www.youtube.com/embed/s0YkeowNF58' },
    { id: 'DpNV-Z2ghDo', title: '터진 혈관을 막아라! 지혈특공대', url: 'https://www.youtube.com/embed/DpNV-Z2ghDo' },
    { id: 'lPzvhZmrb5s', title: '너무 맵게 먹으면 안 돼요', url: 'https://www.youtube.com/embed/lPzvhZmrb5s' },
    { id: '0Kz5ZSRQztI', title: '조심조심 성장판', url: 'https://www.youtube.com/embed/0Kz5ZSRQztI' },
    { id: 'kqXzTQeCplY', title: '개에게 물리지 않게 조심', url: 'https://www.youtube.com/embed/kqXzTQeCplY' },
    { id: '2HAHfL6xGO0', title: '춤추는 똥', url: 'https://www.youtube.com/embed/2HAHfL6xGO0' },
    { id: 'T0Fn6NN9k14', title: '귀를 지키는 귀지', url: 'https://www.youtube.com/embed/T0Fn6NN9k14' },
    { id: 'U7FWpN_FYH0', title: '집먼지진드기의 똥 공격', url: 'https://www.youtube.com/embed/U7FWpN_FYH0' },
    { id: 'dr5IR1MwRb8', title: '귀신보다 무서운 설탕', url: 'https://www.youtube.com/embed/dr5IR1MwRb8' },
    { id: 'C9vI656hQSA', title: '붕어빵 프로젝트! 유전자', url: 'https://www.youtube.com/embed/C9vI656hQSA' },
    { id: 'SK9u6C_CHG8', title: '코딱지 파면 안 돼요', url: 'https://www.youtube.com/embed/SK9u6C_CHG8' },
    { id: 'qR_BhwGzDt8', title: '물집 터트릴까?', url: 'https://www.youtube.com/embed/qR_BhwGzDt8' },
    { id: 'VzUe9h7-3-Y', title: '코감기! 귀를 조심해', url: 'https://www.youtube.com/embed/VzUe9h7-3-Y' },
];

const VideoLand = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#B2EBF2] to-[#E0F7FA] font-title relative overflow-hidden">
            {/* Ambient decoration */}
            <CloudIcon className="absolute top-6 left-8 w-24 h-16 text-white/60 animate-float-cloud-slow pointer-events-none" />
            <CloudIcon className="absolute top-20 right-12 w-16 h-11 text-white/50 animate-float-cloud-fast pointer-events-none" />
            <Sparkles className="absolute top-32 left-1/4 text-white/60 w-6 h-6 animate-float-cloud-slow pointer-events-none" />

            {/* Header */}
            <div className="bg-[#00BCD4] p-4 shadow-lg sticky top-0 z-20 flex items-center justify-between">
                <button onClick={() => navigate('/')} className="bg-white/20 p-2 rounded-full text-white hover:bg-white/30 transition-colors">
                    <ArrowLeft size={32} />
                </button>
                <h1 className="text-3xl font-extrabold text-white drop-shadow-md flex items-center gap-2">
                    <Tv size={32} className="animate-bounce" /> 영상 나라
                </h1>
                <div className="w-12"></div>
            </div>

            {/* Video Grid */}
            <div className="max-w-6xl mx-auto p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {VIDEOS.map((video, index) => (
                    <MotionDiv
                        key={video.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-3xl overflow-hidden shadow-xl border-4 border-cyan-200 hover:border-cyan-400 transition-colors group"
                    >
                        <div className="aspect-video bg-gray-900 relative">
                            <iframe
                                width="100%"
                                height="100%"
                                src={video.url}
                                title={video.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="absolute inset-0"
                            ></iframe>
                        </div>
                        <div className="p-4 flex items-center justify-between bg-cyan-50">
                            <div className="flex flex-col gap-2 w-full">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-cyan-900 truncate">{video.title}</h3>
                                    <Lightbulb className="text-yellow-500 fill-yellow-500" size={24} />
                                </div>
                                <a
                                    href={`https://www.youtube.com/watch?v=${video.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-center bg-cyan-100 text-cyan-700 py-1 rounded-lg hover:bg-cyan-200 transition-colors"
                                >
                                    유튜브에서 보기 ↗
                                </a>
                            </div>
                        </div>
                    </MotionDiv>
                ))}
            </div>
        </div>
    );
};

export default VideoLand;
