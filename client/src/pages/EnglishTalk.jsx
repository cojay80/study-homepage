import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, Square, Send, Volume2, RefreshCw, MicOff } from 'lucide-react';
import { apiFetch } from '../utils/api';

const DIFFICULTIES = [
  { id: 'elementary', label: '초등' },
  { id: 'middle', label: '중등' },
  { id: 'high', label: '고등' },
];

const STORAGE_KEY = 'englishTalk_chat_v1';
const AUTO_LISTEN_KEY = 'englishTalk_autoListen_v1';
const MEANINGS_KEY = 'englishTalk_wordMeanings_v1';

function getSpeechRecognition() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function isMobileDevice() {
  const ua = String(navigator?.userAgent || '').toLowerCase();
  return /android|iphone|ipad|ipod/.test(ua) || (navigator?.maxTouchPoints || 0) > 1;
}

function localDayStartMs() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'so', 'because', 'to', 'of', 'in', 'on', 'at', 'for', 'with',
  'is', 'are', 'am', 'was', 'were', 'be', 'been', 'being',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'her', 'its', 'our', 'their',
  'this', 'that', 'these', 'those',
  'do', 'does', 'did', 'done', 'doing',
  'have', 'has', 'had',
  'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must',
  'not', 'no', 'yes',
  'what', 'why', 'how', 'when', 'where', 'who',
  'hello', 'hi', 'thanks', 'thank',
]);

