import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Coins, Check, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiFetch } from '../utils/api';
import { CloudIcon } from '../components/Assets';

const MotionDiv = motion.div;

const Store = () => {
  const navigate = useNavigate();
  const [gold, setGold] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [buyingItemId, setBuyingItemId] = useState(null);

  const ownedSet = useMemo(() => new Set(inventory), [inventory]);

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

      <div className="max-w-4xl mx-auto p-8">
        {loading && <div className="text-center text-gray-500 font-body animate-pulse">Loading...</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 font-body mb-4">{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {items.map((item) => {
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
