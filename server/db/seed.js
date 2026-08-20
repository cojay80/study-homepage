require('dotenv').config({ override: true });
const { db } = require('./database');

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

                // Generate 5 questions per level
                for (let q = 0; q < 5; q++) {
                    let question, answer, options;

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
                            const words = ['사과', '바나나', '포도', '수박', '자동차', '비행기', '학교', '친구'];
                            const target = words[Math.floor(Math.random() * words.length)];
                            question = `다음 중 '${target}'의 올바른 글자는?`;
                            answer = target;
                            options = shuffle([target, '사과', '바나나', '포도'].slice(0, 4));
                            if (!options.includes(answer)) options[0] = answer;
                            options = shuffle(options);
                        } else {
                            const proverbs = [
                                { q: '가는 말이 고와야 OOO OO 곱다.', a: '오는 말이' },
                                { q: '티끌 모아 OO.', a: '태산' },
                                { q: '누워서 O 먹기.', a: '떡' },
                                { q: '등잔 밑이 OOO.', a: '어둡다' }
                            ];
                            const p = proverbs[Math.floor(Math.random() * proverbs.length)];
                            question = p.q;
                            answer = p.a;
                            options = shuffle([p.a, '다른 말', '반대 말', '모르는 말']);
                        }

                    } else {
                        // English Logic
                        if (i <= 10) {
                            const vocab = [
                                { w: 'Apple', m: '사과' },
                                { w: 'Cat', m: '고양이' },
                                { w: 'Dog', m: '개' },
                                { w: 'Book', m: '책' }
                            ];
                            const v = vocab[Math.floor(Math.random() * vocab.length)];
                            question = `'${v.w}'의 뜻은?`;
                            answer = v.m;
                            options = shuffle([v.m, '사과', '고양이', '개', '책']);
                            options = [...new Set(options)].slice(0, 4);
                            if (!options.includes(answer)) options[0] = answer;
                            options = shuffle(options);
                        } else {
                            question = 'I ___ a student.';
                            answer = 'am';
                            options = shuffle(['am', 'is', 'are', 'be']);
                        }
                    }

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
