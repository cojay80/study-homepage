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
  pet_cat: '야옹~ 😺', pet_dog: '멍멍! 🐶', pet_rabbit: '깡총깡총 🐰', pet_hamster: '찍찍! 🐹',
  pet_bird: '짹짹! 🦜', pet_fish: '뻐끔뻐끔 🐟', pet_turtle: '느긋해요~ 🐢', pet_unicorn: '반짝반짝 🦄',
  toy_robot: '삐빅삐빅 🤖', toy_car: '부릉부릉! 🚗', toy_dino: '크르렁! 🦖', toy_unicorn: '히히힝~ 🦄',
  toy_bear: '꼬옥 안아줘요 🧸', toy_blocks: '쌓았다 무너뜨렸다! 🧱', toy_yoyo: '슝슝! 🪀',
  computer: '타닥타닥 💻', gamepad: '게임하자! 🎮', speaker: '🎵🎶', headphones: '신나는 음악! 🎧',
  trophy: '최고야! 🏆', medal: '자랑스러워요 🥇', balloons: '두둥실~ 🎈',
  piano: '도레미파솔~ 🎹', guitar: '둥가둥가 🎸',
  desk_wood: '공부하자! 📚', desk_white: '공부하자! 📚', desk_gaming: '집중! 🎮',
  mirror: '예쁘다~ ✨', vanity: '꾸미기 좋아! 💄',
  telescope: '별이 보여요! 🔭', globe: '세계여행 떠나요 🌍', aquarium: '물고기 구경! 🐠',
  cabinet_tv: '만화 볼래요! 📺', kitchen_set: '요리해볼까? 🍳', bathtub: '첨벙첨벙! 🛁',
  starter_shelf: '책 읽어볼까? 📖', shelf_books: '책 읽어볼까? 📖', bookcase_tall: '책이 가득해요! 📚',
  shelf_toy: '장난감이 가득해요! 🧸', wardrobe: '오늘은 뭐 입지? 👗', wardrobe_pink: '오늘은 뭐 입지? 👗',
  starter_plant: '쑥쑥 자라라~ 🌱', plant_pot: '쑥쑥 자라라~ 🌱', plant_big: '쑥쑥 자라라~ 🌳',
  plant_flower: '예쁜 꽃이에요 🌸', plant_cactus: '따끔따끔 조심! 🌵',
  starter_lamp: '환하게 밝혀줘요! 💡', lamp_floor: '환하게 밝혀줘요! 💡',
  lamp_star: '반짝반짝 작은 별 ⭐', lamp_moon: '잘 자요~ 🌙', garland_lights: '반짝반짝 예뻐요! ✨',
  clock_wall: '몇 시일까? 🕐', picture_frame: '좋은 추억이에요 🖼️', candle: '후~ 소원을 빌어요 🕯️',
  camera: '치즈~ 찰칵! 📸', basketball: '슛! 골인! 🏀', skateboard: '휭~ 타볼까? 🛹',
  cupcake_deco: '맛있겠다! 🧁',
  starter_rug: '포근해요~ 🧶', rug_bear: '푹신푹신해요 🧸', rug_rainbow: '무지개색이에요! 🌈',
  rug_star: '별이 반짝여요 ⭐', rug_heart: '하트 모양이에요 💗', rug_dino: '쿵쿵 공룡이다! 🦕',
  table_dining: '같이 밥 먹어요! 🍽️', chair_office: '일하는 척! 💼', beanbag: '푹신푹신~ 🛋️',
  rocking_chair: '흔들흔들~ 🌀', crib: '쿨쿨.. 아기가 자요 👶', dresser: '옷 정리하자! 👕',
  sink_bathroom: '손 씻어요! 🧼', toilet: '화장실 다녀올게요! 🚽', shower_stall: '샤워하자! 🚿',
  swing_indoor: '그네 타요~ 🎠', slide_indoor: '슝~ 미끄럼틀! 🛝', picnic_table: '소풍 가자! 🧺',
  hot_tub: '따뜻해요~ ♨️', changing_table: '기저귀 갈아요~ 🍼',
  mobile_hanging: '빙글빙글 돌아가요 🎐', fan_ceiling: '시원해요~ 🌀', curtain_set: '살랑살랑~ 🪟',
  shelf_display: '멋진 진열장이에요! 🏺', piggy_bank: '저금하자! 🐷', alarm_clock: '일어날 시간이에요! ⏰',
  teddy_giant: '커다란 곰인형이에요! 🧸', star_projector: '별빛이 반짝여요 🌠',
  bubble_machine: '보글보글 비눗방울! 🫧', easel_paint: '그림 그려볼까? 🎨', xylophone: '딩동댕~ 🎵',
  drum_set: '둥둥둥! 🥁', beach_ball: '같이 놀자! 🏖️',
  pet_fox: '캥캥! 🦊', pet_penguin: '뒤뚱뒤뚱~ 🐧', pet_panda: '대나무 먹어요 🐼', pet_hedgehog: '따끔따끔 귀여워요 🦔',
  recliner: '편안해요~ 🛋️', chaise_lounge: '느긋하게 쉬어요 🛋️', murphy_bed: '벽에서 침대가 나와요! 🛏️',
  daybed: '낮잠 자기 좋아요 😴', futon: '폭신폭신해요~ 🛏️', ottoman: '발 올리고 쉬어요 🦶',
  coffee_table: '차 한잔 할까요? ☕', side_table: '물건 올려놓기 좋아요 🛎️',
  corner_desk: '집중해서 공부해요 📐', standing_desk: '서서 공부해볼까? 🧍',
  ladder_shelf: '책이 가지런해요 🪜', cat_tree: '냥이가 좋아해요! 🐱', fish_tank_stand: '어항을 올려요 🐟',
  shoe_rack: '신발 정리하자! 👟', coat_rack: '외투를 걸어요 🧥', laundry_basket: '빨래하자! 🧺',
  vanity_stool: '앉아서 꾸며요 💺', bunk_triple: '3층 침대예요! 🛏️', canopy_bed: '공주님 침대! 👑',
  hanging_chair: '살랑살랑 흔들려요 🪑', papasan_chair: '동그랗고 포근해요 🪑', folding_chair: '접었다 폈다! 🪑',
  picnic_bench: '소풍 나온 것 같아요 🧺', garden_bench: '정원에서 쉬어요 🌳', hammock_chair: '살랑살랑 그네예요 🪢',
  arcade_cabinet: '오락하자! 🕹️', jukebox: '신나는 음악! 🎵', mini_fridge: '시원한 음료 있어요 🧊',
  wine_rack: '깔끔하게 정리돼요 🗄️', bar_cart: '카트를 밀어요 🛒', tv_stand_large: '만화 보자! 📺',
  room_divider: '방을 나눠줘요 🚪', sectional_sofa: '다같이 앉아요! 🛋️', loveseat: '둘이 앉기 딱 좋아요 🛋️',
  tapestry: '예쁜 그림이에요 🧵', dreamcatcher: '좋은 꿈 꾸세요 🪶', wall_art_abstract: '멋진 작품이에요 🖼️',
  wall_art_landscape: '아름다운 풍경이에요 🏞️', string_lights: '반짝반짝 예뻐요 💡', neon_sign: '환하게 빛나요! 💡',
  disco_ball: '빙글빙글 반짝여요 🪩', lava_lamp: '몽글몽글 신기해요 🔮', snow_globe: '눈이 내려요! ❄️',
  terrarium: '작은 정원이에요 🪴', bonsai: '멋진 나무예요 🌳', succulent: '통통한 다육이 🌵',
  herb_garden: '향긋해요~ 🌿', wind_chime: '딸랑딸랑~ 🎐', birdhouse: '새들의 집이에요 🏠',
  gnome_statue: '안녕! 정원 요정이야 🧙', fountain_mini: '졸졸졸 물소리 ⛲', christmas_tree: '메리 크리스마스! 🎄',
  pumpkin_deco: '핼러윈이다! 🎃', easter_eggs: '부활절 달걀이에요 🥚', halloween_ghost: '우웅~ 유령이다! 👻',
  snowman_deco: '눈사람이에요! ⛄', firework_deco: '펑펑! 축하해요 🎆', kite_deco: '연이 날아가요 🪁',
  toaster: '빵 구워요! 🍞', blender: '위잉위잉~ 🥤', coffee_maker: '커피 내려요 ☕',
  fruit_bowl: '과일 먹자! 🍎', cookie_jar: '쿠키 하나 줄까요? 🍪', spice_rack: '요리에 필요해요 🧂',
  pencil_case: '공부 준비 끝! ✏️', backpack_deco: '가방 챙기자! 🎒', towel_set: '보송보송해요 🧻',
  soap_dispenser: '거품 내서 씻어요 🧴', bath_toys: '목욕이 즐거워요 🦆', rug_zebra: '얼룩 무늬예요 🦓',
  rug_polka: '동글동글 귀여워요 ⚪', rug_geometric: '멋진 무늬예요 🔷', lamp_cloud: '구름처럼 포근해요 ☁️',
  lamp_rocket: '우주로 슝~ 🚀', lamp_flower: '꽃이 활짝 폈어요 🌼', telescope_gold: '별을 관찰해요 🔭',
  chess_set: '체스 한 판 둘까요? ♟️', puzzle_box: '퍼즐 맞춰볼까? 🧩', jewelry_box: '반짝이는 보석이에요 💍',
  pet_owl: '부엉부엉! 🦉', pet_koala: '나무에 매달려요 🐨', pet_sloth: '천천히 움직여요~ 🦥',
  pet_dolphin: '헤엄쳐요! 🐬', pet_horse: '히히힝! 🐴', pet_sheep: '메에~ 🐑',
  pet_chicken: '꼬끼오! 🐔', pet_duck: '꽥꽥! 🦆', pet_chameleon: '색이 변해요! 🦎', pet_squirrel: '도토리 냠냠 🐿️',
  rocket_chair: '우주로 출발! 🚀', throne_chair: '나는 왕이야! 👑', cafe_chair: '카페에 앉아요 ☕',
  beach_chair: '햇살이 좋아요~ 🏖️', sled: '씽씽 눈썰매! 🛷',
  space_pod_bed: '우주에서 잠들어요 🛸', sleeping_bag: '포근하게 잠들어요 😴', camping_tent: '캠핑 재밌다! 🏕️',
  yoga_mat: '숨 크게 쉬어요~ 🧘',
  castle_tower_shelf: '성 안의 보물이에요 🏰', treasure_chest: '보물이 가득해요! 💰', cafe_table: '주문할까요? ☕',
  keyboard_synth: '띵동띵동~ 🎹', locker: '내 물건 보관함이에요 🗄️', desk_lamp_school: '밝게 비춰줘요 💡',
  soccer_goal: '골인! ⚽', basketball_hoop: '슛! 골인! 🏀', wheelbarrow: '짐을 옮겨요 🛒',
  blackboard: '칠판에 써볼까? ⬛', bookend: '책이 쓰러지지 않아요 📚',
  astronaut_helmet_deco: '우주비행사예요! 👨‍🚀', alien_plant: '신기한 외계 식물이에요 🌱',
  planet_mobile: '행성이 돌아가요 🪐', star_map: '별자리를 찾아봐요 🗺️', spaceship_toy: '슈웅~ 우주선! 🛸',
  ufo_lamp: '삐용삐용 UFO예요 🛸', knight_armor_deco: '용감한 기사예요! 🛡️', shield_deco: '방어 완료! 🛡️',
  sword_deco: '용사의 검이에요 ⚔️', dragon_toy: '크아앙! 🐉', crown_stand: '왕관을 씌워줘요 👑',
  campfire_deco: '따뜻한 모닥불이에요 🔥', lantern_camping: '길을 밝혀줘요 🏮', fishing_rod: '물고기를 낚아요! 🎣',
  compass_deco: '방향을 찾아요 🧭', binoculars: '멀리 보여요! 🔭', menu_board: '오늘의 메뉴예요 📋',
  coffee_cup_deco: '따뜻한 커피예요 ☕', donut_deco: '달콤한 도넛! 🍩', sandwich_deco: '맛있는 샌드위치 🥪',
  milkshake_deco: '시원한 밀크셰이크! 🥤', microphone_stand: '노래해볼까? 🎤', tambourine: '찰랑찰랑~ 🪘',
  maracas: '차차차! 🎶', harmonica: '후~ 하모니카 🎵', tennis_racket: '테니스 치자! 🎾',
  baseball_bat: '홈런이다! ⚾', dumbbell: '으랏차! 힘내요 🏋️', jump_rope: '줄넘기 하자! 🪢',
  trophy_shelf: '우승 트로피예요! 🏆', globe_stand: '세계 여행 떠나요 🌍', world_map: '어디로 갈까요? 🗺️',
  watering_can: '물을 줘요~ 🪴', flower_pot_large: '쑥쑥 자라라 🪴', snowflake_deco: '눈이 내려요! ❄️',
  holiday_wreath: '메리 크리스마스! 🎄', gift_boxes: '선물이에요! 🎁', beach_umbrella: '시원한 그늘이에요 ⛱️',
  surfboard: '파도를 타요! 🏄', seashell_collection: '바다 소리가 들려요 🐚',
  scarf_winter: '따뜻해요~ 🧣', ski_goggles: '슝~ 스키 타요 🥽',
  pet_llama: '음메~ 🦙', pet_flamingo: '한 발로 서요! 🦩', pet_peacock: '깃털이 예뻐요 🦚',
  pet_raccoon: '손을 씻어요~ 🦝', pet_otter: '첨벙첨벙 헤엄쳐요 🦦', pet_seal: '꽥꽥 인사해요 🦭',
  mushroom_stool: '폭신폭신 버섯이에요 🍄', hay_bale: '농장 냄새가 나요 🌾',
  fairy_house: '요정이 살아요! 🏡', barn_deco: '동물들의 집이에요 🏚️', circus_tent: '서커스 구경하자! 🎪',
  carousel_deco: '빙글빙글 재밌어요 🎠', ferris_wheel_deco: '높이 올라가요! 🎡', lighthouse_deco: '불빛이 반짝여요 🗼',
  dino_egg_deco: '공룡이 태어날까요? 🥚', volcano_deco: '펑! 용암이 나와요 🌋', fossil_deco: '아주 오래됐어요 🦴',
  dino_bone_deco: '공룡 뼈다귀예요 🦴', pteranodon_toy: '푸드덕! 날아가요 🦅', triceratops_toy: '뿔이 세 개예요! 🦕',
  trex_toy: '크아앙! 무서워요 🦖', prehistoric_plant: '아주 옛날 식물이에요 🌿', amber_deco: '보석처럼 빛나요 🟠',
  dino_footprint_rug: '쿵쿵 발자국이에요 🐾',
  tablet_deco: '영상을 봐요! 📱', vr_headset: '다른 세상이 보여요! 🥽', drone_toy: '위이잉 날아가요 🚁',
  robot_arm_deco: '움직여요! 🦾', circuit_board_deco: '삐삐빅 신기해요 🔌', gear_deco: '돌아가요~ ⚙️',
  laser_toy: '슉! 쏘아볼까요? 🔫', hologram_deco: '신비로워요! 💠',
  toadstool_deco: '만지면 안 돼요! 🍄', fairy_wings_deco: '날아볼까요? 🧚', magic_wand_deco: '마법을 부려요! 🪄',
  potion_bottle: '무슨 약일까요? 🧪', spellbook_deco: '주문을 외워요~ 📕', glowing_mushroom: '빛이 나요! 🍄',
  fairy_ring_rug: '요정들이 춤춰요 🍄',
  scarecrow_deco: '까마귀야 저리 가! 🧑‍🌾', farm_fence: '농장 울타리예요 🚧', silo_deco: '곡식을 저장해요 🏭',
  milk_bucket: '신선한 우유예요 🪣', egg_basket: '달걀이 가득해요 🧺', corn_deco: '옥수수 맛있겠다! 🌽',
  pumpkin_patch: '커다란 호박이에요 🎃',
  coral_deco: '알록달록 산호예요 🪸', treasure_map: '보물을 찾아봐요! 🗺️', pearl_deco: '반짝이는 진주예요 ⚪',
  anchor_deco: '배를 고정해요 ⚓', ship_wheel: '항해를 떠나요! ☸️', mermaid_tail_deco: '인어공주 같아요 🧜',
  bubble_deco: '보글보글 물방울 🫧', wave_deco: '철썩철썩 파도예요 🌊',
  paint_palette: '무슨 색을 칠할까요? 🎨', paintbrush_deco: '그림을 그려요! 🖌️', sculpture_deco: '멋진 조각상이에요 🗿',
  clay_deco: '조물조물 만들어요 🧱', watercolor_deco: '알록달록해요! 🎨', sketchpad_deco: '그림을 그려볼까요? 📓',
  oven_deco: '따끈따끈 구워져요 🔥', rolling_pin: '반죽을 밀어요~ 🪵', cupcake_stand: '컵케이크 진열대예요 🧁',
  pie_deco: '맛있는 파이예요! 🥧', whisk_deco: '휘휘 저어요~ 🥄', mixing_bowl: '반죽을 만들어요 🥣',
  popcorn_stand: '팝콘 냄새가 나요! 🍿', balloon_arch: '축하해요! 🎈', clown_deco: '재미있는 광대예요 🤡',
  juggling_balls: '저글링 해볼까요? 🔴', unicycle_deco: '균형 잡기 어려워요! 🚲',
  pet_hippo: '첨벙! 🦛', pet_zebra: '줄무늬가 멋져요 🦓', pet_kangaroo: '깡충깡충 뛰어요! 🦘',
  pet_polar_bear: '눈 속에서 놀아요 🐻‍❄️', pet_toucan: '부리가 커요! 🦜', pet_ostrich: '빨리 달려요! 🦩',
  hospital_bed: '푹 쉬면 나아요 🛏️', wheelchair: '씽씽 굴러가요 ♿', dentist_chair: '아~ 입을 벌려요 🦷',
  ice_rink: '쓩쓩 스케이트 타요! ⛸️', winter_cabin: '따뜻한 오두막이에요 🏔️', pool_deco: '첨벙첨벙 수영해요! 🏊',
  diving_board: '풍덩! 다이빙! 🤿', concert_stage: '노래해볼까요? 🎤', dj_booth: '신나는 음악을 틀어요 🎧',
  garden_shed: '도구들이 있어요 🏚️', planetarium_dome: '별을 관찰해요! 🔭',
  stethoscope_deco: '숨 크게 쉬어보세요 🩺', bandage_deco: '다친 곳에 붙여요 🩹', medicine_bottle: '약을 먹어요 💊',
  first_aid_kit: '다치면 여기서 꺼내요 🧰', syringe_toy: '주사 무섭지 않아요! 💉', eye_chart: '어떤 글자가 보여요? 👁️',
  x_ray_deco: '뼈가 보여요! 🦴', microscope_deco: '작은 것도 크게 봐요 🔬', test_tube_deco: '실험해볼까요? 🧪',
  beaker_deco: '무엇을 섞을까요? ⚗️', periodic_table_deco: '원소를 배워요 🧬', magnet_deco: '찰싹 붙어요! 🧲',
  robot_kit_deco: '로봇을 조립해요! 🤖', ski_deco: '슝~ 스키 타요! 🎿', snowboard_deco: '멋지게 타볼까요? 🏂',
  hockey_puck: '탁! 쳐볼까요? ⚫', ski_poles: '균형을 잡아요 🎿', hot_cocoa_deco: '따뜻하고 달콤해요~ ☕',
  suitcase_deco: '여행 가자! 🧳', passport_deco: '여행 준비 완료! 📘', airplane_ticket: '비행기 타러 가요! 🎫',
  eiffel_tower_deco: '프랑스에 왔어요! 🗼', pyramid_deco: '이집트 여행이에요! 🔺', postcard_deco: '편지를 보내요 💌',
  joystick_deco: '게임하자! 🕹️', controller_deco: '같이 게임할까요? 🎮', game_trophy_deco: '최고 점수예요! 🏆',
  shovel_deco: '땅을 파볼까요? 🥄', rake_deco: '낙엽을 모아요 🧹', seed_packet: '씨앗을 심어요 🌱',
  garden_hose: '물을 뿌려요! 🚿', inflatable_ring: '둥둥 떠다녀요 🍩', life_ring: '안전하게 수영해요 🛟',
  pool_noodle: '물놀이 재밌다! 🍢', sunscreen_deco: '햇빛을 막아줘요 🧴',
  spotlight_deco: '무대가 환해져요! 🔦', dj_turntable: '스크래치! 💿', amplifier_deco: '소리가 커져요! 🔊',
  band_poster: '멋진 밴드예요 🖼️', drum_sticks: '두드려볼까요? 🥢',
  pet_giraffe: '목이 길어요! 🦒', pet_alpaca: '보들보들해요 🦙', pet_lemur: '눈이 커요! 🐒',
  pet_meerkat: '두리번두리번 🐿️', pet_wolf: '아우우~ 🐺', pet_deer: '뿔이 멋져요 🦌',
  hero_command_center: '출동 준비! 🦸', photo_backdrop: '사진 찍자! 📸', vending_machine: '음료수 뽑아요~ 🥤',
  gumball_machine: '뭐가 나올까요? 🍬', igloo_furniture: '따뜻해요~ 🧊', oasis_tent: '사막 여행 중이에요 🏕️',
  camera_tripod_stand: '찰칵! 사진 찍어요 📷', toy_store_shelf: '장난감이 가득해요! 🧸',
  snow_fort: '눈싸움 준비 완료! ⛄', desert_oasis_pool: '시원한 오아시스예요 🏝️',
  cape_stand: '망토를 걸쳐요! 🦸', hero_mask_display: '가면을 써볼까요? 🎭', comic_book_stack: '만화책 읽어요 📚',
  superhero_logo_deco: '변신! 💥', utility_belt_deco: '도구가 가득해요 🥋', power_ring_deco: '힘이 솟아나요! 💍',
  tripod_deco: '카메라를 세워요 📸', flash_light_photo: '번쩍! 📸', photo_album: '추억을 모아요 📔',
  film_roll_deco: '옛날 카메라 필름이에요 🎞️', polaroid_deco: '바로 인화돼요! 🖼️', camera_lens_deco: '자세히 보여요 🔎',
  toy_train_deco: '칙칙폭폭~ 🚂', spinning_top_deco: '빙글빙글 돌아요 🌀', jack_in_box: '짠! 놀랐죠? 📦',
  marble_deco: '데굴데굴 굴러가요 🔮', dice_deco: '주사위를 굴려요! 🎲', domino_deco: '와르르 무너져요 🁢',
  rubber_duck_deco: '삑삑! 🦆',
  weather_vane: '바람이 부는 방향이에요 🌬️', thermometer_outdoor: '오늘 몇 도일까요? 🌡️',
  umbrella_stand: '우산을 꽂아요 ☂️', rain_gauge: '비가 얼마나 왔을까요? 🌧️',
  cloud_deco: '뭉게뭉게 구름이에요 ☁️', lightning_deco: '번쩍! 조심해요 ⚡',
  igloo_deco: '이누이트의 집이에요 🧊', ice_sculpture_deco: '차가운 예술 작품이에요 🧊',
  snow_shovel: '눈을 치워요! 🥄', arctic_flag: '북극 탐험대예요! 🚩', penguin_statue: '뒤뚱뒤뚱 펭귄이에요 🐧',
  icicle_deco: '뾰족뾰족해요! 🧊',
  oasis_deco: '사막의 오아시스예요 🌴', sand_dune_deco: '모래 언덕이에요 🏜️', camel_saddle: '낙타를 타볼까요? 🐫',
  desert_lantern: '어둠을 밝혀줘요 🏮', cactus_flower_deco: '선인장에 꽃이 폈어요! 🌵',
  pet_reindeer: '썰매를 끌어요! 🦌', pet_arctic_fox: '하얀 털이 예뻐요 🦊', pet_walrus: '어흥~ 🦣',
  pet_seahorse: '살랑살랑 헤엄쳐요 🐠', pet_bat: '거꾸로 매달려요! 🦇',
  submarine_furniture: '바닷속을 탐험해요! 🚤', watchtower: '멀리 보여요! 🏰', bumper_car: '빵빵! 부딪혀요 🚗',
  cotton_candy_stand: '달콤한 솜사탕! 🍭', ticket_booth: '표를 사요! 🎫', mineral_display_case: '반짝이는 광물이에요 💎',
  drawbridge: '다리가 열려요! 🌉', lifeguard_tower: '안전을 지켜요! 🏖️',
  periscope_deco: '몰래 살펴봐요 🔭', deep_sea_light: '어두운 곳을 밝혀요 💡', angler_fish_deco: '무서운 이빨이에요! 🐟',
  sea_cave_deco: '동굴 탐험이에요 🕳️', sonar_deco: '삐삐 소리가 나요 📡', oxygen_tank_deco: '숨쉬기 도와줘요 🫧',
  catapult_deco: '슝! 발사해요 🏹', castle_wall_deco: '성을 지켜요! 🧱', banner_medieval_deco: '깃발이 휘날려요 🚩',
  moat_deco: '물이 성을 둘러싸요 🌊', knight_horse_deco: '이랴! 달려요 🐴', jousting_lance: '창을 겨눠요! 🔱',
  roller_coaster_deco: '슈웅~ 신나요! 🎢', ring_toss_game: '고리를 던져요! ⭕', prize_wall_deco: '선물을 골라요 🧸',
  carnival_lights: '반짝반짝 축제예요! 🎇', funnel_cake_deco: '달콤한 간식이에요 🥞', balloon_dart_deco: '펑! 맞혔다! 🎯',
  gem_collection_deco: '멋진 보석 모음이에요 💎', crystal_deco: '반짝반짝 수정이에요 🔮', geode_deco: '깨보면 놀라워요! 🪨',
  rock_polisher: '돌을 반짝이게 해요 ⚙️', fossil_rock_deco: '아주 오래된 돌이에요 🪨',
  bubble_wand_deco: '비눗방울 불어요~ 🫧', sidewalk_chalk: '바닥에 그림 그려요! 🖍️', hopscotch_deco: '깡충깡충 뛰어요 🔢',
  pinwheel_deco: '빙글빙글 돌아가요 🎐', sandbox_deco: '모래 놀이해요! 🏖️', water_gun_deco: '물을 쏴요! 🔫',
  frisbee_deco: '휙 던져요! 🥏', board_game_box: '같이 놀아요! 📦', playing_cards_deco: '카드 게임해요 🃏',
  magic_trick_deco: '짜잔! 마술이에요 🎩', kaleidoscope_deco: '알록달록 신기해요! 🔮', slinky_deco: '스르륵 내려가요 🌀',
  pet_octopus: '다리가 여덟 개예요! 🐙', pet_crab: '옆으로 걸어요~ 🦀', pet_stingray: '납작하게 헤엄쳐요 🐡',
  pet_orca: '큰 소리로 울어요! 🐋', pet_seagull: '끼룩끼룩! 🐦',
};
const DEFAULT_REACTION = '✨';
const reactionFor = (itemId) => ITEM_REACTIONS[itemId] || DEFAULT_REACTION;