function extractWords(text) {
  const matches = String(text || '').match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) || [];
  const counts = new Map();
  for (const raw of matches) {
    const w = raw.toLowerCase();
    if (w.length < 4) continue;
    if (STOPWORDS.has(w)) continue;
    counts.set(w, (counts.get(w) || 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => w);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickSentenceContainingWord(texts, word) {
  const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\b`, 'i');
  for (const t of texts) {
    const sentences = String(t || '').split(/(?<=[.!?])\s+/);
    for (const s of sentences) {
      if (re.test(s)) return s.trim();
    }
  }
  return null;
}

const EnglishTalk = () => {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState('elementary');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoListen, setAutoListen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [typedText, setTypedText] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState(null);
  const [caps, setCaps] = useState(null);
  const srSupported = Boolean(getSpeechRecognition());
  const isMobile = typeof navigator !== 'undefined' ? isMobileDevice() : false;

  const [quiz, setQuiz] = useState(null); // { prompt, options, answer }
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });
  const [wordMeanings, setWordMeanings] = useState({});
  const [isLoadingMeanings, setIsLoadingMeanings] = useState(false);

  const [audioMode, setAudioMode] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const bottomRef = useRef(null);

  const recognitionRef = useRef(null);
  const lastAiRef = useRef('');
  const autoListenRef = useRef(false);
  const lastSpeechErrorRef = useRef('');

  const historyForServer = useMemo(() => {
    return messages
      .slice(-12)
      .map((m) => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.text,
      }));
  }, [messages]);

  const speak = (text, opts = {}) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.rate = opts.rate ?? (difficulty === 'elementary' ? 0.9 : difficulty === 'middle' ? 1.0 : 1.05);
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => {
      setIsSpeaking(false);
      if (autoListenRef.current) {
        window.setTimeout(() => {
          if (autoListenRef.current) startRecording({ force: true });
        }, 250);
      }
    };
    utter.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

  const loadStatus = async () => {
    const res = await apiFetch('/api/v1/ai/status');
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || '상태를 불러오지 못했어요.');
    setStatus(body);
  };

  const loadCaps = async () => {
    const res = await apiFetch('/api/v1/ai/capabilities');
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return;
    setCaps(body);
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.messages)) {
          const normalized = parsed.messages.map((m) => ({
            role: m.role === 'ai' ? 'ai' : 'child',
            text: String(m.text || ''),
            createdAt: Number(m.createdAt || Date.now()),
          }));
          setMessages(normalized);
        }
        if (typeof parsed?.lastAi === 'string') lastAiRef.current = parsed.lastAi;
      }
    } catch {
      // ignore
    }

    loadStatus().catch((e) => setError(e?.message || '상태를 불러오지 못했어요.'));
    loadCaps().catch(() => { /* ignore */ });

    try {
      const rawAuto = localStorage.getItem(AUTO_LISTEN_KEY);
      if (rawAuto === '1') setAutoListen(true);
    } catch {
      // ignore
    }

    try {
      const rawMeanings = localStorage.getItem(MEANINGS_KEY);
      if (rawMeanings) {
        const parsed = JSON.parse(rawMeanings);
        if (parsed && typeof parsed === 'object') setWordMeanings(parsed);
      }
    } catch {
      // ignore
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* ignore */ }
        recognitionRef.current = null;
      }
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, lastAi: lastAiRef.current }));
    } catch {
      // ignore
    }
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  useEffect(() => {
    autoListenRef.current = autoListen;
    try {
      localStorage.setItem(AUTO_LISTEN_KEY, autoListen ? '1' : '0');
    } catch {
      // ignore
    }
  }, [autoListen]);

  useEffect(() => {
    try {
      localStorage.setItem(MEANINGS_KEY, JSON.stringify(wordMeanings));
    } catch {
      // ignore
    }
  }, [wordMeanings]);

  const remainingMinutes = status?.remainingMinutes ?? null;
  const isTimeOver = remainingMinutes !== null && remainingMinutes <= 0;
  const isActive = isRecording || isLoading || isSpeaking || isRecordingAudio;

  const todayWords = useMemo(() => {
    const start = localDayStartMs();
    const aiTexts = messages
      .filter((m) => m.role === 'ai' && Number(m.createdAt || 0) >= start)
      .map((m) => m.text);
    return extractWords(aiTexts.join('\n')).slice(0, 14);
  }, [messages]);

  const fetchMeanings = async () => {
    setError('');
    if (todayWords.length === 0) return;
    const missing = todayWords.filter((w) => !wordMeanings[w]);
    if (missing.length === 0) return;

    setIsLoadingMeanings(true);
    try {
      const res = await apiFetch('/api/v1/ai/word-meanings', {
        method: 'POST',
        json: { words: missing },
        retry: false,
        timeoutMs: 20000,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || '뜻을 불러오지 못했어요.');

      const items = Array.isArray(body.items) ? body.items : [];
      setWordMeanings((prev) => {
        const next = { ...prev };
        for (const it of items) {
          if (it?.word && typeof it?.meaning_kr === 'string' && it.meaning_kr.trim()) {
            next[String(it.word)] = it.meaning_kr.trim();
          }
        }
        return next;
      });
    } catch (e) {
      setError(e?.message || '뜻을 불러오지 못했어요.');
    } finally {
      setIsLoadingMeanings(false);
    }
  };

  const buildNewQuiz = () => {
    if (todayWords.length < 4) {
      setQuiz(null);
      return;
    }
    const answer = todayWords[Math.floor(Math.random() * todayWords.length)];
    const aiTexts = messages.filter((m) => m.role === 'ai').map((m) => m.text);
    const sentence = pickSentenceContainingWord(aiTexts, answer);
    const prompt = sentence
      ? sentence.replace(new RegExp(`\\b${answer}\\b`, 'ig'), '_____')
      : `Choose the correct word: _____`;

    const options = shuffle([
      answer,
      ...shuffle(todayWords.filter((w) => w !== answer)).slice(0, 3),
    ]);

    setQuiz({ prompt, options, answer });
  };

  useEffect(() => {
    buildNewQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayWords.join('|')]);

  const sendToServer = async (text) => {
    setError('');
    const userText = String(text || '').trim();
    if (!userText) return;
    if (userText.length > 600) {
      setError('메시지가 너무 길어요.');
      return;
    }
    if (isTimeOver) {
      setError('오늘 영어 대화 시간이 끝났어요. 내일 다시 와요!');
      return;
    }

    setIsLoading(true);
    try {
      lastSpeechErrorRef.current = '';
      const now = Date.now();
      const res = await apiFetch('/api/v1/ai/english-chat', {
        method: 'POST',
        json: {
          difficulty,
          history: historyForServer,
          text: userText,
        },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 429) throw new Error('너무 빠르게 말하고 있어요. 잠깐 쉬었다가 다시 해요.');
        throw new Error(body.error || '요청에 실패했어요.');
      }

      setMessages((prev) => [
        ...prev,
        { role: 'child', text: userText, createdAt: now },
        { role: 'ai', text: body.replyText, createdAt: Date.now() },
      ]);
      lastAiRef.current = body.replyText;
      speak(body.replyText);

      if (typeof body.remainingMinutes === 'number') {
        setStatus((prev) => ({
          ...(prev || {}),
          remainingMinutes: body.remainingMinutes,
          turnsUsedToday: body.turnsUsedToday,
        }));
      } else {
        await loadStatus();
      }
    } catch (e) {
      setError(e?.message || '문제가 생겼어요.');
    } finally {
      setIsLoading(false);
    }
  };

  const sendAudioToServer = async (audioBlob) => {
    setError('');
    if (isTimeOver) {
      setError('오늘 영어 대화 시간이 끝났어요. 내일 다시 와요!');
      return;
    }

    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.append('difficulty', difficulty);
      fd.append('history', JSON.stringify(historyForServer));
      fd.append('audio', audioBlob, 'speech.webm');

      const res = await apiFetch('/api/v1/ai/english-talk', {
        method: 'POST',
        body: fd,
        retry: false,
        timeoutMs: 60000,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 500 && String(body?.error || '').includes('OPENAI_API_KEY')) {
          throw new Error('오디오 모드는 서버에 OPENAI_API_KEY가 있어야 사용할 수 있어요.');
        }
        throw new Error(body.error || '오디오 처리에 실패했어요.');
      }

      const now = Date.now();
      if (body.transcript) {
        setMessages((prev) => [...prev, { role: 'child', text: body.transcript, createdAt: now }]);
      }
      if (body.replyText) {
        setMessages((prev) => [...prev, { role: 'ai', text: body.replyText, createdAt: Date.now() }]);
        lastAiRef.current = body.replyText;
        speak(body.replyText);
      }

      if (typeof body.remainingMinutes === 'number') {
        setStatus((prev) => ({ ...(prev || {}), remainingMinutes: body.remainingMinutes, turnsUsedToday: body.turnsUsedToday }));
      } else {
        await loadStatus();
      }
    } catch (e) {
      setError(e?.message || '오디오 처리에 실패했어요.');
    } finally {
      setIsLoading(false);
    }
  };

  const startAudioRecording = async () => {
    setError('');
    if (isLoading || isSpeaking || isRecording || isRecordingAudio) return;
    if (!navigator?.mediaDevices?.getUserMedia) {
      setError('이 기기/브라우저는 마이크 녹음을 지원하지 않아요.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        try {
          stream.getTracks().forEach((t) => t.stop());
        } catch {
          // ignore
        }
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        await sendAudioToServer(blob);
      };
      mediaRecorderRef.current = recorder;
      setIsRecordingAudio(true);
      recorder.start();
    } catch {
      setError('마이크 권한이 필요해요. 브라우저 설정에서 마이크를 허용해 주세요.');
    }
  };

  const stopAudioRecording = () => {
    try {
      mediaRecorderRef.current?.stop();
    } catch {
      // ignore
    }
    setIsRecordingAudio(false);
  };

  const startRecording = ({ force = false } = {}) => {
    setError('');
    if (!force && isActive) return;
    if (isLoading || isSpeaking) return;
    if (isTimeOver) {
      setError('오늘 영어 대화 시간이 끝났어요. 내일 다시 와요!');
      return;
    }

    const SR = getSpeechRecognition();
    if (!SR) {
      setError('이 브라우저는 음성 인식을 지원하지 않아요. (Chrome 추천)');
      return;
    }

    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event?.results?.[0]?.[0]?.transcript || '';
      setIsRecording(false);
      sendToServer(transcript);
    };
    recognition.onerror = (event) => {
      setIsRecording(false);
      const code = String(event?.error || '').trim();
      lastSpeechErrorRef.current = code;
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        setAutoListen(false);
        setError('마이크 권한이 필요해요. 브라우저 주소창 왼쪽의 🔒(또는 i)에서 마이크를 허용해 주세요.');
        return;
      }
      if (code === 'no-speech') {
        setError('목소리가 들리지 않았어요. 조금 더 크게 말해볼까요?');
        return;
      }
      if (code === 'network') {
        setError('음성 인식 네트워크 오류가 있어요. 잠깐 뒤에 다시 해볼까요?');
        return;
      }
      setError('음성 인식에 실패했어요. 다시 해볼까요?');
    };
    recognition.onend = () => {
      setIsRecording(false);
      if (!autoListenRef.current) return;
      if (isTimeOver) return;
      if (isLoading || isSpeaking) return;
      const lastErr = lastSpeechErrorRef.current;
      if (lastErr === 'not-allowed' || lastErr === 'service-not-allowed') return;
      window.setTimeout(() => {
        if (autoListenRef.current && !isLoading && !isSpeaking) startRecording({ force: true });
      }, 400);
    };

    recognitionRef.current = recognition;
    setIsRecording(true);
    recognition.start();
  };

  const stopRecording = () => {
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    setIsRecording(false);
  };

  return (
    <div className="min-h-screen bg-[#E0F7FA] font-title relative overflow-hidden">
      <div className="bg-gradient-to-r from-sky-400 via-sky-300 to-cyan-400 p-4 shadow-lg sticky top-0 z-20 flex items-center justify-between border-b-4 border-white/20">
        <button onClick={() => navigate('/study')} className="bg-white/80 p-2 rounded-full text-cyan-500 hover:bg-cyan-100 transition-colors shadow-sm border border-cyan-200">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-extrabold text-white drop-shadow-md">AI English Talk 🧚‍♀️</h1>
        <div className="w-10" />
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 flex flex-col gap-5">
        
        {/* Fairy Guide Character Card */}
        <div className="bg-gradient-to-r from-sky-400 via-sky-300 to-cyan-400 rounded-3xl p-6 shadow-xl border-4 border-white text-white flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="relative w-24 h-24 bg-white/95 rounded-full flex items-center justify-center shadow-lg border-4 border-cyan-100 flex-shrink-0 animate-float-cloud-slow">
            <span className="text-5xl select-none" role="img" aria-label="fairy">🧚‍♀️</span>
            <span className="absolute bottom-0 right-0 bg-yellow-400 text-xs px-2 py-0.5 rounded-full font-bold text-gray-800 shadow">도움</span>
          </div>
          <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left z-10">
            <h2 className="text-2xl font-bold drop-shadow-md">요정 릴리 (Lily)</h2>
            <p className="text-xs font-semibold text-sky-100 mt-0.5">오늘의 마법 영어 대화 파트너</p>
            <div className="mt-2.5 bg-white/95 text-gray-800 rounded-2xl px-4 py-2 shadow-md relative border border-cyan-200 max-w-md">
              <p className="font-body text-xs md:text-sm font-medium leading-relaxed">
                "Hello! 릴리와 대화하며 재밌는 영어를 배워보아요.<br />
                아래 <b>말하기</b> 버튼을 누르고 영어로 말해보세요! ✨"
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-sky-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="text-gray-700 font-bold">난이도</div>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="border-2 border-sky-100 rounded-xl px-3 py-2 font-bold text-gray-700 focus:border-sky-400 outline-none"
              disabled={isActive}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-600 select-none">
              <input
                type="checkbox"
                checked={autoListen}
                onChange={(e) => setAutoListen(e.target.checked)}
                disabled={isLoading || isSpeaking}
              />
              자동 대화
            </label>
            <div className="text-sm text-gray-600 font-body">
              {remainingMinutes === null ? '...' : `남은 시간: 약 ${remainingMinutes}분`}
            </div>

            {/* Bouncing Audio Waveform Feedback */}
            {(isRecording || isRecordingAudio) && (
              <div className="flex items-end gap-1 px-2 h-6 justify-center">
                <div className="w-1 h-full bg-pink-400 rounded-full animate-wave-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1 h-full bg-pink-400 rounded-full animate-wave-bounce" style={{ animationDelay: '0.3s' }}></div>
                <div className="w-1 h-full bg-pink-400 rounded-full animate-wave-bounce" style={{ animationDelay: '0.5s' }}></div>
                <div className="w-1 h-full bg-pink-400 rounded-full animate-wave-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1 h-full bg-pink-400 rounded-full animate-wave-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            )}

            <div className="flex items-center gap-2">
              {(!srSupported && caps?.openaiSpeechEnabled) && (
                <button
                  onClick={() => setAudioMode((v) => !v)}
                  className={`px-3 py-2 rounded-xl font-bold border ${audioMode ? 'bg-sky-500 text-white border-sky-500' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                  disabled={isActive}
                >
                  오디오 모드
                </button>
              )}
              {!audioMode ? (
                !isRecording ? (
                  <button
                    onClick={() => startRecording()}
                    disabled={isActive || isTimeOver}
                    className="flex items-center gap-2 bg-pink-500 text-white px-4 py-3 rounded-xl font-bold shadow-md hover:bg-pink-600 disabled:opacity-50 transition-transform hover:scale-105 active:scale-95"
                  >
                    <Mic size={20} /> 말하기
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="flex items-center gap-2 bg-red-500 text-white px-4 py-3 rounded-xl font-bold shadow-md hover:bg-red-600 transition-transform hover:scale-105 active:scale-95 animate-pulse"
                  >
                    <Square size={20} /> 멈춤
                  </button>
                )
              ) : (
                !isRecordingAudio ? (
                  <button
                    onClick={startAudioRecording}
                    disabled={isActive || isTimeOver}
                    className="flex items-center gap-2 bg-pink-500 text-white px-4 py-3 rounded-xl font-bold shadow-md hover:bg-pink-600 disabled:opacity-50 transition-transform hover:scale-105 active:scale-95"
                  >
                    <Mic size={20} /> 녹음
                  </button>
                ) : (
                  <button
                    onClick={stopAudioRecording}
                    className="flex items-center gap-2 bg-red-500 text-white px-4 py-3 rounded-xl font-bold shadow-md hover:bg-red-600 transition-transform hover:scale-105 active:scale-95 animate-pulse"
                  >
                    <Square size={20} /> 전송
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {isMobile && !srSupported && !caps?.openaiSpeechEnabled && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-xl p-3 font-body">
            이 브라우저는 음성 인식을 지원하지 않아요. (Android Chrome/Edge 추천)
          </div>
        )}

        {isMobile && !srSupported && caps?.openaiSpeechEnabled && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-xl p-3 font-body flex items-center gap-2">
            <MicOff size={18} /> iOS Safari는 음성 인식이 제한적이에요. 필요하면 <b>오디오 모드</b>를 사용해요.
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-sky-100 min-h-[220px]">
          {messages.length === 0 ? (
            <div className="text-gray-500 font-body">“Hello!” 라고 말해보세요.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl px-4 py-3 max-w-[90%] ${m.role === 'ai'
                    ? 'bg-sky-100 text-sky-900 self-start'
                    : 'bg-pink-100 text-pink-900 self-end'
                    }`}
                >
                  <div className="text-xs opacity-70 mb-1">{m.role === 'ai' ? 'AI' : 'You'}</div>
                  <div className="font-body text-lg leading-relaxed">{m.text}</div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-sky-100 flex gap-2">
          <input
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            placeholder="영어로 입력해도 돼요..."
            className="flex-1 border-2 border-sky-100 rounded-xl px-3 py-3 text-base font-body text-gray-800 focus:border-sky-400 outline-none"
            disabled={isActive || isTimeOver}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const t = typedText;
                setTypedText('');
                sendToServer(t);
              }
            }}
          />
          <button
            onClick={() => {
              const t = typedText;
              setTypedText('');
              sendToServer(t);
            }}
            disabled={isActive || isTimeOver || !typedText.trim()}
            className="bg-sky-500 text-white px-4 py-3 rounded-xl font-bold shadow-md hover:bg-sky-600 disabled:opacity-50 flex items-center gap-2"
          >
            <Send size={18} /> 보내기
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => lastAiRef.current && speak(lastAiRef.current)}
            disabled={!lastAiRef.current}
            className="flex-1 bg-white rounded-2xl p-3 shadow-sm border border-sky-100 text-sky-700 font-bold hover:bg-sky-50 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Volume2 size={18} /> AI 다시 듣기
          </button>
          <button
            onClick={() => {
              setMessages([]);
              lastAiRef.current = '';
              setQuizScore({ correct: 0, total: 0 });
              setError('');
              if (window.speechSynthesis) window.speechSynthesis.cancel();
            }}
            className="flex-1 bg-white rounded-2xl p-3 shadow-sm border border-sky-100 text-gray-600 font-bold hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} /> 대화 지우기
          </button>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-sky-100">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="font-bold text-gray-800">오늘 배운 단어</div>
            <button
              onClick={() => {
                const joined = todayWords.join(', ');
                if (joined) speak(joined, { rate: 0.85 });
              }}
              disabled={todayWords.length === 0}
              className="text-sm font-bold text-sky-700 hover:text-sky-800 disabled:opacity-50 flex items-center gap-2"
            >
              <Volume2 size={16} /> 전체 읽기
            </button>
          </div>

          {todayWords.length === 0 ? (
            <div className="text-gray-500 font-body">AI가 말한 문장이 쌓이면 단어가 여기에 보여요.</div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={fetchMeanings}
                  disabled={isLoadingMeanings}
                  className="text-sm font-bold text-gray-700 hover:text-gray-900 disabled:opacity-50"
                >
                  {isLoadingMeanings ? '뜻 불러오는 중...' : '뜻 불러오기'}
                </button>
                <div className="text-xs text-gray-400 font-body">뜻은 하루 1번 캐시돼요.</div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {todayWords.map((w) => (
                  <button
                    key={w}
                    onClick={() => speak(w, { rate: 0.85 })}
                    className="text-left px-3 py-2 rounded-2xl bg-sky-50 border border-sky-100 hover:bg-sky-100"
                    title="눌러서 발음 듣기"
                  >
                    <div className="text-sky-900 font-extrabold">{w}</div>
                    <div className="text-xs text-gray-600 font-body mt-0.5">
                      {wordMeanings[w] ? wordMeanings[w] : '뜻: (불러오기)'}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-sky-100">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="font-bold text-gray-800">단어 퀴즈</div>
            <button
              onClick={buildNewQuiz}
              className="text-sm font-bold text-sky-700 hover:text-sky-800 flex items-center gap-2"
            >
              <RefreshCw size={16} /> 새 문제
            </button>
          </div>

          {!quiz ? (
            <div className="text-gray-500 font-body">단어가 4개 이상 모이면 퀴즈가 나와요.</div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 font-body text-gray-800">
                {quiz.prompt}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quiz.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      const ok = opt === quiz.answer;
                      setQuizScore((s) => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }));
                      speak(opt, { rate: 0.9 });
                      buildNewQuiz();
                    }}
                    className="px-3 py-3 rounded-xl bg-white border-2 border-gray-100 hover:border-sky-200 font-bold text-gray-800"
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <div className="text-sm text-gray-600 font-body">
                점수: {quizScore.correct} / {quizScore.total}
              </div>
            </div>
          )}
        </div>

        {isLoading && <div className="text-center text-gray-500 font-body animate-pulse">Thinking...</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 font-body">{error}</div>}
      </div>
    </div>
  );
};

export default EnglishTalk;
