require('dotenv').config({ override: true });
const { db } = require('./database');

const KOREAN_WORDS = [
    '사과', '바나나', '포도', '수박', '딸기', '오렌지', '참외', '복숭아', '배', '감', '귤', '자두', '체리', '망고', '파인애플',
    '자동차', '비행기', '기차', '자전거', '버스', '트럭', '오토바이', '헬리콥터', '지하철', '보트',
    '학교', '친구', '선생님', '책', '연필', '지우개', '가방', '책상', '의자', '칠판', '공책', '크레파스', '가위', '풀',
    '가족', '엄마', '아빠', '동생', '형', '누나', '언니', '오빠', '할머니', '할아버지', '삼촌', '이모', '고모',
    '강아지', '고양이', '토끼', '코끼리', '나비', '잠자리', '호랑이', '사자', '여우', '곰', '다람쥐', '사슴', '얼룩말', '기린', '원숭이', '판다', '부엉이', '독수리', '펭귄', '돌고래',
    '꽃', '나무', '구름', '바다', '산', '하늘', '무지개', '눈사람', '태양', '달', '별', '바람', '비', '눈', '강', '호수', '숲', '폭포',
    '우산', '모자', '신발', '창문', '문', '시계', '컵', '접시', '숟가락', '젓가락', '그릇', '냄비', '프라이팬',
    '김치', '밥', '국', '라면', '빵', '우유', '계란', '치즈', '피자', '햄버거', '초콜릿', '사탕', '아이스크림', '케이크', '과자',
    '코', '입', '귀', '손', '발', '머리', '어깨', '무릎', '팔', '다리', '등',
    '빨강', '주황', '노랑', '초록', '파랑', '남색', '보라', '하양', '검정', '분홍',
    '봄', '여름', '가을', '겨울', '맑음', '흐림', '태풍',
    '의사', '경찰관', '소방관', '요리사', '가수', '화가', '농부', '어부', '우체부',
    '병원', '도서관', '놀이터', '공원', '시장', '백화점', '은행', '우체국', '교회',
    '원', '삼각형', '사각형', '축구', '야구', '농구', '수영', '태권도', '발레', '체조',
    '피아노', '기타', '바이올린', '드럼', '리코더', '하모니카',
    '수학', '국어', '영어', '과학', '음악', '미술', '체육',
    '블록', '인형', '팽이', '요요', '텔레비전', '냉장고', '세탁기', '청소기', '전자레인지', '에어컨',
    '간호사', '변호사', '판사', '기자', '배우',
    '개미', '벌', '매미', '메뚜기', '무당벌레', '사마귀', '파리', '모기',
    '문어', '상어', '고래', '게', '새우', '불가사리', '해파리',
    '눈싸움', '수영장', '단풍', '소풍', '캠핑',
    '연', '태극기', '지도', '나침반', '열쇠', '자물쇠', '편지', '소포', '우표',
    '우주선', '로켓', '지구', '태양계', '행성', '위성', '우주비행사', '운석',
    '당근', '오이', '양파', '감자', '고구마', '배추', '무', '브로콜리', '양배추', '옥수수',
    '첼로', '트럼펫', '색소폰',
    '배구', '골프', '스키', '스케이트', '볼링', '양궁',
    '기쁨', '슬픔', '화남', '무서움', '놀람', '부끄러움',
    '아침', '점심', '저녁', '밤', '새벽',
    '거실', '침실', '부엌', '화장실', '마당', '지붕', '계단',
    '한국', '미국', '일본', '중국', '프랑스', '영국',
    '지렁이', '달팽이', '반딧불이',
    '낙타', '코뿔소', '두더지',
    '청진기', '붕대', '체온계', '주사기', '여행가방', '여권', '호텔', '조이스틱',
    '콘서트', '무대', '마이크', '스피커', '온도계',
    '뛰기', '걷기', '앉기', '서기', '눕기', '웃음', '울음',
    '꿈', '그림자', '메아리', '노을', '이슬', '서리', '우박',
];