// Placed-item render size in px (default 96 if not listed) so furniture reads
// at roughly the right scale next to the ~140px-tall avatar.
const ITEM_SIZE = {
  // Extra large furniture
  bed_pink: 170, bed_bunk: 180, bed_cloud: 170, bed_princess: 190, bunk_ladder: 190,
  sofa_red: 160, sofa_blue: 160, sofa_corner: 170, wardrobe: 170, wardrobe_pink: 170,
  piano: 180, kitchen_set: 170, bathtub: 160, cabinet_tv: 140, bookcase_tall: 160,
  aquarium: 130, tent_play: 160,
  hot_tub: 170, slide_indoor: 170, swing_indoor: 150, crib: 140, teddy_giant: 130,
  // Large
  desk_wood: 120, desk_white: 120, desk_gaming: 120, table_round: 110, table_square: 110,
  shelf_books: 130, shelf_toy: 120, starter_shelf: 110, mirror: 110, vanity: 120, hammock: 150,
  table_dining: 130, picnic_table: 130, shower_stall: 130, dresser: 130, changing_table: 120,
  shelf_display: 100,
  // Seats -- sized so the avatar reads as sitting on/in them
  chair_wood: 100, chair_gaming: 110, starter_chair: 100, stool_round: 80, bench_window: 110,
  sofa_bean: 100, chair_office: 100, beanbag: 110, rocking_chair: 105,
  // Small decor
  candle: 50, medal: 55, cupcake_deco: 50, toy_yoyo: 50, basketball: 55, picture_frame: 60,
  clock_wall: 65, plant_pot: 65, plant_cactus: 55, ribbon_red: 40,
  sink_bathroom: 100, toilet: 85, mobile_hanging: 55, fan_ceiling: 60, alarm_clock: 45,
  piggy_bank: 55, star_projector: 65, bubble_machine: 70, easel_paint: 75, xylophone: 65,
  drum_set: 80, beach_ball: 55, curtain_set: 70, rug_dino: 110,
  // New furniture batch
  murphy_bed: 160, daybed: 150, bunk_triple: 200, canopy_bed: 190, sectional_sofa: 180,
  chaise_lounge: 160, cat_tree: 140, tv_stand_large: 150, room_divider: 130, arcade_cabinet: 140,
  recliner: 120, hanging_chair: 120, papasan_chair: 120, corner_desk: 120, standing_desk: 110,
  ladder_shelf: 120, shoe_rack: 110, wine_rack: 110, jukebox: 110, mini_fridge: 120,
  fountain_mini: 100, christmas_tree: 130,
  ottoman: 65, side_table: 70, coat_rack: 90, vanity_stool: 70, laundry_basket: 60, folding_chair: 75,
  // New decor batch (small)
  pencil_case: 40, soap_dispenser: 45, jewelry_box: 45, snow_globe: 50, succulent: 50,
  dreamcatcher: 60, lava_lamp: 55, wind_chime: 55, pumpkin_deco: 55, easter_eggs: 50,
  cookie_jar: 55, spice_rack: 55, fruit_bowl: 55, bath_toys: 55, chess_set: 60, puzzle_box: 55,
  backpack_deco: 55, gnome_statue: 60, lamp_flower: 55, kite_deco: 60,
  // New pets
  pet_horse: 130, pet_dolphin: 110,
  // Third batch: space/castle/camping/cafe/music/sports furniture
  space_pod_bed: 170, camping_tent: 160, throne_chair: 130, castle_tower_shelf: 150,
  keyboard_synth: 130, sled: 110, soccer_goal: 150, basketball_hoop: 140, blackboard: 130,
  sleeping_bag: 100, cafe_table: 110, cafe_chair: 90, beach_chair: 90, locker: 110,
  wheelbarrow: 90, bookend: 70, desk_lamp_school: 60, yoga_mat: 110,
  // Third batch: small decor
  astronaut_helmet_deco: 60, alien_plant: 55, planet_mobile: 60, star_map: 70, spaceship_toy: 65,
  ufo_lamp: 65, knight_armor_deco: 90, shield_deco: 60, sword_deco: 55, dragon_toy: 80,
  crown_stand: 55, campfire_deco: 70, lantern_camping: 55, fishing_rod: 70, compass_deco: 45,
  binoculars: 55, menu_board: 70, coffee_cup_deco: 45, donut_deco: 45, sandwich_deco: 45,
  milkshake_deco: 50, microphone_stand: 65, tambourine: 50, maracas: 45, harmonica: 45,
  tennis_racket: 60, baseball_bat: 65, dumbbell: 50, jump_rope: 45, trophy_shelf: 90,
  globe_stand: 80, world_map: 80, watering_can: 50, flower_pot_large: 80, snowflake_deco: 50,
  holiday_wreath: 65, gift_boxes: 60, beach_umbrella: 100, surfboard: 100, seashell_collection: 50,
  // Third batch: pets
  pet_flamingo: 110, pet_peacock: 110, pet_llama: 120,
  // Fourth batch: dino/robot/fairy/farm/ocean/art/bakery/circus furniture
  fairy_house: 150, barn_deco: 170, circus_tent: 170, carousel_deco: 170, ferris_wheel_deco: 190,
  lighthouse_deco: 160, mushroom_stool: 90, hay_bale: 100,
  // Fourth batch: small decor
  dino_egg_deco: 55, fossil_deco: 55, dino_bone_deco: 50, amber_deco: 45, dino_footprint_rug: 100,
  circuit_board_deco: 55, gear_deco: 45, toadstool_deco: 45, potion_bottle: 45, glowing_mushroom: 45,
  fairy_ring_rug: 100, milk_bucket: 45, egg_basket: 55, corn_deco: 45, pearl_deco: 40, bubble_deco: 45,
  wave_deco: 55, paintbrush_deco: 45, clay_deco: 50, sketchpad_deco: 55, rolling_pin: 50, whisk_deco: 40,
  mixing_bowl: 50, juggling_balls: 45,
  // Fourth batch: pets
  pet_hippo: 130, pet_polar_bear: 130, pet_kangaroo: 120,
  // Fifth batch: hospital/science/winter/travel/pool/concert furniture
  hospital_bed: 160, winter_cabin: 170, pool_deco: 190, concert_stage: 180, dj_booth: 130,
  garden_shed: 150, planetarium_dome: 160, wheelchair: 100, dentist_chair: 110, ice_rink: 180,
  diving_board: 130,
  // Fifth batch: small decor
  bandage_deco: 40, medicine_bottle: 45, syringe_toy: 40, hockey_puck: 35, postcard_deco: 45,
  hot_cocoa_deco: 45, seed_packet: 40, sunscreen_deco: 40, drum_sticks: 40, pool_noodle: 45,
  // Fifth batch: pets
  pet_giraffe: 140, pet_meerkat: 90,
  // Sixth batch: superhero/photo/toy/weather/arctic/desert furniture
  hero_command_center: 170, igloo_furniture: 150, oasis_tent: 160, snow_fort: 150,
  desert_oasis_pool: 180, toy_store_shelf: 130, photo_backdrop: 140, vending_machine: 120,
  gumball_machine: 90, camera_tripod_stand: 90,
  // Sixth batch: small decor
  marble_deco: 35, dice_deco: 40, spinning_top_deco: 40, rubber_duck_deco: 45, icicle_deco: 40,
  film_roll_deco: 40, polaroid_deco: 45,
  // Sixth batch: pets
  pet_walrus: 140, pet_seahorse: 70,
  // Seventh batch: deep-sea/medieval/carnival/mineral furniture
  submarine_furniture: 190, watchtower: 170, drawbridge: 160, lifeguard_tower: 150,
  bumper_car: 110, cotton_candy_stand: 130, ticket_booth: 130, mineral_display_case: 120,
  // Seventh batch: small decor
  sidewalk_chalk: 40, ring_toss_game: 60, playing_cards_deco: 45, frisbee_deco: 50,
  slinky_deco: 45, bubble_wand_deco: 40, pinwheel_deco: 50, water_gun_deco: 55,
  // Seventh batch: pets
  pet_crab: 55, pet_seagull: 80, pet_orca: 150,
};
const itemSizePx = (itemId) => ITEM_SIZE[itemId] || 96;

