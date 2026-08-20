import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, ShoppingBag, Save, Wallpaper, X, Coins, Gift } from 'lucide-react';
import { apiFetch } from '../utils/api';

const LAYOUT_KEY = 'myRoom_layout_v1';
const LOGIN_DAY_KEY = 'myRoom_lastLoginDay_v1';

function localDayString(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

const MyRoom = () => {
  const navigate = useNavigate();
  const roomRef = useRef(null);

  const [gold, setGold] = useState(0);
  const [catalog, setCatalog] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [placedItems, setPlacedItems] = useState([]);
  const [wallpaperId, setWallpaperId] = useState(null);
  const [dragInventoryItemId, setDragInventoryItemId] = useState(null);
  const [draggingPlaced, setDraggingPlaced] = useState(null); // { id, offsetX, offsetY }
  const [showDailyBonus, setShowDailyBonus] = useState(false);
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);
  const [error, setError] = useState('');

  const catalogById = useMemo(() => new Map(catalog.map((i) => [i.id, i])), [catalog]);
  const ownedSet = useMemo(() => new Set(inventory), [inventory]);

  const wallpaperItems = useMemo(
    () => catalog.filter((i) => i.type === 'wallpaper' && ownedSet.has(i.id)),
    [catalog, ownedSet]
  );

  const nonWallpaperInventory = useMemo(
    () => inventory.filter((id) => (catalogById.get(id)?.type || '') !== 'wallpaper'),
    [inventory, catalogById]
  );

  const roomStyle = useMemo(() => {
    const item = wallpaperId ? catalogById.get(wallpaperId) : null;
    if (item?.type === 'wallpaper' && item.color) return { backgroundColor: item.color };
    return { backgroundColor: '#FFF8E1' };
  }, [wallpaperId, catalogById]);

  const loadFromServer = async () => {
    const [itemsRes, meRes] = await Promise.all([
      apiFetch('/api/v1/store/items'),
      apiFetch('/api/v1/store/me'),
    ]);
    const itemsBody = await itemsRes.json().catch(() => ({}));
    const meBody = await meRes.json().catch(() => ({}));
    if (!itemsRes.ok) throw new Error(itemsBody.error || 'Failed to load items.');
    if (!meRes.ok) throw new Error(meBody.error || 'Failed to load your data.');

    setCatalog(Array.isArray(itemsBody.items) ? itemsBody.items : []);
    setGold(Number(meBody.gold || 0));
    setInventory(Array.isArray(meBody.inventory) ? meBody.inventory.map((x) => x.itemId) : []);
  };

  useEffect(() => {
    const raw = localStorage.getItem(LAYOUT_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.placedItems)) setPlacedItems(parsed.placedItems);
        if (typeof parsed?.wallpaperId === 'string') setWallpaperId(parsed.wallpaperId);
      } catch {
        // ignore
      }
    }

    const today = localDayString();
    const last = localStorage.getItem(LOGIN_DAY_KEY);
    if (last !== today) setShowDailyBonus(true);

    loadFromServer().catch((e) => setError(e?.message || 'Failed to load.'));
  }, []);

  useEffect(() => {
    if (catalog.length === 0) return;
    setPlacedItems((prev) => prev.filter((p) => ownedSet.has(p.itemId) && catalogById.has(p.itemId)));
    setWallpaperId((prev) => (prev && ownedSet.has(prev) ? prev : null));
  }, [catalog.length, ownedSet, catalogById]);

  useEffect(() => {
    if (!draggingPlaced) return;

    const handleMove = (e) => {
      const room = roomRef.current;
      if (!room) return;
      const rect = room.getBoundingClientRect();
      const x = clamp(e.clientX - rect.left - draggingPlaced.offsetX, 0, rect.width - 40);
      const y = clamp(e.clientY - rect.top - draggingPlaced.offsetY, 0, rect.height - 40);
      setPlacedItems((prev) => prev.map((p) => (p.id === draggingPlaced.id ? { ...p, x, y } : p)));
    };

    const handleUp = () => setDraggingPlaced(null);

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [draggingPlaced]);

  const saveLayout = () => {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify({ placedItems, wallpaperId }));
  };

  const claimDailyBonus = async () => {
    try {
      const res = await apiFetch('/api/v1/rewards/daily-bonus', { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Failed to claim.');
      setGold(Number(body.gold || 0));
      localStorage.setItem(LOGIN_DAY_KEY, body.day || localDayString());
      setShowDailyBonus(false);
    } catch (e) {
      setError(e?.message || 'Failed to claim.');
    }
  };

  const handleDropToRoom = (e) => {
    e.preventDefault();
    const itemId = dragInventoryItemId;
    if (!itemId || !roomRef.current) return;
    if (!ownedSet.has(itemId)) return;
    const item = catalogById.get(itemId);
    if (item?.type === 'wallpaper') return;

    const rect = roomRef.current.getBoundingClientRect();
    const x = clamp(e.clientX - rect.left - 30, 0, rect.width - 60);
    const y = clamp(e.clientY - rect.top - 30, 0, rect.height - 60);
    setPlacedItems((prev) => [
      ...prev,
      { id: `${Date.now()}_${Math.random().toString(16).slice(2)}`, itemId, x, y },
    ]);
    setDragInventoryItemId(null);
  };

  return (
    <div className="min-h-screen bg-[#FFF3E0] font-title relative overflow-hidden flex flex-col">
      <div className="bg-[#FF9800] p-4 shadow-lg z-20 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="bg-white/20 p-2 rounded-full text-white hover:bg-white/30 transition-colors">
          <ArrowLeft size={32} />
        </button>
        <h1 className="text-3xl font-extrabold text-white drop-shadow-md flex items-center gap-2">
          <Home size={32} className="animate-bounce" /> 내 방
        </h1>
        <div className="flex items-center gap-3">
          <div className="bg-white/20 px-4 py-2 rounded-full text-white font-bold flex items-center gap-2">
            <Coins size={18} /> {gold.toLocaleString()}
          </div>
          <button onClick={() => navigate('/store')} className="bg-white/20 p-2 rounded-full text-white hover:bg-white/30 transition-colors">
            <ShoppingBag size={28} />
          </button>
          <button onClick={saveLayout} className="bg-white/20 p-2 rounded-full text-white hover:bg-white/30 transition-colors">
            <Save size={28} />
          </button>
          <button onClick={() => setShowWallpaperPicker(true)} className="bg-white/20 p-2 rounded-full text-white hover:bg-white/30 transition-colors">
            <Wallpaper size={28} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-auto max-w-3xl w-full px-4 pt-3">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 font-body">{error}</div>
        </div>
      )}

      <div
        ref={roomRef}
        className="flex-1 relative overflow-hidden"
        style={roomStyle}
        onDrop={handleDropToRoom}
        onDragOver={(e) => e.preventDefault()}
      >
        {placedItems.map((p) => {
          const item = catalogById.get(p.itemId);
          if (!item) return null;
          return (
            <div
              key={p.id}
              className="absolute select-none"
              style={{ left: p.x, top: p.y }}
              onPointerDown={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setDraggingPlaced({ id: p.id, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top });
              }}
            >
              <div className="relative group cursor-grab active:cursor-grabbing">
                {item.isImage ? (
                  <img src={item.icon} alt={item.name} className="w-24 h-24 object-contain pointer-events-none mix-blend-multiply" />
                ) : (
                  <span className="text-6xl pointer-events-none">{item.icon}</span>
                )}
                {/* Delete Button (Visible on Hover/Click) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPlacedItems((prev) => prev.filter((x) => x.id !== p.id));
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-20 h-40 flex gap-4 items-center justify-between">
        <div className="flex-1 overflow-x-auto flex gap-4 h-full items-center pb-2">
          {nonWallpaperInventory.length === 0 && (
            <p className="text-gray-400 font-bold w-full text-center">상점에서 아이템을 사서 꾸며보자!</p>
          )}
          {nonWallpaperInventory.map((itemId) => {
            const item = catalogById.get(itemId);
            if (!item) return null;
            return (
              <div
                key={itemId}
                draggable
                onDragStart={() => setDragInventoryItemId(itemId)}
                onDragEnd={() => setDragInventoryItemId(null)}
                className="min-w-[90px] h-[90px] bg-gray-50 rounded-2xl flex flex-col items-center justify-center cursor-grab hover:bg-orange-50 transition-colors border-2 border-gray-100 hover:border-orange-300 overflow-hidden p-2 relative group flex-shrink-0"
              >
                {item.isImage ? (
                  <img src={item.icon} alt={item.name} className="w-full h-full object-contain pointer-events-none" />
                ) : (
                  <span className="text-4xl pointer-events-none">{item.icon}</span>
                )}
                <span className="text-[10px] text-gray-500 font-bold mt-1 truncate w-full text-center">{item.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {showDailyBonus && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 flex flex-col items-center gap-6 shadow-2xl border-4 border-yellow-400 max-w-sm w-full">
            <h2 className="text-3xl font-extrabold text-orange-500 flex items-center gap-2">
              <Gift size={32} /> 출석 보너스
            </h2>
            <div className="text-6xl">🎁</div>
            <p className="text-lg font-bold text-gray-700 text-center">
              오늘의 보너스 100골드!
            </p>
            <button
              onClick={claimDailyBonus}
              className="bg-yellow-400 hover:bg-yellow-500 text-white text-xl font-bold py-3 px-8 rounded-full shadow-lg transition-transform active:scale-95"
            >
              받기
            </button>
            <button
              onClick={() => setShowDailyBonus(false)}
              className="text-gray-500 font-bold underline"
            >
              나중에
            </button>
          </div>
        </div>
      )}

      {showWallpaperPicker && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border-4 border-orange-100 max-w-xl w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-extrabold text-gray-800">벽지</h2>
              <button onClick={() => setShowWallpaperPicker(false)} className="bg-gray-100 hover:bg-gray-200 rounded-full p-2">
                <X size={18} />
              </button>
            </div>

            {wallpaperItems.length === 0 ? (
              <div className="text-gray-500 font-body">
                아직 벽지가 없어요. 상점에서 구매해보세요.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {wallpaperItems.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => {
                      setWallpaperId(w.id);
                      setShowWallpaperPicker(false);
                    }}
                    className={`rounded-2xl border-2 p-3 text-left hover:bg-orange-50 ${wallpaperId === w.id ? 'border-orange-400' : 'border-gray-100'}`}
                  >
                    <div className="w-full h-12 rounded-xl mb-2" style={{ backgroundColor: w.color || '#FFF8E1' }} />
                    <div className="font-bold text-gray-800 text-sm">{w.name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRoom;
