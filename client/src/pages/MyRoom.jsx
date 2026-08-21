import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Home, ShoppingBag, Save, Wallpaper, Shirt, Users, X, Coins, Gift, Sparkles } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { soundManager, SOUNDS } from '../utils/SoundManager';

const LAYOUT_KEY = 'myRoom_layout_v1';
const LOGIN_DAY_KEY = 'myRoom_lastLoginDay_v1';
const STARTER_GRANTED_KEY = 'myRoom_starterGranted_v1';

const CATEGORY_ORDER = ['furniture', 'decor', 'clothing', 'pet'];
const CATEGORY_LABEL = { furniture: '가구', decor: '데코', clothing: '의상', pet: '펫' };

const ITEM_REACTIONS = {
  pet_cat: '야옹~ 😺',
  pet_dog: '멍멍! 🐶',
  toy_robot: '삐빅삐빅 🤖',
  toy_car: '부릉부릉! 🚗',
  computer: '타닥타닥 💻',
  speaker: '🎵🎶',
  trophy: '최고야! 🏆',
  balloons: '두둥실~ 🎈',
};
const DEFAULT_REACTION = '✨';
const reactionFor = (itemId) => ITEM_REACTIONS[itemId] || DEFAULT_REACTION;

// Hairstyles extracted from the character art (see scripts run for this feature) --
// each hair PNG and each bald-base PNG share the same 1024x1024 framing as the
// original character images, so any hairstyle overlays correctly on any base.
const HAIRSTYLES = [
  { id: 'none', name: '민머리', icon: null },
  { id: 'hair_girl', name: '양갈래 머리', icon: '/assets/hair/hair_girl.png' },
  { id: 'hair_mom', name: '단발머리', icon: '/assets/hair/hair_mom.png' },
  { id: 'hair_dad', name: '짧은 머리', icon: '/assets/hair/hair_dad.png' },
];

// Bald version of each character to render under the chosen hairstyle.
// Boy/baby were already drawn bald, so they use their normal artwork as-is.
const BALD_BASE = {
  char_boy: '/assets/toca_boy_v3.png',
  char_girl: '/assets/hair/bald_girl.png',
  char_mom: '/assets/hair/bald_mom.png',
  char_dad: '/assets/hair/bald_dad.png',
  char_baby: '/assets/toca_baby_v1.png',
};

// Each character's own natural hairstyle, used as the default when picked.
const DEFAULT_HAIR = {
  char_boy: 'none',
  char_girl: 'hair_girl',
  char_mom: 'hair_mom',
  char_dad: 'hair_dad',
  char_baby: 'none',
};

