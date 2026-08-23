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