const KOREAN_PROVERBS = [
    { q: '가는 말이 고와야 OOO OO 곱다.', a: '오는 말이' },
    { q: '티끌 모아 OO.', a: '태산' },
    { q: '누워서 O 먹기.', a: '떡' },
    { q: '등잔 밑이 OOO.', a: '어둡다' },
    { q: '원숭이도 나무에서 OOOOO.', a: '떨어진다' },
    { q: '백지장도 맞들면 OO.', a: '낫다' },
    { q: '우물 안 OOOO.', a: '개구리' },
    { q: '세 살 버릇 OOOOO 간다.', a: '여든까지' },
    { q: '소 잃고 OOOO 고친다.', a: '외양간' },
    { q: '발 없는 말이 천 리 OO.', a: '간다' },
    { q: '하늘의 OO 따기.', a: '별' },
    { q: '낮말은 OO 듣고 밤말은 쥐가 듣는다.', a: '새가' },
    { q: '개천에서 OO 난다.', a: '용' },
    { q: '꿩 대신 OO.', a: '닭' },
    { q: '그림의 OO.', a: '떡' },
    { q: '배보다 OOO 더 크다.', a: '배꼽이' },
    { q: '백문이 OOOOO.', a: '불여일견' },
    { q: '콩 심은 데 OO 나고 팥 심은 데 팥 난다.', a: '콩' },
    { q: '서당개 삼년이면 OOO 읊는다.', a: '풍월을' },
    { q: '걱정도 OO.', a: '팔자' },
    { q: '작은 고추가 더 OO.', a: '맵다' },
    { q: '벼는 익을수록 OOOO OOOO.', a: '고개를 숙인다' },
    { q: '돌다리도 두들겨 보고 OOOO.', a: '건너라' },
    { q: '열 번 찍어 안 넘어가는 나무 OOO.', a: '없다' },
    { q: '호랑이도 제 말 하면 OOOO.', a: '온다' },
    { q: '산 넘어 OO.', a: '산' },
    { q: '고생 끝에 OO 온다.', a: '낙' },
    { q: '시작이 OOOO.', a: '반이다' },
    { q: '급할수록 OO OO 가라.', a: '돌아' },
    { q: '아는 길도 물어 OOO.', a: '가라' },
    { q: '병 주고 OO 준다.', a: '약' },
    { q: '빈 수레가 OO 요란하다.', a: '더' },
    { q: '매도 먼저 맞는 놈이 OO.', a: '낫다' },
    { q: '남의 떡이 더 OO 보인다.', a: '커' },
    { q: '입에 쓴 약이 몸에 OO.', a: '좋다' },
    { q: '첫술에 OOOO.', a: '배부르랴' },
    { q: '쥐구멍에도 볕 들 OO 있다.', a: '날' },
    { q: '하나를 보면 OOO 안다.', a: '열을' },
    { q: '되로 주고 OO 받는다.', a: '말로' },
    { q: '가재는 게 OO.', a: '편' },
    { q: '물에 빠지면 지푸라기라도 OOOO.', a: '잡는다' },
    { q: '우물을 파도 한 우물을 OOO.', a: '파라' },
    { q: '지렁이도 밟으면 OOOOO.', a: '꿈틀한다' },
    { q: '못된 송아지 엉덩이에 OO 난다.', a: '뿔' },
    { q: '열 손가락 깨물어 안 아픈 손가락이 OO.', a: '없다' },
    { q: '공든 탑이 OOOOO.', a: '무너지랴' },
    { q: '사공이 많으면 배가 OOO 간다.', a: '산으로' },
    { q: '낫 놓고 기역자도 OOOO.', a: '모른다' },
    { q: '마른 하늘에 OO 벼락.', a: '날벼락' },
    { q: '미운 놈 떡 하나 더 OO.', a: '준다' },
    { q: '밑 빠진 독에 물 OO.', a: '붓기' },
    { q: '수박 겉 OOOO.', a: '핥기' },
    { q: '개똥도 약에 쓰려면 OO.', a: '없다' },
    { q: '언 발에 OO 누기.', a: '오줌' },
    { q: '우물에 가 숭늉 OOO.', a: '찾는다' },
    { q: '소도 언덕이 있어야 OOOO.', a: '비빈다' },
    { q: '굼벵이도 구르는 재주가 OO.', a: '있다' },
    { q: '될성부른 나무는 떡잎부터 OOO.', a: '알아본다' },
    { q: '참새가 방앗간을 그저 OOO.', a: '지나랴' },
    { q: '가랑비에 옷 OO.', a: '젖는다' },
    { q: '서투른 목수가 연장 OO.', a: '탓한다' },
    { q: '세월이 OO.', a: '약이다' },
    { q: '손바닥으로 하늘을 OO.', a: '가리다' },
    { q: '개구리 올챙이 적 OOOOO.', a: '생각 못한다' },
    { q: '하룻강아지 범 무서운 줄 OOOO.', a: '모른다' },
    { q: '원수는 외나무다리에서 OOOO.', a: '만난다' },
    { q: '고양이 목에 방울 OOO.', a: '달기' },
    { q: '우는 아이 젖 OO 준다.', a: '더' },
    { q: '종로에서 뺨 맞고 한강에서 눈 OOO.', a: '흘긴다' },
    { q: '바늘 도둑이 소 OOO 된다.', a: '도둑' },
    { q: '짚신도 제 OO 있다.', a: '짝' },
    { q: '죽 쒀서 개 OO.', a: '준다' },
    { q: '꼬리가 길면 OOOO.', a: '밟힌다' },
    { q: '열 길 물속은 알아도 사람 속은 OOOO.', a: '모른다' },
    { q: '소 뒷걸음질 치다 쥐 OOO.', a: '잡는다' },
    { q: '미꾸라지 한 마리가 온 웅덩이를 OOOO.', a: '흐린다' },
    { q: '하나만 알고 둘은 OOOO.', a: '모른다' },
    { q: '벙어리 냉가슴 OOOO.', a: '앓는다' },
    { q: '고래 싸움에 새우 등 OOOO.', a: '터진다' },
    { q: '밥 먹을 때는 개도 안 OOOO.', a: '때린다' },
    { q: '곳간에서 인심 OOOO.', a: '난다' },
    { q: '개똥밭에 굴러도 이승이 OOOO.', a: '좋다' },
    { q: '아니 땐 굴뚝에 연기 OOOO.', a: '날까' },
    { q: '말이 씨가 OOOO.', a: '된다' },
    { q: '등치고 간 OOOO.', a: '빼먹는다' },
    { q: '뛰는 놈 위에 나는 OO 있다.', a: '놈' },
    { q: '첫 단추를 잘못 OOOO.', a: '끼우다' },
    { q: '어물전 망신은 꼴뚜기가 OOOO.', a: '시킨다' },
    { q: '눈 가리고 아웅 OOOO.', a: '한다' },
    { q: '자라 보고 놀란 가슴 솥뚜껑 보고도 OOOO.', a: '놀란다' },
    { q: '열 사람이 지켜도 도둑 하나를 못 OOOO.', a: '막는다' },
    { q: '입은 삐뚤어져도 말은 바로 OOOO.', a: '해라' },
];