// Free starter items (see STORE_CATALOG on the server) laid out as fractions
// of the room's width/height so a brand-new room isn't a blank floor.
const STARTER_LAYOUT = [
  { itemId: 'starter_rug', xf: 0.12, yf: 0.8 },
  { itemId: 'starter_shelf', xf: 0.74, yf: 0.46 },
  { itemId: 'starter_plant', xf: 0.06, yf: 0.48 },
  { itemId: 'starter_lamp', xf: 0.84, yf: 0.22 },
  { itemId: 'starter_chair', xf: 0.6, yf: 0.68 },
];

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
  const dragMovedRef = useRef(false);

  const [gold, setGold] = useState(0);
  const [catalog, setCatalog] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [placedItems, setPlacedItems] = useState([]);
  const [wallpaperId, setWallpaperId] = useState(null);
  const [avatarId, setAvatarId] = useState(null);
  const [avatarPos, setAvatarPos] = useState(null); // { x, y } in room coordinates, like placedItems
  const [hairId, setHairId] = useState(null);
  const [equippedIds, setEquippedIds] = useState([]);
  const [dragInventoryItemId, setDragInventoryItemId] = useState(null);
  const [draggingPlaced, setDraggingPlaced] = useState(null); // { id, offsetX, offsetY, startX, startY }
  const [showDailyBonus, setShowDailyBonus] = useState(false);
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showCloset, setShowCloset] = useState(false);
  const [trayCategory, setTrayCategory] = useState('furniture');
  const [itemReactions, setItemReactions] = useState({});
  const [avatarReaction, setAvatarReaction] = useState(null);
  const [error, setError] = useState('');

  const catalogById = useMemo(() => new Map(catalog.map((i) => [i.id, i])), [catalog]);
  const ownedSet = useMemo(() => new Set(inventory), [inventory]);

  const wallpaperItems = useMemo(
    () => catalog.filter((i) => i.type === 'wallpaper' && ownedSet.has(i.id)),
    [catalog, ownedSet]
  );

  const characterItems = useMemo(
    () => catalog.filter((i) => i.type === 'character' && ownedSet.has(i.id)),
    [catalog, ownedSet]
  );

  const closetItems = useMemo(
    () => catalog.filter((i) => i.type === 'clothing' && ownedSet.has(i.id)),
    [catalog, ownedSet]
  );

  const nonWallpaperInventory = useMemo(
    () => inventory.filter((id) => {
      const t = catalogById.get(id)?.type || '';
      return t !== 'wallpaper' && t !== 'character';
    }),
    [inventory, catalogById]
  );

  const trayCategories = useMemo(() => {
    const present = new Set(nonWallpaperInventory.map((id) => catalogById.get(id)?.type).filter(Boolean));
    return CATEGORY_ORDER.filter((c) => present.has(c));
  }, [nonWallpaperInventory, catalogById]);

  const trayItems = useMemo(
    () => nonWallpaperInventory.filter((id) => catalogById.get(id)?.type === trayCategory),
    [nonWallpaperInventory, catalogById, trayCategory]
  );

  const avatarItem = avatarId ? catalogById.get(avatarId) : null;

  const wallColor = useMemo(() => {
    const item = wallpaperId ? catalogById.get(wallpaperId) : null;
    if (item?.type === 'wallpaper' && item.color) return item.color;
    return '#FFF8E1';
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

  const persistLayout = (overrides = {}) => {
    const payload = {
      placedItems,
      wallpaperId,
      avatarId,
      avatarPos,
      hairId,
      equippedIds,
      ...overrides,
    };
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(payload));
  };

  useEffect(() => {
    const raw = localStorage.getItem(LAYOUT_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.placedItems)) setPlacedItems(parsed.placedItems);
        if (typeof parsed?.wallpaperId === 'string') setWallpaperId(parsed.wallpaperId);
        if (typeof parsed?.avatarId === 'string') setAvatarId(parsed.avatarId);
        if (parsed?.avatarPos && typeof parsed.avatarPos.x === 'number') setAvatarPos(parsed.avatarPos);
        if (typeof parsed?.hairId === 'string') setHairId(parsed.hairId);
        if (Array.isArray(parsed?.equippedIds)) setEquippedIds(parsed.equippedIds);
      } catch {
        // ignore
      }
    }

    const today = localDayString();
    const last = localStorage.getItem(LOGIN_DAY_KEY);
    if (last !== today) setShowDailyBonus(true);

    loadFromServer().catch((e) => setError(e?.message || 'Failed to load.'));
  }, []);

  // Grant the free starter set exactly once per browser (tracked by its own flag,
  // not "room is empty" -- a kid who clears their room shouldn't get it refilled,
  // and someone who already picked an avatar before this shipped should still get it).
  useEffect(() => {
    if (catalog.length === 0) return;
    if (localStorage.getItem(STARTER_GRANTED_KEY) === '1') return;
    const room = roomRef.current;
    if (!room) return;

    localStorage.setItem(STARTER_GRANTED_KEY, '1');
    const owned = STARTER_LAYOUT.filter((s) => ownedSet.has(s.itemId));
    if (owned.length === 0) return;

    const rect = room.getBoundingClientRect();
    const starterPlaced = owned.map((s) => ({
      id: `starter_${s.itemId}`,
      itemId: s.itemId,
      x: clamp(rect.width * s.xf, 0, rect.width - 60),
      y: clamp(rect.height * s.yf, 0, rect.height - 60),
    }));

    setPlacedItems((prev) => {
      const next = [...prev, ...starterPlaced];
      setTimeout(() => persistLayout({ placedItems: next }), 0);
      return next;
    });
  }, [catalog.length, ownedSet]);

  useEffect(() => {
    if (catalog.length === 0) return;
    setPlacedItems((prev) => prev.filter((p) => ownedSet.has(p.itemId) && catalogById.has(p.itemId)));
    setWallpaperId((prev) => (prev && ownedSet.has(prev) ? prev : null));
    setEquippedIds((prev) => prev.filter((id) => ownedSet.has(id)));
    setAvatarId((prev) => (prev && ownedSet.has(prev) ? prev : null));
  }, [catalog.length, ownedSet, catalogById]);

  // First-time (or lost) avatar selection: open the picker once characters are known.
  // Wait for the daily-bonus modal to close first -- both are full-screen overlays,
  // and showing both at once let the later one swallow clicks meant for the other.
  useEffect(() => {
    if (avatarId) return;
    if (characterItems.length === 0) return;
    if (showDailyBonus) return;
    setShowAvatarPicker(true);
  }, [avatarId, characterItems.length, showDailyBonus]);

  useEffect(() => {
    if (trayCategories.length > 0 && !trayCategories.includes(trayCategory)) {
      setTrayCategory(trayCategories[0]);
    }
  }, [trayCategories, trayCategory]);

  // Give the avatar a starting spot (center-bottom) the first time one is picked,
  // or for rooms saved before avatars were draggable.
  useEffect(() => {
    if (!avatarId || avatarPos) return;
    const room = roomRef.current;
    if (!room) return;
    const rect = room.getBoundingClientRect();
    setAvatarPos({ x: rect.width / 2 - 64, y: rect.height * 0.6 });
  }, [avatarId, avatarPos]);

  // Default to that character's own natural hairstyle until the kid picks a different one.
  useEffect(() => {
    if (!avatarId || hairId) return;
    setHairId(DEFAULT_HAIR[avatarId] || 'none');
  }, [avatarId, hairId]);

  useEffect(() => {
    if (!draggingPlaced) return;

    const handleMove = (e) => {
      const room = roomRef.current;
      if (!room) return;
      const rect = room.getBoundingClientRect();
      const x = clamp(e.clientX - rect.left - draggingPlaced.offsetX, 0, rect.width - 40);
      const y = clamp(e.clientY - rect.top - draggingPlaced.offsetY, 0, rect.height - 40);

      const dx = e.clientX - draggingPlaced.startX;
      const dy = e.clientY - draggingPlaced.startY;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) dragMovedRef.current = true;

      if (draggingPlaced.id === 'avatar') {
        setAvatarPos({ x, y });
      } else {
        setPlacedItems((prev) => prev.map((p) => (p.id === draggingPlaced.id ? { ...p, x, y } : p)));
      }
    };

    const handleUp = () => {
      if (!dragMovedRef.current) {
        if (draggingPlaced.id === 'avatar') triggerAvatarReaction();
        else triggerItemReaction(draggingPlaced.id);
      }
      setDraggingPlaced(null);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [draggingPlaced]);

  const saveLayout = () => {
    persistLayout();
  };

  const selectAvatar = (id) => {
    const newHairId = DEFAULT_HAIR[id] || 'none';
    setAvatarId(id);
    setHairId(newHairId);
    setShowAvatarPicker(false);
    persistLayout({ avatarId: id, hairId: newHairId });
  };

  const selectHair = (id) => {
    setHairId(id);
    persistLayout({ hairId: id });
  };

  const toggleEquipped = (itemId) => {
    setEquippedIds((prev) => {
      const next = prev.includes(itemId)
        ? prev.filter((x) => x !== itemId)
        : [...prev, itemId].slice(-2); // wear at most 2 at once
      return next;
    });
  };

  const triggerItemReaction = (placedId) => {
    const token = Date.now();
    setItemReactions((prev) => ({ ...prev, [placedId]: token }));
    soundManager.playSFX(SOUNDS.SFX_CLICK);
    setTimeout(() => {
      setItemReactions((prev) => {
        if (prev[placedId] !== token) return prev;
        const next = { ...prev };
        delete next[placedId];
        return next;
      });
    }, 1400);
  };

  const triggerAvatarReaction = () => {
    const token = Date.now();
    setAvatarReaction(token);
    soundManager.playSFX(SOUNDS.SFX_CLICK);
    setTimeout(() => setAvatarReaction((prev) => (prev === token ? null : prev)), 1200);
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
    if (item?.type === 'wallpaper' || item?.type === 'character') return;

    const rect = roomRef.current.getBoundingClientRect();
    const x = clamp(e.clientX - rect.left - 30, 0, rect.width - 60);
    const y = clamp(e.clientY - rect.top - 30, 0, rect.height - 60);
    setPlacedItems((prev) => [
      ...prev,
      { id: `${Date.now()}_${Math.random().toString(16).slice(2)}`, itemId, x, y },
    ]);
    setDragInventoryItemId(null);
    soundManager.playSFX(SOUNDS.SFX_CLICK);
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
          <button onClick={() => setShowCloset(true)} className="bg-white/20 p-2 rounded-full text-white hover:bg-white/30 transition-colors">
            <Shirt size={28} />
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
        onDrop={handleDropToRoom}
        onDragOver={(e) => e.preventDefault()}
      >
        {/* Wall */}
        <div className="absolute inset-x-0 top-0 transition-colors duration-300" style={{ height: '72%', backgroundColor: wallColor }}>
          {/* Window */}
          <div className="absolute top-6 right-8 w-28 h-20 rounded-2xl bg-gradient-to-b from-sky-200 to-sky-100 border-4 border-white/80 shadow-inner overflow-hidden pointer-events-none">
            <div className="absolute w-10 h-6 bg-white/90 rounded-full top-3 left-2 animate-float-cloud-slow" />
            <div className="absolute w-8 h-5 bg-white/80 rounded-full top-8 left-10 animate-float-cloud-fast" />
            <div className="absolute inset-y-0 left-1/2 w-[3px] bg-white/70" />
            <div className="absolute inset-x-0 top-1/2 h-[3px] bg-white/70" />
          </div>
          {/* Ambient sparkles */}
          <Sparkles className="absolute top-10 left-10 text-yellow-200/70 w-6 h-6 animate-float-cloud-slow pointer-events-none" />
          <Sparkles className="absolute top-24 left-1/3 text-white/60 w-5 h-5 animate-float-cloud-fast pointer-events-none" />
        </div>

        {/* Floor */}
        <div
          className="absolute inset-x-0 bottom-0"
          style={{
            height: '28%',
            backgroundColor: '#D8B98A',
            backgroundImage:
              'linear-gradient(180deg, rgba(255,255,255,0.15), rgba(0,0,0,0.08)), repeating-linear-gradient(90deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 2px, transparent 2px, transparent 56px)',
          }}
        />
        {/* Wall/floor seam shadow */}
        <div className="absolute inset-x-0" style={{ top: '72%', height: 10, background: 'linear-gradient(180deg, rgba(0,0,0,0.15), transparent)' }} />

        {/* Avatar (draggable, like placed items) */}
        {avatarItem && avatarPos && (
          <div className="absolute z-10 select-none" style={{ left: avatarPos.x, top: avatarPos.y }}>
            <div className="relative flex flex-col items-center">
              <div
                onPointerDown={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  dragMovedRef.current = false;
                  setDraggingPlaced({
                    id: 'avatar',
                    offsetX: e.clientX - rect.left,
                    offsetY: e.clientY - rect.top,
                    startX: e.clientX,
                    startY: e.clientY,
                  });
                }}
                className="animate-avatar-idle cursor-grab active:cursor-grabbing relative w-32 h-32 sm:w-40 sm:h-40"
                style={{ filter: 'drop-shadow(0 10px 8px rgba(0,0,0,0.25))' }}
              >
                <img
                  src={BALD_BASE[avatarId] || avatarItem.icon}
                  alt={avatarItem.name}
                  className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
                  draggable={false}
                />
                {hairId && hairId !== 'none' && (
                  <img
                    src={HAIRSTYLES.find((h) => h.id === hairId)?.icon}
                    alt=""
                    className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
                    draggable={false}
                  />
                )}
              </div>

              {equippedIds.length > 0 && (
                <div className="absolute -top-2 -right-2 flex flex-col gap-1">
                  {equippedIds.map((id) => {
                    const it = catalogById.get(id);
                    if (!it) return null;
                    return (
                      <div key={id} className="w-9 h-9 rounded-full bg-white shadow-md border-2 border-white flex items-center justify-center overflow-hidden">
                        {it.isImage ? (
                          <img src={it.icon} alt={it.name} className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-lg">{it.icon}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <AnimatePresence>
                {avatarReaction && (
                  <motion.div
                    initial={{ opacity: 0, y: 0, scale: 0.5 }}
                    animate={{ opacity: 1, y: -20, scale: 1 }}
                    exit={{ opacity: 0, y: -35 }}
                    className="absolute -top-8 text-3xl pointer-events-none select-none"
                  >
                    ✨😊✨
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={() => setShowAvatarPicker(true)}
                className="mt-2 bg-white/80 hover:bg-white text-orange-500 text-xs font-bold px-3 py-1 rounded-full shadow flex items-center gap-1"
              >
                <Users size={12} /> 바꾸기
              </button>
            </div>
          </div>
        )}

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
                dragMovedRef.current = false;
                setDraggingPlaced({
                  id: p.id,
                  offsetX: e.clientX - rect.left,
                  offsetY: e.clientY - rect.top,
                  startX: e.clientX,
                  startY: e.clientY,
                });
              }}
            >
              <div className="relative group cursor-grab active:cursor-grabbing">
                <div style={{ filter: 'drop-shadow(0 8px 6px rgba(0,0,0,0.25))' }}>
                  {item.isImage ? (
                    <img src={item.icon} alt={item.name} className="w-24 h-24 object-contain pointer-events-none mix-blend-multiply" />
                  ) : (
                    <span className="text-6xl pointer-events-none">{item.icon}</span>
                  )}
                </div>

                <AnimatePresence>
                  {itemReactions[p.id] && (
                    <motion.div
                      initial={{ opacity: 0, y: 0, scale: 0.6 }}
                      animate={{ opacity: 1, y: -16, scale: 1 }}
                      exit={{ opacity: 0, y: -28 }}
                      className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white shadow-md rounded-full px-3 py-1 text-sm font-bold text-gray-700 pointer-events-none"
                    >
                      {reactionFor(item.id)}
                    </motion.div>
                  )}
                </AnimatePresence>

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

      <div className="bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-20 flex flex-col">
        {trayCategories.length > 1 && (
          <div className="flex gap-2 px-4 pt-3">
            {trayCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setTrayCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${
                  trayCategory === cat ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-500 hover:bg-orange-50'
                }`}
              >
                {CATEGORY_LABEL[cat] || cat}
              </button>
            ))}
          </div>
        )}

        <div className="p-4 h-40 flex gap-4 items-center">
          <div className="flex-1 overflow-x-auto flex gap-4 h-full items-center pb-2">
            {trayItems.length === 0 && (
              <p className="text-gray-400 font-bold w-full text-center">상점에서 아이템을 사서 꾸며보자!</p>
            )}
            {trayItems.map((itemId) => {
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

      {showAvatarPicker && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border-4 border-pink-100 max-w-xl w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
                <Users size={24} className="text-pink-400" /> 내 캐릭터 고르기
              </h2>
              {avatarId && (
                <button onClick={() => setShowAvatarPicker(false)} className="bg-gray-100 hover:bg-gray-200 rounded-full p-2">
                  <X size={18} />
                </button>
              )}
            </div>

            {characterItems.length === 0 ? (
              <div className="text-gray-500 font-body">캐릭터를 불러오는 중...</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {characterItems.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => selectAvatar(c.id)}
                    className={`rounded-2xl border-2 p-3 flex flex-col items-center gap-2 hover:bg-pink-50 transition-colors ${avatarId === c.id ? 'border-pink-400 bg-pink-50' : 'border-gray-100'}`}
                  >
                    <img src={c.icon} alt={c.name} className="w-16 h-16 object-contain" />
                    <div className="font-bold text-gray-800 text-sm">{c.name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showCloset && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border-4 border-orange-100 max-w-xl w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
                <Shirt size={24} className="text-orange-400" /> 꾸미기
              </h2>
              <button onClick={() => setShowCloset(false)} className="bg-gray-100 hover:bg-gray-200 rounded-full p-2">
                <X size={18} />
              </button>
            </div>

            <p className="text-sm font-extrabold text-gray-700 mb-2">머리스타일</p>
            <div className="grid grid-cols-4 gap-3 mb-5">
              {HAIRSTYLES.map((h) => {
                const isSelected = hairId === h.id;
                return (
                  <button
                    key={h.id}
                    onClick={() => selectHair(h.id)}
                    className={`rounded-2xl border-2 p-2 flex flex-col items-center gap-1 hover:bg-orange-50 transition-colors ${isSelected ? 'border-orange-400 bg-orange-50' : 'border-gray-100'}`}
                  >
                    {h.icon ? (
                      <img src={h.icon} alt={h.name} className="w-12 h-12 object-contain" />
                    ) : (
                      <span className="text-3xl">🙂</span>
                    )}
                    <div className="font-bold text-gray-800 text-[10px] text-center">{h.name}</div>
                  </button>
                );
              })}
            </div>

            <p className="text-sm font-extrabold text-gray-700 mb-2">오늘의 아이템</p>
            {closetItems.length === 0 ? (
              <div className="text-gray-500 font-body">
                아직 의상이 없어요. 상점에서 구매해보세요.
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-400 font-body mb-3">최대 2개까지 오늘의 아이템으로 꾸밀 수 있어요.</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {closetItems.map((c) => {
                    const isEquipped = equippedIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggleEquipped(c.id)}
                        className={`rounded-2xl border-2 p-3 flex flex-col items-center gap-2 hover:bg-orange-50 transition-colors relative ${isEquipped ? 'border-orange-400 bg-orange-50' : 'border-gray-100'}`}
                      >
                        {isEquipped && (
                          <div className="absolute top-1 right-1 bg-orange-400 text-white rounded-full p-0.5">
                            <Sparkles size={10} />
                          </div>
                        )}
                        {c.isImage ? (
                          <img src={c.icon} alt={c.name} className="w-12 h-12 object-contain" />
                        ) : (
                          <span className="text-3xl">{c.icon}</span>
                        )}
                        <div className="font-bold text-gray-800 text-xs text-center">{c.name}</div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRoom;
