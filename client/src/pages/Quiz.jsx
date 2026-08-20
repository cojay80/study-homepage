import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, Star, Trophy, Heart } from 'lucide-react';
import { soundManager, SOUNDS } from '../utils/SoundManager';
import confetti from 'canvas-confetti';
import { apiFetch } from '../utils/api';

const MotionDiv = motion.div;
const MotionButton = motion.button;

const Quiz = () => {
    const { levelId } = useParams();
    const navigate = useNavigate();

    const [questions, setQuestions] = useState([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false); // Final Level Result
    const [feedback, setFeedback] = useState(null); // Immediate feedback (correct/wrong)
    const [subject, setSubject] = useState('default'); // New state for subject

    const fetchQuiz = useCallback(async () => {
        try {
            const response = await apiFetch(`/api/v1/quiz/${levelId}`);
            if (!response.ok) throw new Error('Failed to fetch quiz');
            const data = await response.json();

            // Ensure data.question_data is an array
            let parsedQuestions = data.question_data;
            if (typeof parsedQuestions === 'string') {
                parsedQuestions = JSON.parse(parsedQuestions);
            }

            if (Array.isArray(parsedQuestions)) {
                setQuestions(parsedQuestions);
                setSubject(data.subject || 'default'); // Set subject from fetched data
            } else {
                console.error('Invalid question format:', parsedQuestions);
                setQuestions([]);
            }
        } catch (error) {
            console.error('Error fetching quiz:', error);
            setQuestions([]);
        } finally {
            setLoading(false);
        }
    }, [levelId]);

    useEffect(() => {
        fetchQuiz();
        soundManager.stopBGM();
    }, [fetchQuiz]);

    const handleOptionClick = (option) => {
        if (feedback) return; // Prevent double clicks

        const currentQuestion = questions[currentQIndex];
        const isCorrect = option === currentQuestion.answer;

        // Play Sound
        if (isCorrect) {
            soundManager.playSFX(SOUNDS.SFX_CORRECT);
            setScore(prev => prev + 1);
            // Gold Explosion Effect
            confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.7 },
                colors: ['#FFD700', '#FFA500']
            });
        } else {
            soundManager.playSFX(SOUNDS.SFX_WRONG);
        }

        // Show Feedback
        setFeedback({ isCorrect, correctAns: currentQuestion.answer });

        // Move to next question after delay
        setTimeout(() => {
            setFeedback(null);
            if (currentQIndex < questions.length - 1) {
                setCurrentQIndex(prev => prev + 1);
            } else {
                finishLevel(isCorrect ? score + 1 : score);
            }
        }, 1500);
    };

    const finishLevel = async (finalScore) => {
        const isCleared = finalScore >= 3; // Pass if 3/5 correct
        setShowResult(true); // Just show the modal, score is read from state

        if (isCleared) {
            soundManager.playSFX(SOUNDS.SFX_CORRECT); // Victory sound
            confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
        }

        // Submit Result to Backend
        try {
            await apiFetch('/api/v1/quiz/submit', {
                method: 'POST',
                json: {
                    quizId: levelId,
                    isCleared
                }
            });
        } catch (error) {
            console.error('Failed to submit result:', error);
        }
    };

    // Theme Configuration
    const getTheme = () => {
        if (subject === 'math') {
            return {
                bg: 'bg-[#2E7D32]', // Blackboard Green
                container: 'bg-[#2E7D32] border-8 border-[#8D6E63] shadow-2xl rounded-lg', // Wood Frame
                text: 'text-white font-chalk', // Chalk effect (using Jua as proxy)
                option: 'bg-transparent border-2 border-white/50 text-white hover:bg-white/10',
                accent: 'text-yellow-300'
            };
        }
        return {
            bg: 'bg-gradient-to-b from-sky-300 to-green-200', // Nature
            container: 'bg-white/90 backdrop-blur-sm border-4 border-white shadow-xl rounded-3xl',
            text: 'text-gray-800',
            option: 'bg-white border-2 border-blue-100 text-gray-700 hover:bg-blue-50 hover:border-blue-300',
            accent: 'text-pink-500'
        };
    };

    const theme = getTheme();

    if (loading) return <div className="min-h-screen flex items-center justify-center font-title text-2xl animate-pulse">문제지 펼치는 중... 📖</div>;
    if (questions.length === 0) return <div className="min-h-screen flex items-center justify-center">문제가 없어요! 😅</div>;

    const currentQuestion = questions[currentQIndex];

    return (
        <div className={`min-h-screen w-full ${theme.bg} flex flex-col items-center justify-center p-4 relative overflow-hidden`}>

            {/* HUD: Lives & Progress */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
                <button onClick={() => navigate('/')} className="bg-white/20 p-2 rounded-full backdrop-blur-md hover:bg-white/40 transition-colors">
                    <ArrowLeft className="text-white" size={24} />
                </button>

                {/* Progress Bar */}
                <div className="flex-1 mx-4 h-4 bg-black/20 rounded-full overflow-hidden border-2 border-white/30">
                    <MotionDiv
                        className="h-full bg-yellow-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentQIndex) / questions.length) * 100}%` }}
                    />
                </div>

                {/* Lives (Hearts) */}
                <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                        <Heart key={i} size={24} className="text-red-500 fill-red-500 drop-shadow-md" />
                    ))}
                </div>
            </div>

            {/* Question Container */}
            <MotionDiv
                key={currentQIndex}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`w-full max-w-lg p-8 ${theme.container} relative z-10 min-h-[400px] flex flex-col justify-center`}
            >
                {/* Chalkboard Dust Effect (Math Only) */}
                {subject === 'math' && <div className="absolute inset-0 bg-white/5 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/dust.png")' }}></div>}

                {/* Question Text */}
                <h2 className={`text-3xl md:text-4xl font-title text-center mb-8 leading-relaxed ${theme.text}`}>
                    {currentQuestion.question}
                </h2>

                {/* Options Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {currentQuestion.options.map((option, idx) => (
                        <MotionButton
                            key={idx}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleOptionClick(option)}
                            className={`p-6 text-xl font-bold rounded-xl transition-all duration-200 ${theme.option}`}
                        >
                            {option}
                        </MotionButton>
                    ))}
                </div>

                {/* Feedback Overlay */}
                <AnimatePresence>
                    {feedback && (
                        <MotionDiv
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center z-50 bg-black/10 backdrop-blur-[2px] rounded-lg"
                        >
                            {feedback.isCorrect ? (
                                <div className="text-8xl drop-shadow-2xl animate-bounce">⭕</div>
                            ) : (
                                <div className="text-8xl drop-shadow-2xl animate-shake">❌</div>
                            )}
                        </MotionDiv>
                    )}
                </AnimatePresence>
            </MotionDiv>

            {/* Character Helper (Bottom Right) */}
            <div className="absolute bottom-0 right-4 w-32 h-32 z-20 pointer-events-none">
                {/* Placeholder for Character - Can be replaced with SVG later */}
                <div className="text-9xl filter drop-shadow-xl transform translate-y-4">
                    {subject === 'math' ? '👩‍🏫' : '🧚‍♀️'}
                </div>
            </div>

            {/* Level Complete Modal */}
            <AnimatePresence>
                {showResult && (
                    <MotionDiv
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                    >
                        <MotionDiv
                            initial={{ scale: 0.8, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border-4 border-yellow-300 relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-yellow-100 to-transparent"></div>

                            <h2 className="text-3xl font-title text-yellow-600 mb-2 relative z-10">
                                {score >= 3 ? '참 잘했어요! 🎉' : '조금 더 힘내요! 💪'}
                            </h2>

                            <div className="flex justify-center gap-2 mb-6 relative z-10">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <Star key={i}
                                        size={32}
                                        className={`${i <= score ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} drop-shadow-sm`}
                                    />
                                ))}
                            </div>

                            <p className="text-gray-600 mb-8 font-body text-lg">
                                {score >= 3 ? '멋진 실력이에요! 다음 단계로 가볼까요?' : '다시 한번 도전해보세요!'}
                            </p>

                            <div className="flex gap-3 justify-center">
                                <button onClick={() => window.location.reload()} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                                    다시하기
                                </button>
                                <button onClick={() => navigate('/')} className="flex-1 py-3 bg-pink-500 text-white rounded-xl font-bold shadow-lg hover:bg-pink-600 transition-transform active:scale-95">
                                    나가기
                                </button>
                            </div>
                        </MotionDiv>
                    </MotionDiv>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Quiz;
