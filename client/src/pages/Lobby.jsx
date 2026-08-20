import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LevelNode from '../components/LevelNode';
import { User, Coins, Volume2, VolumeX, Star, ArrowLeft } from 'lucide-react';
import { soundManager, SOUNDS } from '../utils/SoundManager';
import { CastleIcon, HouseIcon, CloudIcon } from '../components/Assets';
import { apiFetch } from '../utils/api';

// Sub-component for the scrollable map area
const LobbyMap = ({ levels, navigate }) => {
    const containerRef = useRef(null);

    // Auto-scroll to bottom (Level 1) on mount
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [levels]);

    return (
        <div ref={containerRef} className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth bg-gradient-to-b from-[#A5C9FF] via-[#E2EDFF] to-[#FFF6DC]">
            {/* Floating Clouds Background Deco */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[10%] left-[8%] w-48 h-20 bg-white/70 rounded-full blur-sm animate-float-cloud-slow"></div>
                <div className="absolute top-[30%] right-[10%] w-64 h-24 bg-white/60 rounded-full blur-sm animate-float-cloud-fast"></div>
                <div className="absolute top-[55%] left-[5%] w-56 h-20 bg-white/70 rounded-full blur-sm animate-float-cloud-slow"></div>
                <div className="absolute top-[80%] right-[12%] w-52 h-16 bg-white/60 rounded-full blur-sm animate-float-cloud-fast"></div>
            </div>

            {/* Map Content (Widened from max-w-md to max-w-4xl for PC layouts) */}
            <div className="relative w-full max-w-4xl mx-auto min-h-full pb-32 pt-[200px]" style={{ height: `${levels.length * 120 + 500}px` }}>

                {/* Castle at the Top (Goal - Level 20) */}
                <div className="absolute top-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-10">
                    <div className="relative cursor-pointer group">
                        <div className="absolute inset-0 bg-yellow-300 blur-2xl opacity-60 rounded-full animate-pulse-glow"></div>
                        <CastleIcon className="w-36 h-36 text-pink-500 drop-shadow-2xl relative z-10 animate-pulse-glow transition-all duration-300 group-hover:scale-110" />
                    </div>
                    <div className="bg-gradient-to-r from-[#FF7043] to-[#FF8A65] text-white px-6 py-2.5 rounded-2xl font-title font-bold shadow-xl mt-4 border-4 border-white transform -rotate-1 hover:rotate-0 transition-transform duration-300">
                        🏆 마법의 성 🏆
                    </div>
                </div>

                {/* Winding Path (Treasure Map Style) */}
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
                    {/* Shadow Path */}
                    <path
                        d={`M 400 180 ${levels.map(l => `L ${parseFloat(l.x) * 8} ${parseFloat(l.y)}`).join(' ')}`}
                        fill="none"
                        stroke="rgba(0,0,0,0.08)"
                        strokeWidth="20"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    {/* Main Path */}
                    <path
                        d={`M 400 180 ${levels.map(l => `L ${parseFloat(l.x) * 8} ${parseFloat(l.y)}`).join(' ')}`}
                        fill="none"
                        stroke="#8D6E63"
                        strokeWidth="8"
                        strokeDasharray="20, 15"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-60"
                    />
                </svg>

                {/* Level Nodes */}
                {levels.map((level) => (
                    <div key={level.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 transition-all duration-300"
                        style={{ left: level.x, top: level.y }}>

                        <LevelNode
                            level={level.level}
                            status={level.status}
                            position={{ x: '0', y: '0' }}
                            onClick={() => navigate(`/quiz/${level.id}`)}
                        />

                        {/* Subject Label (Wooden Sign Style) */}
                        <div className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-3 px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-lg whitespace-nowrap border-2 border-white/50
                            ${level.subject === 'math' ? 'bg-gradient-to-r from-green-500 to-green-600' : 
                                level.subject === 'korean' ? 'bg-gradient-to-r from-orange-500 to-orange-600' : 
                                    'bg-gradient-to-r from-purple-500 to-purple-600'}`}>
                            {level.subject === 'math' ? '수학 📐' :
                                level.subject === 'korean' ? '국어 📜' : '영어 🅰️'}
                        </div>

                        {/* Stars for Cleared Levels */}
                        {level.status === 'cleared' && (
                            <div className="absolute -top-4 -right-4 flex bg-white/95 rounded-full px-2 py-1 shadow-md border border-yellow-200">
                                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                                <Star size={12} className="text-yellow-400 fill-yellow-400 -ml-0.5" />
                                <Star size={12} className="text-yellow-400 fill-yellow-400 -ml-0.5" />
                            </div>
                        )}
                    </div>
                ))}

                {/* Start House */}
                <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2" style={{ top: `${levels.length * 120 + 220}px` }}>
                    <HouseIcon className="w-32 h-32 text-[#8D6E63] drop-shadow-2xl animate-float-cloud-slow" />
                    <div className="bg-gradient-to-r from-[#8D6E63] to-[#A1887F] text-white px-6 py-1.5 rounded-2xl font-title text-sm font-bold shadow-xl mt-2 border-2 border-white text-center">
                        우리집 🏠
                    </div>
                </div>
            </div>
        </div>
    );
};

const Lobby = () => {
    const navigate = useNavigate();
    const [isMuted, setIsMuted] = useState(soundManager.muted);
    const [levels, setLevels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState('math'); // Default subject
    const [gold, setGold] = useState(0);

    useEffect(() => {
        soundManager.playBGM(SOUNDS.BGM_LOBBY);
        fetchLevels();
        fetchGold();
        return () => soundManager.stopBGM();
    }, []);

    const fetchLevels = async () => {
        try {
            const response = await apiFetch('/api/v1/quiz/levels');
            const data = await response.json();
            setLevels(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch levels:', error);
        }
    };

    const fetchGold = async () => {
        try {
            const res = await apiFetch('/api/v1/store/me');
            const body = await res.json().catch(() => ({}));
            if (!res.ok) return;
            setGold(Number(body.gold || 0));
        } catch {
            // ignore
        }
    };

    // Filter levels based on selected subject and map them to positions
    const getFilteredLevels = () => {
        const filtered = levels.filter(l => l.subject === selectedSubject);
        return filtered.map((level, index) => {
            // Invert Y: Level 1 (index 0) at Bottom, Level 20 at Top
            // Total height ~ levels.length * 120
            // Top padding for Castle ~ 300px
            const reversedIndex = filtered.length - 1 - index;
            const y = reversedIndex * 120 + 300;
            const x = 50 + Math.sin(index * 0.8) * 35; // Winding path
            return { ...level, x: `${x}%`, y: `${y}px` };
        });
    };

    const toggleMute = () => {
        const muted = soundManager.toggleMute();
        setIsMuted(muted);
    };

    const handleParentClick = () => {
        navigate('/parent');
    };

    if (loading) return <div className="min-h-screen bg-cream flex items-center justify-center font-title text-2xl text-pink-DEFAULT animate-pulse">마법 왕국으로 떠나는 중... ✨</div>;

    const filteredLevels = getFilteredLevels();

    return (
        <div className="h-screen w-full bg-cream relative overflow-hidden flex flex-col">
            {/* Header / Status Bar (Glassmorphism) */}
            <div className="absolute top-0 left-0 right-0 p-4 flex flex-col gap-4 z-50 pointer-events-none">
                <div className="flex justify-between items-center pointer-events-auto">

                    {/* Home Button (Added) */}
                    <button onClick={() => navigate('/')} className="bg-white/80 p-2 rounded-full text-pink-500 hover:bg-pink-100 transition-colors shadow-sm border border-pink-200 mr-2">
                        <ArrowLeft size={24} />
                    </button>

                    <div className="flex items-center gap-3 bg-white/80 px-4 py-2 rounded-full shadow-sm border border-pink-200">
                        <div className="bg-pink-100 p-1.5 rounded-full">
                            <User size={20} className="text-pink-DEFAULT" />
                        </div>
                        <span className="font-title text-pink-600 font-bold text-lg">공주님</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full shadow-sm border border-yellow-200">
                            <Coins size={20} className="text-yellow-400 fill-yellow-400" />
                            <span className="font-title text-yellow-600 font-bold text-lg">{gold.toLocaleString()}</span>
                        </div>

                        <button onClick={toggleMute} className="p-3 bg-white/80 rounded-full text-gray-400 hover:text-pink-500 hover:bg-pink-50 transition-all shadow-sm">
                            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>

                        <button onClick={handleParentClick} className="p-3 bg-white/80 rounded-full text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all shadow-sm">
                            ⚙️
                        </button>
                    </div>
                </div>

                {/* Subject Tabs */}
                <div className="flex justify-center gap-4 pointer-events-auto">
                    {['math', 'korean', 'english'].map(subject => (
                        <button
                            key={subject}
                            onClick={() => setSelectedSubject(subject)}
                            className={`px-6 py-3 rounded-2xl font-title text-lg font-bold shadow-lg transition-all transform hover:scale-105
                                ${selectedSubject === subject
                                    ? (subject === 'math' ? 'bg-[#2E7D32] text-white ring-4 ring-green-200' :
                                        subject === 'korean' ? 'bg-[#F57F17] text-white ring-4 ring-orange-200' :
                                            'bg-[#7B1FA2] text-white ring-4 ring-purple-200')
                                    : 'bg-white text-gray-400 hover:bg-gray-50'
                                }`}
                        >
                            {subject === 'math' ? '수학 🦕' :
                                subject === 'korean' ? '국어 🦁' : '영어 🧚‍♀️'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Render LobbyMap only when not loading */}
            {!loading && <LobbyMap levels={filteredLevels} navigate={navigate} />}
        </div>
    );
};

export default Lobby;
