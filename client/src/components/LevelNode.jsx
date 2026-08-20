import React from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

const MotionButton = motion.button;

const LevelNode = ({ level, status, onClick }) => {
    const isLocked = status === 'locked';
    const isCleared = status === 'cleared';
    const isOpen = status === 'open';

    return (
        <MotionButton
            animate={!isLocked ? { y: [0, -6, 0] } : {}}
            transition={!isLocked ? { repeat: Infinity, duration: 2.2 + (level % 3) * 0.4, ease: "easeInOut" } : {}}
            whileHover={!isLocked ? { scale: 1.15 } : {}}
            whileTap={!isLocked ? { scale: 0.9 } : {}}
            onClick={!isLocked ? onClick : undefined}
            className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300
        ${isLocked
                    ? 'bg-gray-200 border-4 border-gray-300 cursor-not-allowed'
                    : isCleared
                        ? 'bg-gradient-to-br from-green-400 to-green-500 border-4 border-white ring-4 ring-green-200'
                        : 'bg-gradient-to-br from-pink-400 to-pink-500 border-4 border-white ring-4 ring-pink-200 animate-pulse-slow'
                }
      `}
        >
            {/* Icon / Number */}
            {isLocked ? (
                <Lock size={24} className="text-gray-400" />
            ) : isCleared ? (
                <span className="font-title text-2xl text-white font-bold drop-shadow-md">{level}</span>
            ) : (
                <span className="font-title text-3xl text-white font-bold drop-shadow-md">{level}</span>
            )}

            {/* Ripple Effect for Open Levels */}
            {isOpen && (
                <span className="absolute inset-0 rounded-full border-4 border-pink-400 opacity-50 animate-ping"></span>
            )}
        </MotionButton>
    );
};

export default LevelNode;
