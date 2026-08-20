const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const STORE_CATALOG = [
  // Characters
  { id: 'char_boy', name: '남자아이', type: 'character', price: 0, icon: '/assets/toca_boy_v3.png', isImage: true },
  { id: 'char_girl', name: '여자아이', type: 'character', price: 0, icon: '/assets/toca_girl_v3.png', isImage: true },
  { id: 'char_mom', name: '엄마', type: 'character', price: 0, icon: '/assets/toca_mom_v1.png', isImage: true },
  { id: 'char_dad', name: '아빠', type: 'character', price: 0, icon: '/assets/toca_dad_v1.png', isImage: true },
  { id: 'char_baby', name: '아기', type: 'character', price: 500, icon: '/assets/toca_baby_v1.png', isImage: true },

  // Wallpapers (include a free default)
  { id: 'wall_default', name: '기본 벽지', type: 'wallpaper', price: 0, icon: '🧱', color: '#FFF8E1' },
  { id: 'wall_pink', name: '핑크 벽지', type: 'wallpaper', price: 300, icon: '🩷', color: '#FCE4EC' },
  { id: 'wall_blue', name: '하늘 벽지', type: 'wallpaper', price: 300, icon: '🩵', color: '#E3F2FD' },
  { id: 'wall_green', name: '숲 벽지', type: 'wallpaper', price: 300, icon: '💚', color: '#E8F5E9' },
  { id: 'wall_star', name: '별밤 벽지', type: 'wallpaper', price: 500, icon: '🌌', color: '#311B92' },
  { id: 'wall_wood', name: '나무 벽지', type: 'wallpaper', price: 400, icon: '🪵', color: '#D7CCC8' },
  { id: 'wall_sunset', name: '노을 벽지', type: 'wallpaper', price: 600, icon: '🌅', color: '#FFE0B2' },

  // Furniture
  { id: 'bed_pink', name: '공주 침대', type: 'furniture', price: 500, icon: '🛏️' },
  { id: 'bed_bunk', name: '2층 침대', type: 'furniture', price: 800, icon: '🛌' },
  { id: 'desk_wood', name: '나무 책상', type: 'furniture', price: 300, icon: '🪵' },
  { id: 'desk_white', name: '화이트 책상', type: 'furniture', price: 350, icon: '⬜' },
  { id: 'chair_wood', name: '나무 의자', type: 'furniture', price: 150, icon: '🪑' },
  { id: 'chair_gaming', name: '게임 의자', type: 'furniture', price: 400, icon: '🎮' },
  { id: 'sofa_red', name: '빨간 소파', type: 'furniture', price: 600, icon: '🛋️' },
  { id: 'shelf_books', name: '책장', type: 'furniture', price: 400, icon: '📚' },
  { id: 'wardrobe', name: '옷장', type: 'furniture', price: 500, icon: '🗄️' },
  { id: 'table_round', name: '원형 테이블', type: 'furniture', price: 350, icon: '⭕' },
  { id: 'mirror', name: '거울', type: 'furniture', price: 250, icon: '🪞' },

  // Decor
  { id: 'rug_bear', name: '곰돌이 러그', type: 'decor', price: 200, icon: '🧸' },
  { id: 'rug_rainbow', name: '무지개 러그', type: 'decor', price: 250, icon: '🌈' },
  { id: 'lamp_floor', name: '스탠드 조명', type: 'decor', price: 150, icon: '💡' },
  { id: 'plant_pot', name: '화분', type: 'decor', price: 100, icon: '🪴' },
  { id: 'plant_big', name: '큰 화분', type: 'decor', price: 200, icon: '🌿' },
  { id: 'clock_wall', name: '벽시계', type: 'decor', price: 120, icon: '🕒' },
  { id: 'picture_frame', name: '액자', type: 'decor', price: 120, icon: '🖼️' },
  { id: 'toy_robot', name: '로봇 장난감', type: 'decor', price: 150, icon: '🤖' },
  { id: 'toy_car', name: '자동차 장난감', type: 'decor', price: 120, icon: '🚗' },
  { id: 'computer', name: '컴퓨터', type: 'decor', price: 800, icon: '💻' },
  { id: 'speaker', name: '스피커', type: 'decor', price: 220, icon: '🔊' },
  { id: 'trophy', name: '트로피', type: 'decor', price: 700, icon: '🏆' },
  { id: 'balloons', name: '풍선', type: 'decor', price: 180, icon: '🎈' },

  // Clothing
  { id: 'hat_cap', name: '캡모자', type: 'clothing', price: 150, icon: '/assets/toca_hat_cap.png', isImage: true },
  { id: 'hat_crown', name: '왕관', type: 'clothing', price: 500, icon: '👑' },
  { id: 'glasses_sun', name: '선글라스', type: 'clothing', price: 200, icon: '🕶️' },
  { id: 'shirt_t', name: '티셔츠', type: 'clothing', price: 200, icon: '👕' },
  { id: 'dress_blue', name: '파란 드레스', type: 'clothing', price: 300, icon: '/assets/toca_dress_blue.png', isImage: true },
  { id: 'shoes_sneakers', name: '운동화', type: 'clothing', price: 150, icon: '👟' },
  { id: 'bag_school', name: '책가방', type: 'clothing', price: 250, icon: '🎒' },
  { id: 'ribbon_red', name: '빨간 리본', type: 'clothing', price: 150, icon: '🎀' },

  // Pets
  { id: 'pet_cat', name: '고양이', type: 'pet', price: 600, icon: '🐱' },
  { id: 'pet_dog', name: '강아지', type: 'pet', price: 600, icon: '🐶' },
];