// Furniture/decor a dragged-close avatar will snap onto until stood back up.
// Four interaction shapes, checked in this priority order when the avatar is
// dropped near more than one at once:
const SEATS = new Set([
  'chair_wood', 'chair_gaming', 'starter_chair', 'stool_round', 'bench_window',
  'sofa_red', 'sofa_blue', 'sofa_corner',
  'chair_office', 'beanbag', 'rocking_chair', 'swing_indoor', 'teddy_giant',
  'recliner', 'chaise_lounge', 'ottoman', 'hanging_chair', 'papasan_chair', 'folding_chair',
  'picnic_bench', 'garden_bench', 'hammock_chair', 'sectional_sofa', 'loveseat', 'vanity_stool',
  'rocket_chair', 'throne_chair', 'cafe_chair', 'beach_chair', 'sled',
  'mushroom_stool', 'hay_bale', 'wheelchair', 'dentist_chair', 'bumper_car',
]);
const LIE_DOWN = new Set([
  'bed_pink', 'bed_bunk', 'bed_cloud', 'bed_princess', 'bunk_ladder', 'hammock', 'tent_play',
  'crib', 'murphy_bed', 'daybed', 'futon', 'bunk_triple', 'canopy_bed',
  'space_pod_bed', 'sleeping_bag', 'camping_tent', 'circus_tent', 'hospital_bed',
  'submarine_furniture',
  'igloo_furniture', 'oasis_tent',
]);
const STAND_NEARBY = new Set([
  'desk_wood', 'desk_white', 'desk_gaming', 'mirror', 'vanity', 'table_round', 'table_square',
  'kitchen_set', 'bathtub', 'piano', 'guitar', 'computer', 'gamepad', 'speaker', 'cabinet_tv',
  'telescope', 'aquarium', 'globe',
  'pet_cat', 'pet_dog', 'pet_rabbit', 'pet_hamster', 'pet_bird', 'pet_fish', 'pet_turtle', 'pet_unicorn',
  'starter_shelf', 'shelf_books', 'bookcase_tall', 'shelf_toy', 'wardrobe', 'wardrobe_pink',
  'starter_plant', 'plant_pot', 'plant_big', 'plant_flower', 'plant_cactus',
  'starter_lamp', 'lamp_floor', 'lamp_star', 'lamp_moon', 'garland_lights',
  'clock_wall', 'picture_frame', 'candle', 'camera', 'basketball', 'skateboard', 'cupcake_deco',
  'toy_robot', 'toy_car', 'toy_dino', 'toy_unicorn', 'toy_bear', 'toy_blocks', 'toy_yoyo',
  'trophy', 'medal', 'balloons', 'headphones',
  'table_dining', 'dresser', 'sink_bathroom', 'toilet', 'shower_stall', 'picnic_table',
  'hot_tub', 'changing_table', 'mobile_hanging', 'fan_ceiling', 'curtain_set', 'shelf_display',
  'piggy_bank', 'alarm_clock', 'star_projector', 'bubble_machine', 'easel_paint', 'xylophone',
  'drum_set', 'beach_ball', 'slide_indoor',
  'pet_fox', 'pet_penguin', 'pet_panda', 'pet_hedgehog',
  'coffee_table', 'side_table', 'corner_desk', 'standing_desk', 'ladder_shelf', 'cat_tree',
  'fish_tank_stand', 'shoe_rack', 'coat_rack', 'laundry_basket', 'arcade_cabinet', 'jukebox',
  'mini_fridge', 'wine_rack', 'bar_cart', 'tv_stand_large', 'room_divider',
  'tapestry', 'dreamcatcher', 'wall_art_abstract', 'wall_art_landscape', 'string_lights',
  'neon_sign', 'disco_ball', 'lava_lamp', 'snow_globe', 'terrarium', 'bonsai', 'succulent',
  'herb_garden', 'wind_chime', 'birdhouse', 'gnome_statue', 'fountain_mini', 'christmas_tree',
  'pumpkin_deco', 'easter_eggs', 'halloween_ghost', 'snowman_deco', 'firework_deco', 'kite_deco',
  'toaster', 'blender', 'coffee_maker', 'fruit_bowl', 'cookie_jar', 'spice_rack', 'pencil_case',
  'backpack_deco', 'towel_set', 'soap_dispenser', 'bath_toys', 'lamp_cloud', 'lamp_rocket',
  'lamp_flower', 'telescope_gold', 'chess_set', 'puzzle_box', 'jewelry_box',
  'pet_owl', 'pet_koala', 'pet_sloth', 'pet_dolphin', 'pet_horse', 'pet_sheep', 'pet_chicken',
  'pet_duck', 'pet_chameleon', 'pet_squirrel',
  'castle_tower_shelf', 'treasure_chest', 'cafe_table', 'keyboard_synth', 'locker',
  'desk_lamp_school', 'soccer_goal', 'basketball_hoop', 'wheelbarrow', 'blackboard', 'bookend',
  'astronaut_helmet_deco', 'alien_plant', 'planet_mobile', 'star_map', 'spaceship_toy', 'ufo_lamp',
  'knight_armor_deco', 'shield_deco', 'sword_deco', 'dragon_toy', 'crown_stand',
  'campfire_deco', 'lantern_camping', 'fishing_rod', 'compass_deco', 'binoculars',
  'menu_board', 'coffee_cup_deco', 'donut_deco', 'sandwich_deco', 'milkshake_deco',
  'microphone_stand', 'tambourine', 'maracas', 'harmonica',
  'tennis_racket', 'baseball_bat', 'dumbbell', 'jump_rope', 'trophy_shelf',
  'globe_stand', 'world_map', 'watering_can', 'flower_pot_large',
  'snowflake_deco', 'holiday_wreath', 'gift_boxes', 'beach_umbrella', 'surfboard', 'seashell_collection',
  'pet_llama', 'pet_flamingo', 'pet_peacock', 'pet_raccoon', 'pet_otter', 'pet_seal',
  'fairy_house', 'barn_deco', 'carousel_deco', 'ferris_wheel_deco', 'lighthouse_deco',
  'dino_egg_deco', 'volcano_deco', 'fossil_deco', 'dino_bone_deco', 'pteranodon_toy',
  'triceratops_toy', 'trex_toy', 'prehistoric_plant', 'amber_deco',
  'tablet_deco', 'vr_headset', 'drone_toy', 'robot_arm_deco', 'circuit_board_deco', 'gear_deco',
  'laser_toy', 'hologram_deco',
  'toadstool_deco', 'fairy_wings_deco', 'magic_wand_deco', 'potion_bottle', 'spellbook_deco', 'glowing_mushroom',
  'scarecrow_deco', 'farm_fence', 'silo_deco', 'milk_bucket', 'egg_basket', 'corn_deco', 'pumpkin_patch',
  'coral_deco', 'treasure_map', 'pearl_deco', 'anchor_deco', 'ship_wheel', 'mermaid_tail_deco',
  'bubble_deco', 'wave_deco',
  'paint_palette', 'paintbrush_deco', 'sculpture_deco', 'clay_deco', 'watercolor_deco', 'sketchpad_deco',
  'oven_deco', 'rolling_pin', 'cupcake_stand', 'pie_deco', 'whisk_deco', 'mixing_bowl',
  'popcorn_stand', 'balloon_arch', 'clown_deco', 'juggling_balls', 'unicycle_deco',
  'pet_hippo', 'pet_zebra', 'pet_kangaroo', 'pet_polar_bear', 'pet_toucan', 'pet_ostrich',
  'ice_rink', 'winter_cabin', 'pool_deco', 'diving_board', 'concert_stage', 'dj_booth',
  'garden_shed', 'planetarium_dome',
  'stethoscope_deco', 'bandage_deco', 'medicine_bottle', 'first_aid_kit', 'syringe_toy',
  'eye_chart', 'x_ray_deco', 'microscope_deco', 'test_tube_deco', 'beaker_deco',
  'periodic_table_deco', 'magnet_deco', 'robot_kit_deco',
  'ski_deco', 'snowboard_deco', 'hockey_puck', 'ski_poles', 'hot_cocoa_deco',
  'suitcase_deco', 'passport_deco', 'airplane_ticket', 'eiffel_tower_deco', 'pyramid_deco', 'postcard_deco',
  'joystick_deco', 'controller_deco', 'game_trophy_deco',
  'shovel_deco', 'rake_deco', 'seed_packet', 'garden_hose',
  'inflatable_ring', 'life_ring', 'pool_noodle', 'sunscreen_deco',
  'spotlight_deco', 'dj_turntable', 'amplifier_deco', 'band_poster', 'drum_sticks',
  'pet_giraffe', 'pet_alpaca', 'pet_lemur', 'pet_meerkat', 'pet_wolf', 'pet_deer',
  'hero_command_center', 'photo_backdrop', 'vending_machine', 'gumball_machine',
  'camera_tripod_stand', 'toy_store_shelf', 'snow_fort', 'desert_oasis_pool',
  'cape_stand', 'hero_mask_display', 'comic_book_stack', 'superhero_logo_deco',
  'utility_belt_deco', 'power_ring_deco',
  'tripod_deco', 'flash_light_photo', 'photo_album', 'film_roll_deco', 'polaroid_deco', 'camera_lens_deco',
  'toy_train_deco', 'spinning_top_deco', 'jack_in_box', 'marble_deco', 'dice_deco', 'domino_deco',
  'rubber_duck_deco',
  'weather_vane', 'thermometer_outdoor', 'umbrella_stand', 'rain_gauge', 'cloud_deco', 'lightning_deco',
  'igloo_deco', 'ice_sculpture_deco', 'snow_shovel', 'arctic_flag', 'penguin_statue', 'icicle_deco',
  'oasis_deco', 'sand_dune_deco', 'camel_saddle', 'desert_lantern', 'cactus_flower_deco',
  'pet_reindeer', 'pet_arctic_fox', 'pet_walrus', 'pet_seahorse', 'pet_bat',
  'watchtower', 'cotton_candy_stand', 'ticket_booth', 'mineral_display_case', 'drawbridge', 'lifeguard_tower',
  'periscope_deco', 'deep_sea_light', 'angler_fish_deco', 'sea_cave_deco', 'sonar_deco', 'oxygen_tank_deco',
  'catapult_deco', 'castle_wall_deco', 'banner_medieval_deco', 'moat_deco', 'knight_horse_deco', 'jousting_lance',
  'roller_coaster_deco', 'ring_toss_game', 'prize_wall_deco', 'carnival_lights', 'funnel_cake_deco', 'balloon_dart_deco',
  'gem_collection_deco', 'crystal_deco', 'geode_deco', 'rock_polisher', 'fossil_rock_deco',
  'bubble_wand_deco', 'sidewalk_chalk', 'hopscotch_deco', 'pinwheel_deco', 'sandbox_deco',
  'water_gun_deco', 'frisbee_deco', 'board_game_box', 'playing_cards_deco', 'magic_trick_deco',
  'kaleidoscope_deco', 'slinky_deco',
  'pet_octopus', 'pet_crab', 'pet_stingray', 'pet_orca', 'pet_seagull',
]);
// Rugs -- the avatar steps onto the middle of these rather than beside them.
const STAND_ON = new Set([
  'starter_rug', 'rug_bear', 'rug_rainbow', 'rug_star', 'rug_heart', 'rug_dino',
  'rug_zebra', 'rug_polka', 'rug_geometric', 'yoga_mat',
  'dino_footprint_rug', 'fairy_ring_rug',
]);
const interactionTypeFor = (itemId) => {
  if (SEATS.has(itemId)) return 'sit';
  if (LIE_DOWN.has(itemId)) return 'lie';
  if (STAND_ON.has(itemId)) return 'on';
  if (STAND_NEARBY.has(itemId)) return 'nearby';
  return null;
};

