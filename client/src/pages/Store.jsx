import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Coins, Check, Sparkles, Search, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiFetch } from '../utils/api';
import { CloudIcon } from '../components/Assets';

const MotionDiv = motion.div;

// The catalog is several hundred items, so the grid is filtered down by
// category/search rather than dumped out all at once.
const CATEGORIES = [
  { id: 'all', name: '전체', icon: '🛍️' },
  { id: 'character', name: '캐릭터', icon: '🧒' },
  { id: 'furniture', name: '가구', icon: '🪑' },
  { id: 'decor', name: '데코', icon: '🖼️' },
  { id: 'clothing', name: '의상', icon: '👗' },
  { id: 'pet', name: '펫', icon: '🐶' },
  { id: 'wallpaper', name: '벽지', icon: '🧱' },
];

const Store = () => {
  const navigate = useNavigate();
  const [gold, setGold] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [buyingItemId, setBuyingItemId] = useState(null);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [hideOwned, setHideOwned] = useState(false);

  const ownedSet = useMemo(() => new Set(inventory), [inventory]);

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (category !== 'all' && item.type !== category) return false;
      if (hideOwned && ownedSet.has(item.id)) return false;
      if (q && !String(item.name || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, category, search, hideOwned, ownedSet]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setError('');
      setLoading(true);
      try {
        const [itemsRes, meRes] = await Promise.all([
          apiFetch('/api/v1/store/items'),
          apiFetch('/api/v1/store/me'),
        ]);

        const itemsBody = await itemsRes.json().catch(() => ({}));
        if (!itemsRes.ok) throw new Error(itemsBody.error || 'Failed to load store items.');

        const meBody = await meRes.json().catch(() => ({}));
        if (!meRes.ok) throw new Error(meBody.error || 'Failed to load your data.');

        if (!mounted) return;
        setItems(Array.isArray(itemsBody.items) ? itemsBody.items : []);
        setGold(Number(meBody.gold || 0));
        setInventory(Array.isArray(meBody.inventory) ? meBody.inventory.map((x) => x.itemId) : []);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || 'Something went wrong.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  const buyItem = async (item) => {
    if (ownedSet.has(item.id)) return;
    setError('');
    setBuyingItemId(item.id);
    try {
      const res = await apiFetch('/api/v1/store/buy', {
        method: 'POST',
        json: { itemId: item.id },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Purchase failed.');

      setGold(Number(body.gold || 0));
      setInventory(Array.isArray(body.inventory) ? body.inventory.map((x) => x.itemId) : []);
    } catch (e) {
      setError(e?.message || 'Purchase failed.');
    } finally {
      setBuyingItemId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFE0B2] to-[#FFF3E0] font-title relative overflow-hidden">
      {/* Ambient decoration */}
      <CloudIcon className="absolute top-6 left-8 w-24 h-16 text-white/60 animate-float-cloud-slow pointer-events-none" />
      <CloudIcon className="absolute top-20 right-12 w-16 h-11 text-white/50 animate-float-cloud-fast pointer-events-none" />
      <Sparkles className="absolute top-32 left-1/4 text-white/60 w-6 h-6 animate-float-cloud-slow pointer-events-none" />
      <div className="bg-[#FF9800] p-4 shadow-lg sticky top-0 z-20 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="bg-white/20 p-2 rounded-full text-white hover:bg-white/30 transition-colors">
          <ArrowLeft size={32} />
        </button>
        <h1 className="text-3xl font-extrabold text-white drop-shadow-md flex items-center gap-2">
          <ShoppingBag size={32} className="animate-bounce" /> 상점
        </h1>
        <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
          <Coins size={24} className="text-yellow-300" />
          <span className="text-white font-bold text-xl">{gold.toLocaleString()}</span>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex justify-center gap-3 px-4 pt-6 overflow-x-auto">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`px-5 py-2.5 rounded-full font-bold shadow-md transition-all transform hover:scale-105 whitespace-nowrap
              ${category === cat.id
                ? 'bg-[#FF6F00] text-white ring-4 ring-orange-200'
                : 'bg-white text-orange-600 hover:bg-orange-50'}`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Search + owned filter */}
      <div className="max-w-4xl mx-auto px-8 pt-5 flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-300" size={20} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름으로 찾기..."
            className="w-full pl-12 pr-10 py-3 rounded-2xl border-4 border-white shadow-md font-body text-gray-700 outline-none focus:border-orange-200"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          )}
        </div>
        <button
          onClick={() => setHideOwned((v) => !v)}
          className={`px-5 py-3 rounded-2xl font-bold shadow-md whitespace-nowrap transition-colors
            ${hideOwned ? 'bg-[#FF6F00] text-white' : 'bg-white text-orange-600 hover:bg-orange-50'}`}
        >
          {hideOwned ? '✓ 안 가진 것만' : '안 가진 것만'}
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-8 pt-5">
        {loading && <div className="text-center text-gray-500 font-body animate-pulse">Loading...</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 font-body mb-4">{error}</div>}

        {!loading && (
          <div className="text-center text-orange-700/70 font-body mb-5">
            {visibleItems.length}개의 아이템
          </div>
        )}

        {!loading && visibleItems.length === 0 && (
          <div className="text-center text-gray-500 font-body py-10">
            찾는 아이템이 없어요. 다른 이름으로 찾아볼까요?
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {visibleItems.map((item) => {
            const isOwned = ownedSet.has(item.id);
            const isBuying = buyingItemId === item.id;
            return (
              <MotionDiv
                key={item.id}
                whileHover={{ scale: 1.05 }}
                className={`bg-white rounded-3xl p-6 shadow-xl border-4 ${isOwned ? 'border-gray-200 opacity-80' : 'border-orange-200'} flex flex-col items-center gap-4 relative overflow-hidden`}
              >
                <div className="text-6xl mb-2">
                  {item.isImage ? <img src={item.icon} alt={item.name} className="w-20 h-20 object-contain" /> : item.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 text-center">{item.name}</h3>

                {isOwned ? (
                  <div className="bg-green-100 text-green-600 px-4 py-2 rounded-full font-bold flex items-center gap-2">
                    <Check size={20} /> 보유중
                  </div>
                ) : (
                  <button
                    onClick={() => buyItem(item)}
                    disabled={isBuying || loading}
                    className="bg-orange-400 hover:bg-orange-500 text-white px-6 py-2 rounded-full font-bold shadow-md transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Coins size={18} className="text-yellow-200" />
                    {isBuying ? '...' : item.price}
                  </button>
                )}

                <div className="absolute top-4 right-4 bg-gray-100 px-2 py-1 rounded text-xs text-gray-500 font-bold">
                  {item.type}
                </div>
              </MotionDiv>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Store;