const CATALOG_BY_ID = new Map(STORE_CATALOG.map((i) => [i.id, i]));

function ensureDefaultInventory(userId, cb) {
  const defaults = STORE_CATALOG.filter((i) => i.price === 0).map((i) => i.id);
  if (defaults.length === 0) return cb(null);

  db.serialize(() => {
    for (const itemId of defaults) {
      db.run(
        'INSERT OR IGNORE INTO user_inventory (user_id, item_id, quantity) VALUES (?, ?, 1)',
        [userId, itemId]
      );
    }
    cb(null);
  });
}

function getMePayload(userId, cb) {
  db.get('SELECT gold FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) return cb(err);
    if (!user) return cb(Object.assign(new Error('User not found.'), { status: 404 }));

    db.all(
      'SELECT item_id as itemId, quantity FROM user_inventory WHERE user_id = ? ORDER BY acquired_at ASC',
      [userId],
      (err2, rows) => {
        if (err2) return cb(err2);
        cb(null, { gold: Number(user.gold || 0), inventory: rows || [] });
      }
    );
  });
}

router.get('/items', requireAuth, (req, res) => {
  res.json({ items: STORE_CATALOG });
});

router.get('/me', requireAuth, (req, res) => {
  const userId = Number(req.auth.sub);

  ensureDefaultInventory(userId, (err) => {
    if (err) return res.status(500).json({ error: 'Failed to load inventory.' });
    getMePayload(userId, (err2, payload) => {
      if (err2?.status) return res.status(err2.status).json({ error: err2.message });
      if (err2) return res.status(500).json({ error: 'Failed to load user data.' });
      res.json(payload);
    });
  });
});

router.post('/buy', requireAuth, (req, res) => {
  const userId = Number(req.auth.sub);
  const itemId = String(req.body?.itemId || '').trim();

  const item = CATALOG_BY_ID.get(itemId);
  if (!item) return res.status(400).json({ error: 'Unknown itemId.' });
  if (item.price < 0) return res.status(400).json({ error: 'Invalid item.' });

  db.serialize(() => {
    db.run('BEGIN IMMEDIATE TRANSACTION');

    db.get('SELECT gold FROM users WHERE id = ?', [userId], (err, user) => {
      if (err || !user) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: 'Failed to load user.' });
      }

      const gold = Number(user.gold || 0);
      if (gold < item.price) {
        db.run('ROLLBACK');
        return res.status(400).json({ error: 'Not enough gold.' });
      }

      db.get(
        'SELECT quantity FROM user_inventory WHERE user_id = ? AND item_id = ?',
        [userId, itemId],
        (err2, ownedRow) => {
          if (err2) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Failed to check inventory.' });
          }

          if (ownedRow) {
            db.run('ROLLBACK');
            return res.status(400).json({ error: 'Already owned.' });
          }

          db.run('UPDATE users SET gold = gold - ? WHERE id = ?', [item.price, userId], (err3) => {
            if (err3) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Failed to update gold.' });
            }

            db.run(
              'INSERT INTO user_inventory (user_id, item_id, quantity) VALUES (?, ?, 1)',
              [userId, itemId],
              (err4) => {
                if (err4) {
                  db.run('ROLLBACK');
                  return res.status(500).json({ error: 'Failed to save item.' });
                }

                db.run('COMMIT', (err5) => {
                  if (err5) return res.status(500).json({ error: 'Failed to finalize purchase.' });
                  getMePayload(userId, (err6, payload) => {
                    if (err6) return res.status(500).json({ error: 'Purchase complete, but failed to load data.' });
                    res.json({ ...payload, purchased: { itemId } });
                  });
                });
              }
            );
          });
        }
      );
    });
  });
});

module.exports = router;