// Hairstyles extracted from the character art (see scripts run for this feature) --
// each hair PNG and each bald-base PNG share the same 1024x1024 framing as the
// original character images, so any hairstyle overlays correctly on any base.
const HAIRSTYLES = [
  { id: 'none', name: '민머리', icon: null },
  { id: 'hair_girl', name: '양갈래 머리', icon: '/assets/hair/hair_girl.png' },
  { id: 'hair_mom', name: '단발머리', icon: '/assets/hair/hair_mom.png' },
  { id: 'hair_dad', name: '짧은 머리', icon: '/assets/hair/hair_dad.png' },
];

// Each character's own natural hairstyle, used as the default when picked.
const DEFAULT_HAIR = {
  char_boy: 'none',
  char_girl: 'hair_girl',
  char_mom: 'hair_mom',
  char_dad: 'hair_dad',
  char_baby: 'none',
};

// Outfits extracted the same way as hairstyles -- each shares the same
// 1024x1024 framing, so any outfit overlays correctly on any character's bare base.
const OUTFITS = [
  { id: 'outfit_girl', name: '원피스', icon: '/assets/outfits/outfit_girl.png' },
  { id: 'outfit_boy', name: '레인보우 후드티', icon: '/assets/outfits/outfit_boy.png' },
  { id: 'outfit_mom', name: '멜빵바지', icon: '/assets/outfits/outfit_mom.png' },
  { id: 'outfit_dad', name: '셔츠와 바지', icon: '/assets/outfits/outfit_dad.png' },
  { id: 'outfit_baby', name: '오리 잠옷', icon: '/assets/outfits/outfit_baby.png' },
];