const ENGLISH_VOCAB = [
    { w: 'Apple', m: '사과' }, { w: 'Cat', m: '고양이' }, { w: 'Dog', m: '개' }, { w: 'Book', m: '책' },
    { w: 'Ball', m: '공' }, { w: 'Cup', m: '컵' }, { w: 'Desk', m: '책상' }, { w: 'Chair', m: '의자' },
    { w: 'Door', m: '문' }, { w: 'Window', m: '창문' }, { w: 'Sun', m: '해' }, { w: 'Moon', m: '달' },
    { w: 'Star', m: '별' }, { w: 'Tree', m: '나무' }, { w: 'Flower', m: '꽃' }, { w: 'Fish', m: '물고기' },
    { w: 'Bird', m: '새' }, { w: 'Rabbit', m: '토끼' }, { w: 'Bear', m: '곰' }, { w: 'Lion', m: '사자' },
    { w: 'Milk', m: '우유' }, { w: 'Water', m: '물' }, { w: 'Bread', m: '빵' }, { w: 'Egg', m: '계란' },
    { w: 'House', m: '집' }, { w: 'School', m: '학교' }, { w: 'Car', m: '자동차' }, { w: 'Bus', m: '버스' },
    { w: 'Train', m: '기차' }, { w: 'Family', m: '가족' }, { w: 'Friend', m: '친구' }, { w: 'Teacher', m: '선생님' },
    { w: 'Mother', m: '엄마' }, { w: 'Father', m: '아빠' }, { w: 'Baby', m: '아기' }, { w: 'Happy', m: '행복한' },
    { w: 'Big', m: '큰' }, { w: 'Small', m: '작은' }, { w: 'Red', m: '빨간색' }, { w: 'Blue', m: '파란색' },
    { w: 'Green', m: '초록색' }, { w: 'Yellow', m: '노란색' }, { w: 'Purple', m: '보라색' }, { w: 'Orange', m: '주황색' },
    { w: 'Pink', m: '분홍색' }, { w: 'Black', m: '검정색' }, { w: 'White', m: '하얀색' }, { w: 'Brown', m: '갈색' },
    { w: 'One', m: '하나' }, { w: 'Two', m: '둘' }, { w: 'Three', m: '셋' }, { w: 'Four', m: '넷' }, { w: 'Five', m: '다섯' },
    { w: 'Six', m: '여섯' }, { w: 'Seven', m: '일곱' }, { w: 'Eight', m: '여덟' }, { w: 'Nine', m: '아홉' }, { w: 'Ten', m: '열' },
    { w: 'Head', m: '머리' }, { w: 'Eye', m: '눈' }, { w: 'Nose', m: '코' }, { w: 'Mouth', m: '입' }, { w: 'Ear', m: '귀' },
    { w: 'Hand', m: '손' }, { w: 'Foot', m: '발' }, { w: 'Arm', m: '팔' }, { w: 'Leg', m: '다리' },
    { w: 'Elephant', m: '코끼리' }, { w: 'Tiger', m: '호랑이' }, { w: 'Monkey', m: '원숭이' }, { w: 'Horse', m: '말' },
    { w: 'Cow', m: '소' }, { w: 'Pig', m: '돼지' }, { w: 'Sheep', m: '양' }, { w: 'Duck', m: '오리' }, { w: 'Chicken', m: '닭' },
    { w: 'Frog', m: '개구리' }, { w: 'Snake', m: '뱀' }, { w: 'Butterfly', m: '나비' }, { w: 'Bee', m: '벌' }, { w: 'Spider', m: '거미' },
    { w: 'Rain', m: '비' }, { w: 'Snow', m: '눈' }, { w: 'Wind', m: '바람' }, { w: 'Cloud', m: '구름' }, { w: 'Sky', m: '하늘' }, { w: 'Storm', m: '폭풍' },
    { w: 'Rice', m: '밥' }, { w: 'Soup', m: '수프' }, { w: 'Cheese', m: '치즈' }, { w: 'Pizza', m: '피자' },
    { w: 'Cake', m: '케이크' }, { w: 'Candy', m: '사탕' }, { w: 'Cookie', m: '쿠키' }, { w: 'Juice', m: '주스' },
    { w: 'Pencil', m: '연필' }, { w: 'Eraser', m: '지우개' }, { w: 'Ruler', m: '자' }, { w: 'Scissors', m: '가위' },
    { w: 'Crayon', m: '크레용' }, { w: 'Notebook', m: '공책' }, { w: 'Bag', m: '가방' },
    { w: 'Airplane', m: '비행기' }, { w: 'Boat', m: '보트' }, { w: 'Bicycle', m: '자전거' }, { w: 'Truck', m: '트럭' }, { w: 'Ship', m: '배' },
    { w: 'Grass', m: '잔디' }, { w: 'Mountain', m: '산' }, { w: 'River', m: '강' }, { w: 'Lake', m: '호수' },
    { w: 'Forest', m: '숲' }, { w: 'Ocean', m: '바다' }, { w: 'Sand', m: '모래' }, { w: 'Rock', m: '바위' },
    { w: 'Sister', m: '언니(누나)' }, { w: 'Brother', m: '형(오빠)' }, { w: 'Grandmother', m: '할머니' },
    { w: 'Grandfather', m: '할아버지' }, { w: 'Uncle', m: '삼촌' }, { w: 'Aunt', m: '이모' },
    { w: 'Sad', m: '슬픈' }, { w: 'Angry', m: '화난' }, { w: 'Tired', m: '피곤한' }, { w: 'Hungry', m: '배고픈' },
    { w: 'Sleepy', m: '졸린' }, { w: 'Scared', m: '무서운' }, { w: 'Excited', m: '신난' }, { w: 'Cold', m: '추운' },
    { w: 'Hot', m: '더운' }, { w: 'Fast', m: '빠른' }, { w: 'Slow', m: '느린' }, { w: 'Tall', m: '키 큰' },
    { w: 'Short', m: '짧은' }, { w: 'Old', m: '오래된' }, { w: 'New', m: '새로운' }, { w: 'Clean', m: '깨끗한' }, { w: 'Dirty', m: '더러운' },
    { w: 'Box', m: '상자' }, { w: 'Key', m: '열쇠' }, { w: 'Bell', m: '종' }, { w: 'Clock', m: '시계' },
    { w: 'Phone', m: '전화기' }, { w: 'Computer', m: '컴퓨터' }, { w: 'Lamp', m: '램프' }, { w: 'Mirror', m: '거울' },
    { w: 'Umbrella', m: '우산' }, { w: 'Shoe', m: '신발' }, { w: 'Hat', m: '모자' }, { w: 'Shirt', m: '셔츠' }, { w: 'Sock', m: '양말' },
    { w: 'Circle', m: '원' }, { w: 'Triangle', m: '삼각형' }, { w: 'Square', m: '사각형' }, { w: 'Heart', m: '하트' },
    { w: 'Soccer', m: '축구' }, { w: 'Baseball', m: '야구' }, { w: 'Basketball', m: '농구' }, { w: 'Swimming', m: '수영' }, { w: 'Tennis', m: '테니스' },
    { w: 'Piano', m: '피아노' }, { w: 'Guitar', m: '기타' }, { w: 'Violin', m: '바이올린' }, { w: 'Drum', m: '드럼' },
    { w: 'Math', m: '수학' }, { w: 'Science', m: '과학' }, { w: 'Music', m: '음악' }, { w: 'Art', m: '미술' },
    { w: 'Block', m: '블록' }, { w: 'Doll', m: '인형' }, { w: 'Top', m: '팽이' }, { w: 'Kite', m: '연' },
    { w: 'Television', m: '텔레비전' }, { w: 'Refrigerator', m: '냉장고' }, { w: 'Washer', m: '세탁기' },
    { w: 'Ant', m: '개미' }, { w: 'Ladybug', m: '무당벌레' }, { w: 'Grasshopper', m: '메뚜기' }, { w: 'Fly', m: '파리' }, { w: 'Mosquito', m: '모기' },
    { w: 'Octopus', m: '문어' }, { w: 'Shark', m: '상어' }, { w: 'Whale', m: '고래' }, { w: 'Crab', m: '게' },
    { w: 'Shrimp', m: '새우' }, { w: 'Starfish', m: '불가사리' }, { w: 'Jellyfish', m: '해파리' },
    { w: 'Autumn', m: '가을' }, { w: 'Picnic', m: '소풍' },
    { w: 'Today', m: '오늘' }, { w: 'Tomorrow', m: '내일' }, { w: 'Yesterday', m: '어제' }, { w: 'Now', m: '지금' }, { w: 'Later', m: '나중에' },
    { w: 'Letter', m: '편지' }, { w: 'Lock', m: '자물쇠' }, { w: 'Map', m: '지도' },
    { w: 'Flag', m: '깃발' }, { w: 'Stamp', m: '우표' }, { w: 'Balloon', m: '풍선' },
    { w: 'Doctor', m: '의사' }, { w: 'Nurse', m: '간호사' }, { w: 'Police', m: '경찰' }, { w: 'Firefighter', m: '소방관' },
    { w: 'Farmer', m: '농부' }, { w: 'Singer', m: '가수' }, { w: 'Painter', m: '화가' },
    { w: 'Spaceship', m: '우주선' }, { w: 'Rocket', m: '로켓' }, { w: 'Earth', m: '지구' },
    { w: 'Planet', m: '행성' }, { w: 'Astronaut', m: '우주비행사' }, { w: 'Meteor', m: '운석' },
    { w: 'Carrot', m: '당근' }, { w: 'Onion', m: '양파' }, { w: 'Potato', m: '감자' }, { w: 'Cabbage', m: '배추' }, { w: 'Corn', m: '옥수수' },
    { w: 'Cello', m: '첼로' }, { w: 'Trumpet', m: '트럼펫' }, { w: 'Saxophone', m: '색소폰' },
    { w: 'Volleyball', m: '배구' }, { w: 'Golf', m: '골프' }, { w: 'Skiing', m: '스키' },
    { w: 'Skating', m: '스케이트' }, { w: 'Bowling', m: '볼링' }, { w: 'Archery', m: '양궁' },
    { w: 'Joy', m: '기쁨' }, { w: 'Sadness', m: '슬픔' }, { w: 'Anger', m: '화남' },
    { w: 'Fear', m: '무서움' }, { w: 'Surprise', m: '놀람' }, { w: 'Shy', m: '부끄러운' },
    { w: 'Morning', m: '아침' }, { w: 'Afternoon', m: '오후' }, { w: 'Evening', m: '저녁' },
    { w: 'Night', m: '밤' }, { w: 'Dawn', m: '새벽' },
    { w: 'Living Room', m: '거실' }, { w: 'Bedroom', m: '침실' }, { w: 'Kitchen', m: '부엌' },
    { w: 'Bathroom', m: '화장실' }, { w: 'Yard', m: '마당' }, { w: 'Roof', m: '지붕' }, { w: 'Stairs', m: '계단' },
    { w: 'Korea', m: '한국' }, { w: 'America', m: '미국' }, { w: 'Japan', m: '일본' },
    { w: 'China', m: '중국' }, { w: 'France', m: '프랑스' }, { w: 'England', m: '영국' },
    { w: 'Worm', m: '지렁이' }, { w: 'Snail', m: '달팽이' }, { w: 'Firefly', m: '반딧불이' },
    { w: 'Camel', m: '낙타' }, { w: 'Rhino', m: '코뿔소' }, { w: 'Mole', m: '두더지' },
    { w: 'Stethoscope', m: '청진기' }, { w: 'Bandage', m: '붕대' }, { w: 'Thermometer', m: '체온계' }, { w: 'Syringe', m: '주사기' },
    { w: 'Suitcase', m: '여행가방' }, { w: 'Passport', m: '여권' }, { w: 'Hotel', m: '호텔' },
    { w: 'Joystick', m: '조이스틱' }, { w: 'Concert', m: '콘서트' }, { w: 'Stage', m: '무대' },
    { w: 'Microphone', m: '마이크' }, { w: 'Speaker', m: '스피커' },
    { w: 'Run', m: '뛰기' }, { w: 'Walk', m: '걷기' }, { w: 'Sit', m: '앉기' }, { w: 'Stand', m: '서기' },
    { w: 'Sleep', m: '잠' }, { w: 'Dream', m: '꿈' }, { w: 'Shadow', m: '그림자' }, { w: 'Echo', m: '메아리' },
    { w: 'Sunset', m: '노을' }, { w: 'Dew', m: '이슬' }, { w: 'Frost', m: '서리' }, { w: 'Hail', m: '우박' },
];

