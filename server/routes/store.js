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

  // Starter set (free -- everyone owns these automatically so a brand-new room
  // already looks lived-in instead of a blank floor; see MyRoom.jsx STARTER_LAYOUT)
  { id: 'starter_rug', name: '포근한 러그', type: 'decor', price: 0, icon: '🟧' },
  { id: 'starter_shelf', name: '작은 선반', type: 'furniture', price: 0, icon: '🗄️' },
  { id: 'starter_plant', name: '작은 화분', type: 'decor', price: 0, icon: '🌱' },
  { id: 'starter_lamp', name: '동그란 조명', type: 'decor', price: 0, icon: '🔆' },
  { id: 'starter_chair', name: '아늑한 의자', type: 'furniture', price: 0, icon: '🪑' },

  // Wallpapers (include a free default)
  { id: 'wall_default', name: '기본 벽지', type: 'wallpaper', price: 0, icon: '🧱', color: '#FFF8E1' },
  { id: 'wall_pink', name: '핑크 벽지', type: 'wallpaper', price: 300, icon: '🩷', color: '#FCE4EC' },
  { id: 'wall_blue', name: '하늘 벽지', type: 'wallpaper', price: 300, icon: '🩵', color: '#E3F2FD' },
  { id: 'wall_green', name: '숲 벽지', type: 'wallpaper', price: 300, icon: '💚', color: '#E8F5E9' },
  { id: 'wall_star', name: '별밤 벽지', type: 'wallpaper', price: 500, icon: '🌌', color: '#311B92' },
  { id: 'wall_wood', name: '나무 벽지', type: 'wallpaper', price: 400, icon: '🪵', color: '#D7CCC8' },
  { id: 'wall_sunset', name: '노을 벽지', type: 'wallpaper', price: 600, icon: '🌅', color: '#FFE0B2' },
  { id: 'wall_purple', name: '라벤더 벽지', type: 'wallpaper', price: 300, icon: '💜', color: '#F3E5F5' },
  { id: 'wall_mint', name: '민트 벽지', type: 'wallpaper', price: 300, icon: '🍃', color: '#E0F2F1' },
  { id: 'wall_candy', name: '캔디 벽지', type: 'wallpaper', price: 400, icon: '🍬', color: '#FFEBEE' },
  { id: 'wall_space', name: '우주 벽지', type: 'wallpaper', price: 600, icon: '🪐', color: '#1A237E' },
  { id: 'wall_ocean', name: '바다 벽지', type: 'wallpaper', price: 500, icon: '🌊', color: '#B2EBF2' },
  { id: 'wall_flower', name: '꽃밭 벽지', type: 'wallpaper', price: 450, icon: '🌸', color: '#FCE4EC' },
  { id: 'wall_rainbow', name: '무지개 벽지', type: 'wallpaper', price: 700, icon: '🌈', color: '#FFF9C4' },

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
  { id: 'bed_cloud', name: '구름 침대', type: 'furniture', price: 700, icon: '☁️' },
  { id: 'bed_princess', name: '공주님 캐노피 침대', type: 'furniture', price: 900, icon: '👑' },
  { id: 'desk_gaming', name: '게이밍 책상', type: 'furniture', price: 500, icon: '🖥️' },
  { id: 'sofa_blue', name: '파란 소파', type: 'furniture', price: 550, icon: '🛋️' },
  { id: 'sofa_corner', name: '코너 소파', type: 'furniture', price: 700, icon: '🛏️' },
  { id: 'table_square', name: '사각 테이블', type: 'furniture', price: 300, icon: '⬛' },
  { id: 'shelf_toy', name: '장난감 선반', type: 'furniture', price: 380, icon: '🧸' },
  { id: 'wardrobe_pink', name: '핑크 옷장', type: 'furniture', price: 550, icon: '👗' },
  { id: 'bookcase_tall', name: '높은 책장', type: 'furniture', price: 450, icon: '📖' },
  { id: 'piano', name: '피아노', type: 'furniture', price: 900, icon: '🎹' },
  { id: 'vanity', name: '화장대', type: 'furniture', price: 500, icon: '💄' },
  { id: 'bench_window', name: '창가 벤치', type: 'furniture', price: 250, icon: '🪟' },
  { id: 'hammock', name: '해먹', type: 'furniture', price: 400, icon: '🪢' },
  { id: 'tent_play', name: '놀이 텐트', type: 'furniture', price: 350, icon: '⛺' },
  { id: 'bathtub', name: '욕조', type: 'furniture', price: 600, icon: '🛁' },
  { id: 'kitchen_set', name: '미니 주방', type: 'furniture', price: 800, icon: '🍳' },
  { id: 'bunk_ladder', name: '2단 선반 침대', type: 'furniture', price: 850, icon: '🪜' },
  { id: 'stool_round', name: '동그란 스툴', type: 'furniture', price: 120, icon: '🟤' },
  { id: 'cabinet_tv', name: 'TV 장식장', type: 'furniture', price: 400, icon: '📺' },
  { id: 'table_dining', name: '다이닝 테이블', type: 'furniture', price: 320, icon: '🍽️' },
  { id: 'chair_office', name: '사무 의자', type: 'furniture', price: 280, icon: '💺' },
  { id: 'beanbag', name: '빈백 소파', type: 'furniture', price: 300, icon: '🛋️' },
  { id: 'rocking_chair', name: '흔들의자', type: 'furniture', price: 260, icon: '🪑' },
  { id: 'crib', name: '아기 침대', type: 'furniture', price: 450, icon: '👶' },
  { id: 'dresser', name: '서랍장', type: 'furniture', price: 380, icon: '🗄️' },
  { id: 'sink_bathroom', name: '세면대', type: 'furniture', price: 300, icon: '🚰' },
  { id: 'toilet', name: '변기', type: 'furniture', price: 250, icon: '🚽' },
  { id: 'shower_stall', name: '샤워부스', type: 'furniture', price: 450, icon: '🚿' },
  { id: 'swing_indoor', name: '실내 그네', type: 'furniture', price: 400, icon: '🎠' },
  { id: 'slide_indoor', name: '미끄럼틀', type: 'furniture', price: 500, icon: '🛝' },
  { id: 'picnic_table', name: '피크닉 테이블', type: 'furniture', price: 280, icon: '🧺' },
  { id: 'hot_tub', name: '온수 욕조', type: 'furniture', price: 650, icon: '♨️' },
  { id: 'changing_table', name: '기저귀 교환대', type: 'furniture', price: 300, icon: '🍼' },

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
  { id: 'plant_flower', name: '꽃 화분', type: 'decor', price: 150, icon: '🌷' },
  { id: 'plant_cactus', name: '선인장', type: 'decor', price: 120, icon: '🌵' },
  { id: 'lamp_star', name: '별 조명', type: 'decor', price: 200, icon: '🌟' },
  { id: 'lamp_moon', name: '달 조명', type: 'decor', price: 220, icon: '🌙' },
  { id: 'garland_lights', name: '전구 장식', type: 'decor', price: 250, icon: '✨' },
  { id: 'rug_star', name: '별무늬 러그', type: 'decor', price: 250, icon: '⭐' },
  { id: 'rug_heart', name: '하트 러그', type: 'decor', price: 250, icon: '💗' },
  { id: 'candle', name: '향초', type: 'decor', price: 100, icon: '🕯️' },
  { id: 'globe', name: '지구본', type: 'decor', price: 180, icon: '🌍' },
  { id: 'telescope', name: '망원경', type: 'decor', price: 350, icon: '🔭' },
  { id: 'aquarium', name: '어항', type: 'decor', price: 400, icon: '🐠' },
  { id: 'toy_dino', name: '공룡 인형', type: 'decor', price: 200, icon: '🦖' },
  { id: 'toy_unicorn', name: '유니콘 인형', type: 'decor', price: 300, icon: '🦄' },
  { id: 'toy_bear', name: '곰인형', type: 'decor', price: 150, icon: '🧸' },
  { id: 'toy_blocks', name: '블록 장난감', type: 'decor', price: 130, icon: '🧱' },
  { id: 'toy_yoyo', name: '요요', type: 'decor', price: 90, icon: '🪀' },
  { id: 'gamepad', name: '게임기', type: 'decor', price: 500, icon: '🎮' },
  { id: 'headphones', name: '헤드폰', type: 'decor', price: 220, icon: '🎧' },
  { id: 'camera', name: '카메라', type: 'decor', price: 300, icon: '📷' },
  { id: 'guitar', name: '기타', type: 'decor', price: 600, icon: '🎸' },
  { id: 'basketball', name: '농구공', type: 'decor', price: 100, icon: '🏀' },
  { id: 'skateboard', name: '스케이트보드', type: 'decor', price: 350, icon: '🛹' },
  { id: 'cupcake_deco', name: '컵케이크 장식', type: 'decor', price: 80, icon: '🧁' },
  { id: 'medal', name: '메달', type: 'decor', price: 400, icon: '🥇' },
  { id: 'mobile_hanging', name: '모빌', type: 'decor', price: 130, icon: '🎐' },
  { id: 'fan_ceiling', name: '천장 선풍기', type: 'decor', price: 200, icon: '🌀' },
  { id: 'rug_dino', name: '공룡 러그', type: 'decor', price: 260, icon: '🦕' },
  { id: 'curtain_set', name: '커튼', type: 'decor', price: 180, icon: '🪟' },
  { id: 'shelf_display', name: '진열 선반', type: 'decor', price: 220, icon: '🏺' },
  { id: 'piggy_bank', name: '돼지 저금통', type: 'decor', price: 150, icon: '🐷' },
  { id: 'alarm_clock', name: '알람시계', type: 'decor', price: 100, icon: '⏰' },
  { id: 'teddy_giant', name: '대형 곰인형', type: 'decor', price: 400, icon: '🧸' },
  { id: 'star_projector', name: '별자리 조명', type: 'decor', price: 350, icon: '🌠' },
  { id: 'bubble_machine', name: '비눗방울 기계', type: 'decor', price: 280, icon: '🫧' },
  { id: 'easel_paint', name: '그림 이젤', type: 'decor', price: 250, icon: '🎨' },
  { id: 'xylophone', name: '실로폰', type: 'decor', price: 220, icon: '🎵' },
  { id: 'drum_set', name: '드럼 세트', type: 'decor', price: 500, icon: '🥁' },
  { id: 'beach_ball', name: '비치볼', type: 'decor', price: 90, icon: '🏖️' },

  // Clothing
  { id: 'hat_cap', name: '캡모자', type: 'clothing', price: 150, icon: '/assets/toca_hat_cap.png', isImage: true },
  { id: 'hat_crown', name: '왕관', type: 'clothing', price: 500, icon: '👑' },
  { id: 'glasses_sun', name: '선글라스', type: 'clothing', price: 200, icon: '🕶️' },
  { id: 'shirt_t', name: '티셔츠', type: 'clothing', price: 200, icon: '👕' },
  { id: 'dress_blue', name: '파란 드레스', type: 'clothing', price: 300, icon: '/assets/toca_dress_blue.png', isImage: true },
  { id: 'shoes_sneakers', name: '운동화', type: 'clothing', price: 150, icon: '👟' },
  { id: 'bag_school', name: '책가방', type: 'clothing', price: 250, icon: '🎒' },
  { id: 'ribbon_red', name: '빨간 리본', type: 'clothing', price: 150, icon: '🎀' },
  { id: 'hat_beanie', name: '비니 모자', type: 'clothing', price: 150, icon: '🧢' },
  { id: 'hat_witch', name: '마법사 모자', type: 'clothing', price: 300, icon: '🎩' },
  { id: 'glasses_round', name: '동그란 안경', type: 'clothing', price: 150, icon: '👓' },
  { id: 'necklace', name: '목걸이', type: 'clothing', price: 250, icon: '📿' },
  { id: 'earrings', name: '귀걸이', type: 'clothing', price: 200, icon: '💎' },
  { id: 'wings_fairy', name: '요정 날개', type: 'clothing', price: 500, icon: '🧚' },
  { id: 'cape_hero', name: '히어로 망토', type: 'clothing', price: 450, icon: '🦸' },
  { id: 'dress_pink', name: '핑크 드레스', type: 'clothing', price: 300, icon: '👗' },
  { id: 'skirt_yellow', name: '노랑 치마', type: 'clothing', price: 200, icon: '🎽' },
  { id: 'shoes_boots', name: '부츠', type: 'clothing', price: 200, icon: '🥾' },
  { id: 'shoes_sandal', name: '샌들', type: 'clothing', price: 120, icon: '👡' },
  { id: 'watch', name: '손목시계', type: 'clothing', price: 250, icon: '⌚' },
  { id: 'scarf', name: '목도리', type: 'clothing', price: 150, icon: '🧣' },
  { id: 'gloves', name: '장갑', type: 'clothing', price: 100, icon: '🧤' },

  // Pets
  { id: 'pet_cat', name: '고양이', type: 'pet', price: 600, icon: '🐱' },
  { id: 'pet_dog', name: '강아지', type: 'pet', price: 600, icon: '🐶' },
  { id: 'pet_rabbit', name: '토끼', type: 'pet', price: 550, icon: '🐰' },
  { id: 'pet_hamster', name: '햄스터', type: 'pet', price: 400, icon: '🐹' },
  { id: 'pet_bird', name: '앵무새', type: 'pet', price: 500, icon: '🦜' },
  { id: 'pet_fish', name: '금붕어', type: 'pet', price: 250, icon: '🐟' },
  { id: 'pet_turtle', name: '거북이', type: 'pet', price: 450, icon: '🐢' },
  { id: 'pet_unicorn', name: '유니콘', type: 'pet', price: 1000, icon: '🦄' },
  { id: 'pet_fox', name: '여우', type: 'pet', price: 500, icon: '🦊' },
  { id: 'pet_penguin', name: '펭귄', type: 'pet', price: 550, icon: '🐧' },
  { id: 'pet_panda', name: '판다', type: 'pet', price: 700, icon: '🐼' },
  { id: 'pet_hedgehog', name: '고슴도치', type: 'pet', price: 350, icon: '🦔' },
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