// Bare (no hair, no outfit) version of each character -- the base every
// avatar renders from, with the chosen outfit and hairstyle layered on top.
const BARE_BASE = {
  char_boy: '/assets/outfits/bare_boy.png',
  char_girl: '/assets/outfits/bare_girl.png',
  char_mom: '/assets/outfits/bare_mom.png',
  char_dad: '/assets/outfits/bare_dad.png',
  char_baby: '/assets/outfits/bare_baby.png',
};

// Each character's own natural outfit, used as the default when picked.
const DEFAULT_OUTFIT = {
  char_boy: 'outfit_boy',
  char_girl: 'outfit_girl',
  char_mom: 'outfit_mom',
  char_dad: 'outfit_dad',
  char_baby: 'outfit_baby',
};

// Visual pattern for each wallpaper, layered on top of its base color from the
// server catalog. Client-side only (the server just knows id/name/price/color).
const WALLPAPER_PATTERN = {
  wall_pink: 'dot',
  wall_blue: 'stripe',
  wall_green: 'dot',
  wall_wood: 'plank',
  wall_sunset: 'stripe',
  wall_purple: 'dot',
  wall_mint: 'stripe',
  wall_candy: 'dot',
  wall_ocean: 'stripe',
  wall_flower: 'dot',
  wall_rainbow: 'stripe',
  wall_star: 'star',
  wall_space: 'star',
  wall_galaxy: 'star',
  wall_christmas: 'dot',
  wall_halloween: 'dot',
  wall_polka: 'dot',
  wall_forest: 'dot',
  wall_stripe_blue: 'stripe',
  wall_stripe_pink: 'stripe',
  wall_beach: 'stripe',
  wall_castle: 'plank',
  wall_camping: 'plank',
  wall_underwater: 'stripe',
  wall_school: 'dot',
  wall_farm: 'plank',
  wall_jungle: 'dot',
  wall_dinosaur: 'dot',
  wall_robot: 'stripe',
  wall_fairy: 'dot',
  wall_hospital: 'dot',
  wall_winter: 'stripe',
  wall_concert: 'star',
  wall_lab: 'plank',
  wall_superhero: 'dot',
  wall_photography: 'stripe',
  wall_arctic: 'star',
  wall_desert: 'stripe',
  wall_deepsea: 'stripe',
  wall_medieval: 'plank',
  wall_carnival: 'dot',
  wall_cave: 'plank',
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
  const lastDragXYRef = useRef(null);
  const placedItemsRef = useRef([]);
  const interactingWithRef = useRef(null);

  const [gold, setGold] = useState(0);
  const [catalog, setCatalog] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [placedItems, setPlacedItems] = useState([]);
  const [wallpaperId, setWallpaperId] = useState(null);
  const [avatarId, setAvatarId] = useState(null);
  const [avatarPos, setAvatarPos] = useState(null); // { x, y } in room coordinates, like placedItems
  const [interactingWith, setInteractingWith] = useState(null); // { id, type: 'sit'|'lie'|'nearby' } | null
  const [hairId, setHairId] = useState(null);
  const [outfitId, setOutfitId] = useState(null);
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

  // A subtle tone-on-tone pattern (dots/stripes/planks) layered over the flat
  // wallpaper color so the wall reads as papered/paneled instead of painted.
  const wallPatternStyle = useMemo(() => {
    const pattern = WALLPAPER_PATTERN[wallpaperId];
    const accent = 'rgba(255,255,255,0.4)';
    if (pattern === 'dot') {
      return { backgroundImage: `radial-gradient(${accent} 15%, transparent 16%)`, backgroundSize: '28px 28px' };
    }
    if (pattern === 'stripe') {
      return { backgroundImage: `repeating-linear-gradient(45deg, ${accent} 0px, ${accent} 10px, transparent 10px, transparent 32px)` };
    }
    if (pattern === 'plank') {
      return { backgroundImage: 'repeating-linear-gradient(90deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 3px, transparent 3px, transparent 70px)' };
    }
    if (pattern === 'star') {
      return {
        backgroundImage: `
          radial-gradient(1.5px 1.5px at 20% 30%, rgba(255,255,255,0.9) 50%, transparent 51%),
          radial-gradient(1px 1px at 60% 70%, rgba(255,255,255,0.7) 50%, transparent 51%),
          radial-gradient(1.5px 1.5px at 80% 20%, rgba(255,255,255,0.85) 50%, transparent 51%),
          radial-gradient(1px 1px at 35% 85%, rgba(255,255,255,0.6) 50%, transparent 51%),
          radial-gradient(1px 1px at 90% 60%, rgba(255,255,255,0.75) 50%, transparent 51%)
        `,
        backgroundSize: '120px 120px',
      };
    }
    return {};
  }, [wallpaperId]);

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
      outfitId,
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
        if (typeof parsed?.outfitId === 'string') setOutfitId(parsed.outfitId);
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

  // Default to that character's own natural outfit until the kid picks a different one.
  useEffect(() => {
    if (!avatarId || outfitId) return;
    setOutfitId(DEFAULT_OUTFIT[avatarId] || 'outfit_boy');
  }, [avatarId, outfitId]);

  useEffect(() => {
    placedItemsRef.current = placedItems;
  }, [placedItems]);

  useEffect(() => {
    interactingWithRef.current = interactingWith;
  }, [interactingWith]);

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

      lastDragXYRef.current = { x, y };
      if (draggingPlaced.id === 'avatar') {
        setAvatarPos({ x, y });
      } else {
        setPlacedItems((prev) => prev.map((p) => (p.id === draggingPlaced.id ? { ...p, x, y } : p)));
      }
    };

    const handleUp = () => {
      if (draggingPlaced.id === 'avatar') {
        if (!dragMovedRef.current) {
          // A tap (not a drag): stand up if seated/lying, otherwise just react.
          // Tapping is the reliable touch gesture here -- dblclick is awkward
          // on mobile and often gets eaten by the browser's zoom handling.
          if (interactingWithRef.current) {
            standUp();
          } else {
            triggerAvatarReaction();
          }
        } else {
          snapAvatarToNearbyInteractable(lastDragXYRef.current);
        }
      } else if (!dragMovedRef.current) {
        triggerItemReaction(draggingPlaced.id);
      }
      setDraggingPlaced(null);
    };

    // If the browser cancels the gesture mid-drag, drop the drag state so the
    // sprite doesn't get stuck following a pointer that no longer reports.
    const handleCancel = () => setDraggingPlaced(null);

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleCancel);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleCancel);
    };
  }, [draggingPlaced]);

  // If the avatar was dropped close to an interactive item, snap onto/next to
  // it (sit/lie/stand depending on the item) until stood back up. Otherwise
  // just clear any previous interaction -- it moved away under its own steam.
  const snapAvatarToNearbyInteractable = (pos) => {
    if (!pos) return;
    const AVATAR_SIZE = 140; // matches the rendered ~w-32/w-40 avatar
    const SNAP_RADIUS = 90;
    const avatarCenterX = pos.x + AVATAR_SIZE / 2;
    const avatarCenterY = pos.y + AVATAR_SIZE / 2;

    let best = null;
    let bestDist = Infinity;
    for (const p of placedItemsRef.current) {
      const type = interactionTypeFor(p.itemId);
      if (!type) continue;
      const size = itemSizePx(p.itemId);
      const dist = Math.hypot((p.x + size / 2) - avatarCenterX, (p.y + size / 2) - avatarCenterY);
      if (dist < bestDist) { bestDist = dist; best = { p, size, type }; }
    }

    if (!best || bestDist >= SNAP_RADIUS) {
      setInteractingWith(null);
      return;
    }

    const { p, size, type } = best;
    let x, y;
    if (type === 'sit') {
      x = p.x + size / 2 - AVATAR_SIZE / 2;
      y = p.y - AVATAR_SIZE * 0.3;
    } else if (type === 'lie') {
      x = p.x + size / 2 - AVATAR_SIZE / 2;
      y = p.y + size / 2 - AVATAR_SIZE / 2;
    } else if (type === 'on') {
      x = p.x + size / 2 - AVATAR_SIZE / 2;
      y = p.y + size / 2 - AVATAR_SIZE / 2;
    } else {
      // 'nearby': stand just to the side, flipping to the left if there's no
      // room to the right so the avatar never lands off-screen.
      const room = roomRef.current;
      const roomWidth = room ? room.getBoundingClientRect().width : 1200;
      const toRight = p.x + size + 8 + AVATAR_SIZE <= roomWidth;
      x = toRight ? p.x + size + 8 : Math.max(0, p.x - AVATAR_SIZE - 8);
      y = p.y + size / 2 - AVATAR_SIZE / 2;
    }

    setAvatarPos({ x, y });
    setInteractingWith({ id: p.id, type });
    triggerItemReaction(p.id);
    soundManager.playSFX(SOUNDS.SFX_CLICK);
  };

  // Reads the ref rather than state so it stays correct when called from the
  // drag effect, whose closure can hold a stale `interactingWith`.
  const standUp = () => {
    if (!interactingWithRef.current) return;
    interactingWithRef.current = null;
    setInteractingWith(null);
    triggerAvatarReaction();
  };

  const saveLayout = () => {
    persistLayout();
  };

  const selectAvatar = (id) => {
    const newHairId = DEFAULT_HAIR[id] || 'none';
    const newOutfitId = DEFAULT_OUTFIT[id] || 'outfit_boy';
    setAvatarId(id);
    setHairId(newHairId);
    setOutfitId(newOutfitId);
    setShowAvatarPicker(false);
    persistLayout({ avatarId: id, hairId: newHairId, outfitId: newOutfitId });
  };

  const selectHair = (id) => {
    setHairId(id);
    persistLayout({ hairId: id });
  };

  const selectOutfit = (id) => {
    setOutfitId(id);
    persistLayout({ outfitId: id });
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
          {/* Tone-on-tone wallpaper pattern */}
          <div className="absolute inset-0 pointer-events-none" style={wallPatternStyle} />

          {/* Window with curtains */}
          <div className="absolute top-6 right-8 flex items-start pointer-events-none">
            <div
              className="w-4 h-24 rounded-t-full -mr-1 mt-1 shadow-sm"
              style={{ background: 'repeating-linear-gradient(90deg, #F48FB1 0px, #F48FB1 4px, #F06292 4px, #F06292 8px)' }}
            />
            <div className="w-28 h-20 rounded-2xl bg-gradient-to-b from-sky-200 to-sky-100 border-4 border-white/80 shadow-inner overflow-hidden relative">
              <div className="absolute w-10 h-6 bg-white/90 rounded-full top-3 left-2 animate-float-cloud-slow" />
              <div className="absolute w-8 h-5 bg-white/80 rounded-full top-8 left-10 animate-float-cloud-fast" />
              <div className="absolute inset-y-0 left-1/2 w-[3px] bg-white/70" />
              <div className="absolute inset-x-0 top-1/2 h-[3px] bg-white/70" />
            </div>
            <div
              className="w-4 h-24 rounded-t-full -ml-1 mt-1 shadow-sm"
              style={{ background: 'repeating-linear-gradient(90deg, #F48FB1 0px, #F48FB1 4px, #F06292 4px, #F06292 8px)' }}
            />
          </div>

          {/* Ambient sparkles */}
          <Sparkles className="absolute top-10 left-10 text-yellow-200/70 w-6 h-6 animate-float-cloud-slow pointer-events-none" />
          <Sparkles className="absolute top-24 left-1/3 text-white/60 w-5 h-5 animate-float-cloud-fast pointer-events-none" />
        </div>

        {/* Baseboard trim between wall and floor */}
        <div
          className="absolute inset-x-0"
          style={{
            top: '72%',
            height: 14,
            transform: 'translateY(-100%)',
            background: 'linear-gradient(180deg, #FFFDF8 0%, #F0E9DC 70%, #D8CBB0 100%)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
          }}
        />

        {/* Floor */}
        <div
          className="absolute inset-x-0 bottom-0"
          style={{
            height: '28%',
            backgroundColor: '#D8B98A',
            backgroundImage:
              'linear-gradient(180deg, rgba(255,255,255,0.15), rgba(0,0,0,0.08)), repeating-linear-gradient(90deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 2px, transparent 2px, transparent 56px), repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent 120px)',
          }}
        />

        {/* Avatar (draggable, like placed items) */}
        {avatarItem && avatarPos && (
          <div className="absolute z-10 select-none" style={{ left: avatarPos.x, top: avatarPos.y }}>
            <div className="relative flex flex-col items-center">
              <div
                onPointerDown={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  dragMovedRef.current = false;
                  // Keep receiving moves even once the finger leaves the sprite.
                  try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
                  setDraggingPlaced({
                    id: 'avatar',
                    offsetX: e.clientX - rect.left,
                    offsetY: e.clientY - rect.top,
                    startX: e.clientX,
                    startY: e.clientY,
                  });
                }}
                onDoubleClick={standUp}
                className="cursor-grab active:cursor-grabbing relative w-32 h-32 sm:w-40 sm:h-40 transition-transform"
                style={{
                  // touch-action:none stops mobile browsers from claiming the
                  // drag as a page scroll (which cut movement off after a few px).
                  touchAction: 'none',
                  filter: 'drop-shadow(0 10px 8px rgba(0,0,0,0.25))',
                  transform:
                    interactingWith?.type === 'sit' ? 'scale(0.85)'
                    : interactingWith?.type === 'lie' ? 'rotate(-90deg) scale(0.75)'
                    : 'scale(1)',
                }}
              >
                <img
                  src={BARE_BASE[avatarId] || avatarItem.icon}
                  alt={avatarItem.name}
                  className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
                  draggable={false}
                />
                {outfitId && (
                  <img
                    src={OUTFITS.find((o) => o.id === outfitId)?.icon}
                    alt=""
                    className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
                    draggable={false}
                  />
                )}
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
              style={{ left: p.x, top: p.y, touchAction: 'none' }}
              onPointerDown={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                dragMovedRef.current = false;
                try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
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
                    <img
                      src={item.icon}
                      alt={item.name}
                      className="object-contain pointer-events-none mix-blend-multiply"
                      style={{ width: itemSizePx(item.id), height: itemSizePx(item.id) }}
                    />
                  ) : (
                    <span className="pointer-events-none" style={{ fontSize: itemSizePx(item.id) * 0.65, lineHeight: 1 }}>
                      {item.icon}
                    </span>
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

            <p className="text-sm font-extrabold text-gray-700 mb-2">옷</p>
            <div className="grid grid-cols-4 gap-3 mb-5">
              {OUTFITS.map((o) => {
                const isSelected = outfitId === o.id;
                return (
                  <button
                    key={o.id}
                    onClick={() => selectOutfit(o.id)}
                    className={`rounded-2xl border-2 p-2 flex flex-col items-center gap-1 hover:bg-orange-50 transition-colors ${isSelected ? 'border-orange-400 bg-orange-50' : 'border-gray-100'}`}
                  >
                    <img src={o.icon} alt={o.name} className="w-12 h-12 object-contain" />
                    <div className="font-bold text-gray-800 text-[10px] text-center">{o.name}</div>
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