const ENGLISH_GRAMMAR = [
    { q: 'I ___ a student.', a: 'am', options: ['am', 'is', 'are', 'be'] },
    { q: 'You ___ my friend.', a: 'are', options: ['am', 'is', 'are', 'be'] },
    { q: 'She ___ happy.', a: 'is', options: ['am', 'is', 'are', 'be'] },
    { q: 'He ___ a teacher.', a: 'is', options: ['am', 'is', 'are', 'be'] },
    { q: 'We ___ students.', a: 'are', options: ['am', 'is', 'are', 'be'] },
    { q: 'They ___ my friends.', a: 'are', options: ['am', 'is', 'are', 'be'] },
    { q: 'It ___ a cat.', a: 'is', options: ['am', 'is', 'are', 'be'] },
    { q: 'This is ___ apple.', a: 'an', options: ['a', 'an', 'the', 'some'] },
    { q: 'This is ___ book.', a: 'a', options: ['a', 'an', 'the', 'some'] },
    { q: 'That is ___ umbrella.', a: 'an', options: ['a', 'an', 'the', 'some'] },
    { q: 'I have two ___. (dog)', a: 'dogs', options: ['dog', 'dogs', 'doges', 'dogss'] },
    { q: 'I have three ___. (cat)', a: 'cats', options: ['cat', 'cats', 'cates', 'catss'] },
    { q: 'The ball is ___ the box.', a: 'in', options: ['in', 'on', 'at', 'under'] },
    { q: 'The cat is ___ the table.', a: 'on', options: ['in', 'on', 'at', 'under'] },
    { q: 'I ___ to school every day.', a: 'go', options: ['go', 'goes', 'went', 'going'] },
    { q: 'She ___ to school every day.', a: 'goes', options: ['go', 'goes', 'went', 'going'] },
    { q: 'Do you like apples? Yes, I ___.', a: 'do', options: ['do', 'does', 'am', 'is'] },
    { q: 'Is she a teacher? Yes, she ___.', a: 'is', options: ['do', 'does', 'am', 'is'] },
    { q: '___ you a student?', a: 'Are', options: ['Am', 'Is', 'Are', 'Be'] },
    { q: '___ he your friend?', a: 'Is', options: ['Am', 'Is', 'Are', 'Be'] },
    { q: 'My favorite color ___ blue.', a: 'is', options: ['am', 'is', 'are', 'be'] },
    { q: 'There ___ two books on the desk.', a: 'are', options: ['am', 'is', 'are', 'be'] },
    { q: 'There ___ a cat under the chair.', a: 'is', options: ['am', 'is', 'are', 'be'] },
    { q: 'This is my mom. ___ name is Kate.', a: 'Her', options: ['His', 'Her', 'Its', 'Their'] },
    { q: 'She ___ a nurse.', a: 'is', options: ['am', 'is', 'are', 'be'] },
    { q: 'We ___ happy today.', a: 'are', options: ['am', 'is', 'are', 'be'] },
    { q: 'The dog ___ under the table.', a: 'is', options: ['am', 'is', 'are', 'be'] },
    { q: 'The books ___ on the shelf.', a: 'are', options: ['am', 'is', 'are', 'be'] },
    { q: 'This is ___ orange.', a: 'an', options: ['a', 'an', 'the', 'some'] },
    { q: 'That is ___ car.', a: 'a', options: ['a', 'an', 'the', 'some'] },
    { q: 'I have four ___. (pencil)', a: 'pencils', options: ['pencil', 'pencils', 'pencilies', 'pencilss'] },
    { q: 'She has five ___. (book)', a: 'books', options: ['book', 'books', 'bookes', 'bookies'] },
    { q: 'The mouse is ___ the chair.', a: 'under', options: ['in', 'on', 'at', 'under'] },
    { q: 'The bird is ___ the tree.', a: 'in', options: ['in', 'on', 'at', 'under'] },
    { q: 'I ___ my homework every day.', a: 'do', options: ['do', 'does', 'go', 'goes'] },
    { q: 'He ___ his homework every day.', a: 'does', options: ['do', 'does', 'go', 'goes'] },
    { q: 'What ___ your name?', a: 'is', options: ['am', 'is', 'are', 'be'] },
    { q: 'What ___ your favorite color?', a: 'is', options: ['am', 'is', 'are', 'be'] },
    { q: 'How ___ you?', a: 'are', options: ['am', 'is', 'are', 'be'] },
    { q: 'Where ___ you from?', a: 'are', options: ['am', 'is', 'are', 'be'] },
    { q: 'Who ___ that boy?', a: 'is', options: ['am', 'is', 'are', 'be'] },
    { q: 'This is my dad. ___ name is Tom.', a: 'His', options: ['His', 'Her', 'Its', 'Their'] },
    { q: 'This is my cat. ___ name is Mimi.', a: 'Its', options: ['His', 'Her', 'Its', 'Their'] },
    { q: 'I am ___ than you. (tall)', a: 'taller', options: ['tall', 'taller', 'tallest', 'tallly'] },
    { q: 'This apple is ___ than that one. (big)', a: 'bigger', options: ['big', 'bigger', 'biggest', 'biggly'] },
    { q: 'Today is Monday. Tomorrow is ___.', a: 'Tuesday', options: ['Sunday', 'Tuesday', 'Friday', 'Saturday'] },
    { q: 'Today is Friday. Tomorrow is ___.', a: 'Saturday', options: ['Sunday', 'Monday', 'Saturday', 'Wednesday'] },
    { q: 'There are seven days in a ___.', a: 'week', options: ['day', 'week', 'month', 'year'] },
    { q: 'January is the first ___ of the year.', a: 'month', options: ['day', 'week', 'month', 'year'] },
    { q: 'I ___ playing soccer now.', a: 'am', options: ['am', 'is', 'are', 'be'] },
    { q: 'She ___ reading a book now.', a: 'is', options: ['am', 'is', 'are', 'be'] },
    { q: 'They ___ eating lunch now.', a: 'are', options: ['am', 'is', 'are', 'be'] },
    { q: 'I ___ to the park yesterday.', a: 'went', options: ['go', 'goes', 'went', 'going'] },
    { q: 'She ___ a cake yesterday.', a: 'made', options: ['make', 'makes', 'made', 'making'] },
    { q: 'Can you ___ me?', a: 'help', options: ['help', 'helps', 'helped', 'helping'] },
    { q: 'May I ___ a question?', a: 'ask', options: ['ask', 'asks', 'asked', 'asking'] },
    { q: 'I like to ___ books.', a: 'read', options: ['read', 'reads', 'reading', 'readed'] },
    { q: 'He likes to ___ soccer.', a: 'play', options: ['play', 'plays', 'playing', 'played'] },
    { q: "Let's ___ to the zoo!", a: 'go', options: ['go', 'goes', 'went', 'going'] },
    { q: 'I want ___ eat pizza.', a: 'to', options: ['to', 'at', 'in', 'on'] },
    { q: 'She wants ___ play outside.', a: 'to', options: ['to', 'at', 'in', 'on'] },
    { q: "It's raining. Take your ___.", a: 'umbrella', options: ['umbrella', 'hat', 'shoe', 'bag'] },
    { q: "It's cold. Wear your ___.", a: 'coat', options: ['coat', 'sock', 'shoe', 'hat'] },
    { q: 'Wash your ___ before eating.', a: 'hands', options: ['hands', 'feet', 'eyes', 'ears'] },
    { q: 'Brush your ___ every morning.', a: 'teeth', options: ['hair', 'teeth', 'nose', 'hands'] },
    { q: 'The sun rises in the ___.', a: 'east', options: ['east', 'west', 'north', 'south'] },
    { q: 'The sun sets in the ___.', a: 'west', options: ['east', 'west', 'north', 'south'] },
    { q: 'A baby dog is called a ___.', a: 'puppy', options: ['puppy', 'kitten', 'calf', 'chick'] },
    { q: 'A baby cat is called a ___.', a: 'kitten', options: ['puppy', 'kitten', 'calf', 'chick'] },
    { q: 'Fish live in the ___.', a: 'water', options: ['water', 'sky', 'tree', 'ground'] },
    { q: 'Birds can ___.', a: 'fly', options: ['fly', 'swim', 'dig', 'jump'] },
    { q: 'Fish can ___.', a: 'swim', options: ['fly', 'swim', 'dig', 'run'] },
    { q: 'We sleep at ___.', a: 'night', options: ['morning', 'noon', 'night', 'afternoon'] },
    { q: 'We eat breakfast in the ___.', a: 'morning', options: ['morning', 'noon', 'night', 'evening'] },
    { q: 'Ice is very ___.', a: 'cold', options: ['cold', 'hot', 'warm', 'wet'] },
    { q: 'Fire is very ___.', a: 'hot', options: ['cold', 'hot', 'warm', 'dry'] },
    { q: 'An elephant is very ___.', a: 'big', options: ['big', 'small', 'tiny', 'short'] },
    { q: 'A mouse is very ___.', a: 'small', options: ['big', 'small', 'tall', 'long'] },
    { q: 'There is one bus and there are three ___. (bus)', a: 'buses', options: ['bus', 'buses', 'buss', 'busses'] },
    { q: 'A child becomes two ___. (child)', a: 'children', options: ['childs', 'children', 'childes', 'childrens'] },
    { q: 'One foot, two ___. (foot)', a: 'feet', options: ['foot', 'feet', 'foots', 'footes'] },
    { q: "Fish can swim, but they can't ___.", a: 'walk', options: ['swim', 'walk', 'fly', 'sleep'] },
    { q: '___ the door, please.', a: 'Close', options: ['Close', 'Closes', 'Closing', 'Closed'] },
    { q: '___ down, please.', a: 'Sit', options: ['Sit', 'Sits', 'Sitting', 'Sat'] },
    { q: '___ up, please.', a: 'Stand', options: ['Stand', 'Stands', 'Standing', 'Stood'] },
    { q: "Don't ___ in class.", a: 'run', options: ['run', 'runs', 'running', 'ran'] },
    { q: 'The library is ___.', a: 'quiet', options: ['quiet', 'loud', 'noisy', 'big'] },
    { q: 'I go to school ___ 8 o\'clock.', a: 'at', options: ['at', 'in', 'on', 'to'] },
    { q: 'My birthday is ___ July.', a: 'in', options: ['at', 'in', 'on', 'to'] },
    { q: 'See you ___ Monday.', a: 'on', options: ['at', 'in', 'on', 'to'] },
    { q: 'This is Jack. ___ car is blue.', a: 'His', options: ['His', 'Her', 'Its', 'My'] },
    { q: 'How many apples do you have? I have ___ apples. (5)', a: 'five', options: ['four', 'five', 'six', 'seven'] },
    { q: 'I want ___ water, please.', a: 'some', options: ['some', 'a', 'an', 'many'] },
    { q: "There isn't ___ milk left.", a: 'any', options: ['any', 'some', 'a', 'an'] },
    { q: 'See you ___!', a: 'later', options: ['now', 'later', 'today', 'yesterday'] },
    { q: 'What time is it ___?', a: 'now', options: ['now', 'later', 'soon', 'then'] },
    { q: 'Whose bag is this? It is ___ bag.', a: 'my', options: ['my', 'your', 'his', 'her'] },
    { q: 'This pencil is ___ than that one. (long)', a: 'longer', options: ['long', 'longer', 'longest', 'longly'] },
    { q: 'She is the ___ girl in class. (tall)', a: 'tallest', options: ['tall', 'taller', 'tallest', 'tallly'] },
    { q: 'He is the ___ boy in class. (short)', a: 'shortest', options: ['short', 'shorter', 'shortest', 'shortly'] },
    { q: 'This is the ___ day of my life! (happy)', a: 'happiest', options: ['happy', 'happier', 'happiest', 'happily'] },
    { q: 'I ___ my bed every morning.', a: 'make', options: ['make', 'makes', 'made', 'making'] },
    { q: 'She ___ her teeth twice a day.', a: 'brushes', options: ['brush', 'brushes', 'brushed', 'brushing'] },
    { q: 'We ___ dinner at 7 pm.', a: 'eat', options: ['eat', 'eats', 'ate', 'eating'] },
    { q: 'It ___ every day in the rainy season.', a: 'rains', options: ['rain', 'rains', 'rained', 'raining'] },
    { q: 'The stars ___ at night.', a: 'shine', options: ['shine', 'shines', 'shined', 'shining'] },
    { q: 'I live in ___.', a: 'Korea', options: ['Korea', 'America', 'Japan', 'China'] },
    { q: 'We eat dinner in the ___.', a: 'evening', options: ['morning', 'afternoon', 'evening', 'night'] },
    { q: 'She feels ___ when she gets a gift.', a: 'happy', options: ['happy', 'sad', 'angry', 'scared'] },
    { q: 'He is ___ of the dark.', a: 'scared', options: ['scared', 'happy', 'excited', 'proud'] },
    { q: 'I play the ___ in the school band.', a: 'trumpet', options: ['trumpet', 'carrot', 'potato', 'rocket'] },
    { q: 'An astronaut travels to ___.', a: 'space', options: ['space', 'school', 'home', 'park'] },
    { q: 'The Earth is a ___.', a: 'planet', options: ['planet', 'star', 'moon', 'sun'] },
    { q: 'Rabbits like to eat ___.', a: 'carrots', options: ['carrots', 'rocks', 'shoes', 'books'] },
    { q: 'We live in a ___ with many rooms.', a: 'house', options: ['house', 'car', 'boat', 'tree'] },
    { q: 'I sleep in my ___.', a: 'bedroom', options: ['bedroom', 'kitchen', 'bathroom', 'yard'] },
    { q: 'We cook food in the ___.', a: 'kitchen', options: ['kitchen', 'bedroom', 'bathroom', 'yard'] },
    { q: 'Snails move very ___.', a: 'slowly', options: ['slowly', 'quickly', 'loudly', 'quietly'] },
    { q: 'A camel lives in the ___.', a: 'desert', options: ['desert', 'ocean', 'forest', 'city'] },
    { q: 'Fireflies glow at ___.', a: 'night', options: ['night', 'noon', 'morning', 'dawn'] },
    { q: '___ do you live?', a: 'Where', options: ['What', 'Where', 'When', 'Who'] },
    { q: '___ is your birthday?', a: 'When', options: ['What', 'Where', 'When', 'Who'] },
    { q: '___ do you want to eat?', a: 'What', options: ['What', 'Where', 'When', 'Who'] },
    { q: 'I ___ tired after playing all day.', a: 'am', options: ['am', 'is', 'are', 'be'] },
    { q: 'They ___ excited about the trip.', a: 'are', options: ['am', 'is', 'are', 'be'] },
    { q: 'My favorite sport is ___.', a: 'soccer', options: ['soccer', 'carrot', 'kitchen', 'planet'] },
    { q: 'I want to be an astronaut ___ I grow up.', a: 'when', options: ['when', 'where', 'what', 'who'] },
    { q: 'The rocket flew ___ into space.', a: 'up', options: ['up', 'down', 'left', 'right'] },
    { q: 'A rhino has a big ___.', a: 'horn', options: ['horn', 'wing', 'fin', 'tail'] },
    { q: 'The doctor uses a ___ to listen to your heart.', a: 'stethoscope', options: ['stethoscope', 'thermometer', 'bandage', 'syringe'] },
    { q: 'I put a ___ on my cut.', a: 'bandage', options: ['bandage', 'stethoscope', 'hotel', 'stage'] },
    { q: 'We packed our ___ for the trip.', a: 'suitcase', options: ['suitcase', 'passport', 'hotel', 'concert'] },
    { q: 'You need a ___ to travel to another country.', a: 'passport', options: ['passport', 'suitcase', 'hotel', 'ticket'] },
    { q: 'We stayed at a nice ___ on our trip.', a: 'hotel', options: ['hotel', 'school', 'hospital', 'park'] },
    { q: 'The singer stood on the ___.', a: 'stage', options: ['stage', 'chair', 'table', 'floor'] },
    { q: 'I sing into the ___.', a: 'microphone', options: ['microphone', 'speaker', 'stage', 'ticket'] },
    { q: 'I like to ___ in the park every morning.', a: 'run', options: ['run', 'sleep', 'sit', 'stand'] },
    { q: 'Please ___ down and rest.', a: 'sit', options: ['sit', 'stand', 'run', 'walk'] },
    { q: 'I had a nice ___ last night.', a: 'dream', options: ['dream', 'shadow', 'echo', 'sleep'] },
    { q: 'My ___ follows me everywhere in the sun.', a: 'shadow', options: ['shadow', 'echo', 'dream', 'dew'] },
    { q: 'I heard an ___ in the cave.', a: 'echo', options: ['echo', 'shadow', 'dream', 'dew'] },
    { q: 'The ___ was orange and pink in the sky.', a: 'sunset', options: ['sunset', 'dew', 'frost', 'hail'] },
    { q: 'In winter, ___ falls from the sky.', a: 'hail', options: ['hail', 'dew', 'sunset', 'shadow'] },
    { q: 'The grass was wet with morning ___.', a: 'dew', options: ['dew', 'hail', 'sunset', 'shadow'] },
    { q: "It's so cold, there is ___ on the window.", a: 'frost', options: ['frost', 'dew', 'hail', 'sunset'] },
    { q: 'I ___ to school every morning.', a: 'walk', options: ['walk', 'run', 'sleep', 'sit'] },
    { q: 'Please ___ up and say hello.', a: 'stand', options: ['stand', 'sit', 'sleep', 'run'] },
    { q: 'The nurse gave me a ___.', a: 'thermometer', options: ['thermometer', 'syringe', 'bandage', 'stethoscope'] },
    { q: 'We played video games with a ___.', a: 'joystick', options: ['joystick', 'microphone', 'stethoscope', 'passport'] },
];

