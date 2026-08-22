import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, Clock, Award, ShieldCheck, KeyRound, MessageCircle, Settings, LockKeyhole, BookOpenText } from 'lucide-react';
import { apiFetch, clearAuth } from '../utils/api';

const PARENT_TOKEN_KEY = 'parent_token_v1';
const LIMIT_OPTIONS = [30, 45, 60, 90, 120];

function getParentToken() {
  return sessionStorage.getItem(PARENT_TOKEN_KEY);
}

function setParentToken(token) {
  sessionStorage.setItem(PARENT_TOKEN_KEY, token);
}

function clearParentToken() {
  sessionStorage.removeItem(PARENT_TOKEN_KEY);
}

const ParentDashboard = () => {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [parentToken, setParentTokenState] = useState(getParentToken());

  const [quizReport, setQuizReport] = useState(null);
  const [aiReport, setAiReport] = useState(null);
  const [aiCost, setAiCost] = useState(null);
  const [costMonth, setCostMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [settings, setSettings] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showPinSetup, setShowPinSetup] = useState(false);
  const [accountPassword, setAccountPassword] = useState('');
  const [newPin, setNewPin] = useState('');

  const [oldPin, setOldPin] = useState('');
  const [changePinNew, setChangePinNew] = useState('');

  const parentFetch = useCallback((path, options = {}) => {
    const token = parentToken;
    const headers = new Headers(options.headers || {});
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (options.json) headers.set('Content-Type', 'application/json');
    return fetch(path, {
      ...options,
      headers,
      body: options.json ? JSON.stringify(options.json) : options.body,
    });
  }, [parentToken]);

  const refreshAll = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const [r1, r2, r3, r4] = await Promise.all([
        parentFetch('/api/v1/parent/report'),
        parentFetch('/api/v1/parent/ai-report'),
        parentFetch('/api/v1/parent/settings'),
        parentFetch(`/api/v1/parent/ai-cost?month=${encodeURIComponent(costMonth)}`),
      ]);

      if (r1.status === 401 || r2.status === 401 || r3.status === 401 || r4.status === 401) {
        clearParentToken();
        setParentTokenState(null);
        setError('부모 확인이 필요해요.');
        return;
      }

      const j1 = await r1.json().catch(() => null);
      const j2 = await r2.json().catch(() => null);
      const j3 = await r3.json().catch(() => null);
      const j4 = await r4.json().catch(() => null);

      if (!r1.ok) throw new Error(j1?.error || '학습 리포트를 불러오지 못했어요.');
      if (!r2.ok) throw new Error(j2?.error || 'AI 대화 리포트를 불러오지 못했어요.');
      if (!r3.ok) throw new Error(j3?.error || '설정을 불러오지 못했어요.');
      if (!r4.ok) throw new Error(j4?.error || 'AI 비용 리포트를 불러오지 못했어요.');

      setQuizReport(j1);
      setAiReport(j2);
      setSettings(j3);
      setAiCost(j4);
      setSummary(null);
    } catch (e) {
      setError(e?.message || '문제가 생겼어요.');
    } finally {
      setLoading(false);
    }
  }, [parentFetch, costMonth]);

  useEffect(() => {
    if (parentToken) refreshAll();
  }, [parentToken, refreshAll]);

  const handleVerify = async () => {
    setError('');
    const p = pin.trim();
    if (!p) {
      setError('부모 PIN을 입력해 주세요.');
      return;
    }

    setVerifying(true);
    try {
      const res = await apiFetch('/api/v1/parent/verify-pin', {
        method: 'POST',
        json: { pin: p },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || '부모 확인에 실패했어요.');

      setParentToken(body.token);
      setParentTokenState(body.token);
      setPin('');
    } catch (e) {
      setError(e?.message || '부모 확인에 실패했어요.');
    } finally {
      setVerifying(false);
    }
  };

  const updateLimit = async (minutes) => {
    setError('');
    try {
      const res = await parentFetch('/api/v1/parent/settings', {
        method: 'PUT',
        json: { dailyLimitMinutes: minutes },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || '설정 변경에 실패했어요.');
      setSettings((prev) => ({ ...prev, dailyLimitMinutes: minutes }));
      await refreshAll();
    } catch (e) {
      setError(e?.message || '설정 변경에 실패했어요.');
    }
  };

  const usageText = useMemo(() => {
    const u = aiReport?.usage;
    if (!u) return null;
    return `오늘 사용: ${u.turnsUsedToday}턴, 남은 시간(대략): ${u.remainingMinutes}분`;
  }, [aiReport]);

  const tokenText = useMemo(() => {
    const t = aiReport?.usage?.tokensToday;
    if (!t) return null;
    const total = Number(t.totalTokens || 0);
    if (!total) return '토큰 사용량(오늘): 집계 중...';
    return `토큰 사용량(오늘): ${Number(t.promptTokens || 0).toLocaleString()} in / ${Number(t.completionTokens || 0).toLocaleString()} out (총 ${total.toLocaleString()})`;
  }, [aiReport]);

  const costTodayText = useMemo(() => {
    const u = aiReport?.usage;
    if (!u) return null;
    if (!u.pricingConfigured) return '오늘 비용(추정): 가격 설정 필요';
    if (typeof u.costTodayUsd !== 'number') return '오늘 비용(추정): 집계 중...';
    return `오늘 비용(추정): $${u.costTodayUsd.toFixed(4)}`;
  }, [aiReport]);

  const monthCostText = useMemo(() => {
    if (!aiCost) return null;
    if (!aiCost.pricingConfigured) return '이번 달 비용(추정): 가격 설정 필요';
    const cost = aiCost?.totals?.estimatedCostUsd;
    if (typeof cost !== 'number') return '이번 달 비용(추정): 집계 중...';
    return `이번 달 비용(추정): $${cost.toFixed(4)}`;
  }, [aiCost]);

  const generateSummary = async () => {
    setError('');
    try {
      const res = await parentFetch('/api/v1/parent/ai-summary', { method: 'POST', json: {} });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || '요약 생성에 실패했어요.');
      setSummary(body);
    } catch (e) {
      setError(e?.message || '요약 생성에 실패했어요.');
    }
  };

  const handleSetPin = async () => {
    setError('');
    const p = accountPassword;
    const pinValue = newPin.trim();
    if (!p) return setError('계정 비밀번호를 입력해 주세요.');
    if (pinValue.length < 4) return setError('PIN은 4자리 이상으로 해주세요.');
    try {
      const res = await apiFetch('/api/v1/parent/set-pin', { method: 'POST', json: { password: p, newPin: pinValue } });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'PIN 설정에 실패했어요.');
      setShowPinSetup(false);
      setAccountPassword('');
      setNewPin('');
      setError('PIN 설정이 완료됐어요. 이제 부모 확인을 해주세요.');
    } catch (e) {
      setError(e?.message || 'PIN 설정에 실패했어요.');
    }
  };

  const changePin = async () => {
    setError('');
    const o = oldPin.trim();
    const n = changePinNew.trim();
    if (!o) return setError('기존 PIN을 입력해 주세요.');
    if (n.length < 4) return setError('새 PIN은 4자리 이상으로 해주세요.');
    try {
      const res = await parentFetch('/api/v1/parent/change-pin', { method: 'PUT', json: { oldPin: o, newPin: n } });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'PIN 변경에 실패했어요.');
      setOldPin('');
      setChangePinNew('');
      setError('PIN이 변경됐어요.');
    } catch (e) {
      setError(e?.message || 'PIN 변경에 실패했어요.');
    }
  };

  if (!parentToken) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50/50 p-6">
        <div className="flex items-center mb-8">
          <button onClick={() => navigate('/')} className="mr-4 p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span className="p-2 bg-blue-100 rounded-xl text-blue-600"><ShieldCheck size={20} /></span> 부모 모드
          </h1>
        </div>

        <div className="max-w-md mx-auto bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-gray-700 font-bold mb-2">부모 PIN을 입력해 주세요</div>
          <div className="text-gray-400 text-sm font-body mb-4">
            아이 계정 생성 시 입력한 PIN이에요.
          </div>

          <div className="relative mb-4">
            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="부모 PIN"
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 outline-none"
              disabled={verifying}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleVerify();
              }}
            />
          </div>

          <button
            onClick={handleVerify}
            disabled={verifying}
            className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 disabled:opacity-60"
          >
            {verifying ? '확인 중...' : '부모 확인'}
          </button>

          <button
            onClick={() => setShowPinSetup((v) => !v)}
            className="w-full mt-3 py-3 bg-white text-gray-700 rounded-xl font-bold border border-gray-200 hover:bg-gray-50"
          >
            PIN이 없나요? PIN 설정하기
          </button>

          {showPinSetup && (
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="text-sm text-gray-600 font-body mb-3">
                계정 비밀번호로 본인 확인 후 부모 PIN을 설정할 수 있어요.
              </div>
              <div className="flex flex-col gap-2">
                <input
                  type="password"
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                  placeholder="계정 비밀번호"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 outline-none"
                />
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="새 부모 PIN (4~12자리)"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 outline-none"
                />
                <button
                  onClick={handleSetPin}
                  className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600"
                >
                  PIN 설정
                </button>
              </div>
            </div>
          )}

          {error && <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 font-body">{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50/50 p-6">
      <div className="flex items-center mb-8">
        <button onClick={() => navigate('/')} className="mr-4 p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800 flex-1 flex items-center gap-2">
          <span className="p-2 bg-blue-100 rounded-xl text-blue-600"><ShieldCheck size={20} /></span> 부모 리포트
        </h1>
        <button
          onClick={() => {
            clearParentToken();
            setParentTokenState(null);
          }}
          className="px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-600 font-bold hover:bg-gray-50 hover:shadow-md transition-shadow"
        >
          부모 모드 종료
        </button>
      </div>

      {loading && <div className="p-4 text-center text-gray-500">불러오는 중...</div>}
      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 font-body">{error}</div>}

      {/* Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600"><Settings size={16} /></span>
          <h2 className="text-lg font-bold text-gray-800">AI 영어 대화 설정</h2>
        </div>
        <div className="text-sm text-gray-500 font-body mb-3">{usageText}</div>
        {tokenText && <div className="text-sm text-gray-500 font-body mb-3">{tokenText}</div>}
        {costTodayText && <div className="text-sm text-gray-500 font-body mb-3">{costTodayText}</div>}
        <div className="flex flex-wrap gap-2">
          {LIMIT_OPTIONS.map((m) => (
            <button
              key={m}
              onClick={() => updateLimit(m)}
              className={`px-4 py-2 rounded-xl font-bold border ${settings?.dailyLimitMinutes === m
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
            >
              {m}분
            </button>
          ))}
        </div>
      </div>

      {/* AI cost */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="p-1.5 bg-emerald-100 rounded-lg text-emerald-600"><MessageCircle size={16} /></span>
          <h2 className="text-lg font-bold text-gray-800">AI 비용(월별)</h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
          <label className="text-sm font-bold text-gray-600">월 선택</label>
          <input
            type="month"
            value={costMonth}
            onChange={(e) => setCostMonth(e.target.value)}
            className="px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-400 outline-none"
            disabled={loading}
          />
          <button
            onClick={refreshAll}
            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold disabled:opacity-60"
            disabled={loading}
          >
            새로고침
          </button>
        </div>

        {monthCostText && <div className="text-sm text-gray-500 font-body mb-3">{monthCostText}</div>}
        {aiCost?.pricingConfigured === false && (
          <div className="text-sm text-gray-500 font-body">
            <code className="font-mono">AI_PRICING_JSON</code>을 <code className="font-mono">server/.env</code>에 설정하면 비용이 표시돼요.
          </div>
        )}

        {aiCost?.byModel?.length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {aiCost.byModel.slice(0, 8).map((r) => (
              <div key={`${r.provider}:${r.model}`} className="rounded-xl border border-gray-100 p-3">
                <div className="font-bold text-gray-800">{r.provider} · {r.model}</div>
                <div className="text-sm text-gray-600 font-body">
                  토큰: {Number(r.totalTokens || 0).toLocaleString()}
                  {typeof r.estimatedCostUsd === 'number' ? ` · $${r.estimatedCostUsd.toFixed(4)}` : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Parent PIN change */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="p-1.5 bg-amber-100 rounded-lg text-amber-600"><LockKeyhole size={16} /></span>
          <h2 className="text-lg font-bold text-gray-800">부모 PIN 변경</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            type="password"
            value={oldPin}
            onChange={(e) => setOldPin(e.target.value)}
            placeholder="기존 PIN"
            className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 outline-none"
          />
          <input
            type="password"
            value={changePinNew}
            onChange={(e) => setChangePinNew(e.target.value)}
            placeholder="새 PIN (4~12자리)"
            className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 outline-none"
          />
          <button
            onClick={changePin}
            className="py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600"
          >
            PIN 변경
          </button>
        </div>
      </div>

      {/* AI Summary */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-sky-100 rounded-lg text-sky-600"><BookOpenText size={16} /></span>
            <h2 className="text-lg font-bold text-gray-800">오늘 AI 대화 요약</h2>
          </div>
          <button
            onClick={generateSummary}
            className="px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200 text-gray-700 font-bold hover:bg-gray-50"
          >
            요약 만들기
          </button>
        </div>

        {summary ? (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="text-sm font-bold text-gray-700 mb-2">요약(한국어)</div>
              <div className="font-body text-gray-800 whitespace-pre-line">{summary.summary_kr}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="text-sm font-bold text-gray-700 mb-2">Summary (English)</div>
              <div className="font-body text-gray-800 whitespace-pre-line">{summary.summary_en}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="text-sm font-bold text-gray-700 mb-2">새 단어</div>
              <div className="space-y-2">
                {summary.newWords?.map((w, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-3 border border-gray-100">
                    <div className="font-bold text-gray-800">{w.word} <span className="font-body text-gray-500">- {w.meaning_kr}</span></div>
                    <div className="font-body text-gray-700">{w.example_en}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-400 font-body">아직 요약이 없어요. “요약 만들기”를 눌러보세요.</div>
        )}
      </div>

      {/* Quiz Overview */}
      {quizReport && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Activity size={20} /></div>
              <span className="text-gray-500 font-medium">정답률</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">{quizReport.overview.accuracy}%</div>
            <div className="text-sm text-gray-400 mt-1">총 {quizReport.overview.totalAttempts}문제</div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg text-green-600"><Award size={20} /></div>
              <span className="text-gray-500 font-medium">맞힌 문제</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">{quizReport.overview.correctCount}개</div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Clock size={20} /></div>
              <span className="text-gray-500 font-medium">추정 학습 시간</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">{quizReport.overview.learningTime}분</div>
          </div>
        </div>
      )}

      {/* AI Recent */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="p-1.5 bg-pink-100 rounded-lg text-pink-600"><MessageCircle size={16} /></span>
          <h2 className="text-lg font-bold text-gray-800">최근 AI 영어 대화</h2>
        </div>
        {aiReport?.recentMessages?.length ? (
          <div className="space-y-2">
            {aiReport.recentMessages.slice(-12).map((m, idx) => (
              <div key={idx} className={`p-3 rounded-xl ${m.role === 'assistant' ? 'bg-sky-50' : 'bg-pink-50'}`}>
                <div className="text-xs text-gray-400 mb-1">
                  {m.role === 'assistant' ? 'AI' : '아이'} · {m.difficulty || '-'} · {new Date(m.created_at).toLocaleString()}
                </div>
                <div className="font-body text-gray-800">{m.text}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-400 font-body">아직 대화 기록이 없어요.</div>
        )}
      </div>

      {/* Recent Quiz Activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="p-1.5 bg-purple-100 rounded-lg text-purple-600"><Activity size={16} /></span>
          <h2 className="text-lg font-bold text-gray-800">최근 학습 기록</h2>
        </div>
        <div className="space-y-3">
          {quizReport?.recentActivity?.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-10 rounded-full ${item.is_correct ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <div>
                  <div className="font-bold text-gray-700">Level {item.level} ({item.subject})</div>
                  <div className="text-xs text-gray-400">{new Date(item.timestamp).toLocaleString()}</div>
                </div>
              </div>
              <span className={`font-bold ${item.is_correct ? 'text-green-600' : 'text-red-500'}`}>
                {item.is_correct ? '정답' : '오답'}
              </span>
            </div>
          ))}
          {quizReport?.recentActivity?.length === 0 && (
            <div className="text-center text-gray-400 py-4">아직 학습 기록이 없어요.</div>
          )}
        </div>
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={() => {
            clearParentToken();
            clearAuth();
            navigate('/login');
          }}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
};

export default ParentDashboard;
