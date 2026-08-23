require('dotenv').config({ override: true });
const { db } = require('./database');

const KOREAN_WORDS = [
    '사과', '바나나', '포도', '수박', '딸기', '오렌지', '참외', '복숭아',
    '자동차', '비행기', '기차', '자전거', '배', '버스',
    '학교', '친구', '선생님', '가족', '엄마', '아빠', '동생', '할머니', '할아버지',
    '강아지', '고양이', '토끼', '코끼리', '나비', '잠자리', '호랑이', '사자',
    '꽃', '나무', '구름', '바다', '산', '하늘', '무지개', '눈사람',
    '우산', '모자', '신발', '가방', '연필', '책상', '의자', '창문', '시계', '컵',
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