const seed = () => {
    db.serialize(() => {
        // Clear existing data
        db.run('DELETE FROM quizzes');
        db.run('DELETE FROM user_progress');

        const subjects = ['math', 'korean', 'english'];
        const levelsPerSubject = 20;

        subjects.forEach(subject => {
            for (let i = 1; i <= levelsPerSubject; i++) {
                const questions = [];
                const usedQuestions = new Set();

                // Generate 5 questions per level, retrying on an exact repeat
                // within the same level so text-based subjects (korean/english)
                // don't hand out the same question twice in one quiz.
                for (let q = 0; q < 5; q++) {
                    let question, answer, options;
                    let attempts = 0;

                    do {
                    attempts++;
                    if (subject === 'math') {
                        // Math Logic
                        if (i <= 5) { // 1-5: Basic Add/Sub
                            const isAdd = Math.random() > 0.5;
                            const a = Math.floor(Math.random() * 9) + 1;
                            const b = Math.floor(Math.random() * 9) + 1;
                            if (isAdd) {
                                question = `${a} + ${b} = ?`;
                                answer = String(a + b);
                                options = shuffle([String(a + b), String(a + b + 1), String(a + b - 1), String(a + b + 2)]);
                            } else {
                                const max = Math.max(a, b);
                                const min = Math.min(a, b);
                                question = `${max} - ${min} = ?`;
                                answer = String(max - min);
                                options = shuffle([String(max - min), String(max - min + 1), String(max - min - 1), String(max - min + 2)]);
                            }
                        } else if (i <= 15) { // 6-15: 2-Digit
                            const isAdd = Math.random() > 0.5;
                            const a = Math.floor(Math.random() * 40) + 10;
                            const b = Math.floor(Math.random() * 40) + 10;
                            if (isAdd) {
                                question = `${a} + ${b} = ?`;
                                answer = String(a + b);
                                options = shuffle([String(a + b), String(a + b + 10), String(a + b - 10), String(a + b + 1)]);
                            } else {
                                const max = Math.max(a, b) + 20; // Ensure positive
                                const min = Math.min(a, b);
                                question = `${max} - ${min} = ?`;
                                answer = String(max - min);
                                options = shuffle([String(max - min), String(max - min + 10), String(max - min - 10), String(max - min + 1)]);
                            }
                        } else { // 16-20: Multiplication
                            const a = Math.floor(Math.random() * 8) + 2;
                            const b = Math.floor(Math.random() * 9) + 1;
                            question = `${a} x ${b} = ?`;
                            answer = String(a * b);
                            options = shuffle([String(a * b), String(a * b + a), String(a * b - a), String(a * b + 1)]);
                        }

                    } else if (subject === 'korean') {
                        // Korean Logic
                        if (i <= 10) {
                            const target = KOREAN_WORDS[Math.floor(Math.random() * KOREAN_WORDS.length)];
                            question = `다음 중 '${target}'의 올바른 글자는?`;
                            answer = target;
                            const distractors = shuffle(KOREAN_WORDS.filter((w) => w !== target)).slice(0, 3);
                            options = shuffle([target, ...distractors]);
                        } else {
                            const p = KOREAN_PROVERBS[Math.floor(Math.random() * KOREAN_PROVERBS.length)];
                            question = p.q;
                            answer = p.a;
                            const distractors = shuffle(
                                KOREAN_PROVERBS.filter((other) => other.a !== p.a).map((other) => other.a)
                            ).slice(0, 3);
                            options = shuffle([p.a, ...distractors]);
                        }

                    } else {
                        // English Logic
                        if (i <= 10) {
                            const v = ENGLISH_VOCAB[Math.floor(Math.random() * ENGLISH_VOCAB.length)];
                            question = `'${v.w}'의 뜻은?`;
                            answer = v.m;
                            const distractors = shuffle(
                                ENGLISH_VOCAB.filter((other) => other.m !== v.m).map((other) => other.m)
                            ).slice(0, 3);
                            options = shuffle([v.m, ...distractors]);
                        } else {
                            const g = ENGLISH_GRAMMAR[Math.floor(Math.random() * ENGLISH_GRAMMAR.length)];
                            question = g.q;
                            answer = g.a;
                            options = shuffle(g.options);
                        }
                    }
                    } while (usedQuestions.has(question) && attempts < 15);

                    usedQuestions.add(question);
                    questions.push({
                        id: q,
                        question: question,
                        options: options,
                        answer: answer
                    });
                }

                db.run(
                    'INSERT INTO quizzes (subject, level, question_data, answer) VALUES (?, ?, ?, ?)',
                    [subject, i, JSON.stringify(questions), 'answer']
                );
            }
        });

        console.log('Database seeded with separate subject paths (1-20 each)!');
    });
};
function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

seed();

db.close().then(() => process.exit(0));
