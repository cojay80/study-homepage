import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, KeyRound, Sparkles, Shield } from 'lucide-react';
import { setAuth } from '../utils/api';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [parentPin, setParentPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = async () => {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return res;
  };

  const register = async () => {
    const res = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, parent_pin: parentPin || undefined }),
    });
    return res;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const u = username.trim();
    const p = password;
    if (!u || !p) {
      setError('이름(아이디)과 비밀번호를 입력해 주세요.');
      return;
    }

    setLoading(true);
    try {
      let res = await login();
      if (res.status === 401) {
        const reg = await register();
        if (!reg.ok && reg.status !== 400) {
          const body = await reg.json().catch(() => ({}));
          throw new Error(body.error || '회원가입에 실패했어요.');
        }
        res = await login();
      }

      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || '로그인에 실패했어요.');

      if (!body.token || !body.user) throw new Error('서버 응답이 올바르지 않아요.');

      setAuth({ token: body.token, user: body.user });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err?.message || '문제가 생겼어요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pink-50 flex items-center justify-center font-title p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl border-4 border-pink-200 w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-pink-100 p-4 rounded-full">
            <User size={48} className="text-pink-500" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-pink-600 mb-2">공부 나라 입장! 👑</h1>
        <p className="text-gray-500 mb-8">이름(아이디)과 비밀번호를 입력해 주세요.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400" size={22} />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="이름(아이디)"
              className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-pink-100 text-lg focus:border-pink-400 outline-none"
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div className="relative">
            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400" size={22} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-pink-100 text-lg focus:border-pink-400 outline-none"
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <div className="relative">
            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" size={22} />
            <input
              type="password"
              value={parentPin}
              onChange={(e) => setParentPin(e.target.value)}
              placeholder="부모 PIN (선택)"
              className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-blue-100 text-lg focus:border-blue-400 outline-none"
              autoComplete="off"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="bg-pink-500 text-white py-4 rounded-xl font-bold text-xl hover:bg-pink-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            disabled={loading}
          >
            <Sparkles size={24} />
            {loading ? '들어가는 중...' : '입장하기'}
          </button>
        </form>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 font-body">
            {error}
          </div>
        )}

        <div className="mt-6 text-xs text-gray-400 font-body">
          처음 로그인하면 자동으로 계정이 만들어져요.
        </div>
      </div>
    </div>
  );
};

export default Login;

