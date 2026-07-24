/**
 * Firestore Seed Script
 * ---------------------
 * Populates the Firestore database with initial data:
 *   - Roles (USER, ADMIN)
 *   - Badges
 *   - Categories
 *   - Challenges + Flags + Hints
 *   - Academy Topics + Lessons + Quizzes
 *
 * Usage:
 *   npx ts-node scripts/seed-firestore.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

// ── Firebase Init ──────────────────────────────────────────────────────────

const app = admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
});

const db = app.firestore();

// ── Helpers ────────────────────────────────────────────────────────────────

function sha256(text: string) {
    return crypto.createHash('sha256').update(text).digest('hex');
}

async function upsert(collection: string, id: string, data: object) {
    await db.collection(collection).doc(id).set(data, { merge: true });
    console.log(`  ✓ ${collection}/${id}`);
}

async function add(collection: string, data: object): Promise<string> {
    const ref = await db.collection(collection).add(data);
    console.log(`  ✓ ${collection}/${ref.id}`);
    return ref.id;
}

// ── Seed ───────────────────────────────────────────────────────────────────

async function seedRoles() {
    console.log('\n📌 Seeding Roles...');
    await upsert('roles', 'user-role', {
        name: 'USER',
        description: 'Standard CTF participant',
        permissions: ['submit_flag', 'view_challenges', 'view_leaderboard', 'create_ticket'],
    });
    await upsert('roles', 'admin-role', {
        name: 'ADMIN',
        description: 'Platform administrator',
        permissions: [
            'submit_flag', 'view_challenges', 'view_leaderboard', 'create_ticket',
            'manage_challenges', 'manage_users', 'view_logs', 'manage_tickets',
        ],
    });
}

async function seedBadges() {
    console.log('\n🏅 Seeding Badges...');
    const badges = [
        { name: 'First Blood', description: 'Solved your first challenge!', iconUrl: '🩸', pointsRequired: 0 },
        { name: 'Elite Hacker', description: 'Accumulated 500+ points.', iconUrl: '💀', pointsRequired: 500 },
        { name: 'Academy Scholar', description: 'Completed all academy lessons.', iconUrl: '🎓', pointsRequired: 0 },
        { name: 'Flag Collector', description: 'Solved 10 challenges.', iconUrl: '🚩', pointsRequired: 0 },
        { name: 'Speedrunner', description: 'Solved a challenge in under 5 minutes.', iconUrl: '⚡', pointsRequired: 0 },
    ];
    for (const badge of badges) {
        const id = badge.name.toLowerCase().replace(/ /g, '-');
        await upsert('badges', id, badge);
    }
}

async function seedCategories() {
    console.log('\n📂 Seeding Categories...');
    const categories = [
        { id: 'web', name: 'Web', description: 'Web application security challenges' },
        { id: 'crypto', name: 'Cryptography', description: 'Encryption and hashing challenges' },
        { id: 'forensics', name: 'Forensics', description: 'Digital forensics and analysis' },
        { id: 'network', name: 'Network', description: 'Network protocol and traffic analysis' },
        { id: 'reversing', name: 'Reverse Engineering', description: 'Binary and code reverse engineering' },
        { id: 'misc', name: 'Miscellaneous', description: 'General security challenges' },
    ];
    for (const cat of categories) {
        await upsert('categories', cat.id, { name: cat.name, description: cat.description });
    }
    return categories;
}

async function seedChallenges() {
    console.log('\n🚩 Seeding Challenges...');

    const challenges = [
        {
            id: 'challenge-1',
            title: 'Cookie Monster',
            difficulty: 'Easy',
            description: 'Inspect the browser cookies to find a hidden flag.',
            objectives: 'Open developer tools and examine the cookie storage.',
            categoryId: 'web',
            points: 50,
            tags: 'web,cookies,beginner',
            estimatedTime: 10,
            isActive: true,
            dockerImage: null,
            flag: 'nerdsCTF{c00k13_m0nst3r_w4s_h3r3}',
            hints: [
                { content: 'Look at the browser developer tools > Application > Cookies', costPoints: 0 },
                { content: 'The flag is stored as a cookie value', costPoints: 5 },
            ],
        },
        {
            id: 'challenge-2',
            title: 'Source Detective',
            difficulty: 'Easy',
            description: 'Find the hidden flag in the page source code.',
            objectives: 'View the page source and look for hidden comments or variables.',
            categoryId: 'web',
            points: 75,
            tags: 'web,source-code,beginner',
            estimatedTime: 15,
            isActive: true,
            dockerImage: null,
            flag: 'nerdsCTF{s0urc3_c0d3_n3v3r_l13s}',
            hints: [
                { content: 'Try Ctrl+U or View Page Source', costPoints: 0 },
                { content: 'Search for "nerdsCTF" in the source', costPoints: 5 },
            ],
        },
        {
            id: 'challenge-3',
            title: 'Hidden Header',
            difficulty: 'Medium',
            description: 'The server sends a secret flag in a custom HTTP response header.',
            objectives: 'Intercept the HTTP response and examine all headers.',
            categoryId: 'network',
            points: 100,
            tags: 'network,http,headers,intermediate',
            estimatedTime: 20,
            isActive: true,
            dockerImage: null,
            flag: 'nerdsCTF{h34d3rs_t3ll_4_st0ry}',
            hints: [
                { content: 'Use browser DevTools > Network tab or curl -I', costPoints: 0 },
                { content: 'Look for non-standard headers like X-Secret or X-Flag', costPoints: 10 },
            ],
        },
        {
            id: 'challenge-4',
            title: 'Encoded Secrets',
            difficulty: 'Medium',
            description: 'Decode a multi-layered encoded flag. Layers include Base64 and ROT13.',
            objectives: 'Identify the encoding scheme and decode the string step by step.',
            categoryId: 'crypto',
            points: 150,
            tags: 'crypto,encoding,base64,rot13',
            estimatedTime: 25,
            isActive: true,
            dockerImage: null,
            flag: 'nerdsCTF{3nc0d1ng_1s_n0t_3ncrypt10n}',
            hints: [
                { content: 'Try Base64 decode first', costPoints: 0 },
                { content: 'After Base64, apply ROT13', costPoints: 15 },
            ],
        },
        {
            id: 'challenge-5',
            title: 'Broken API',
            difficulty: 'Hard',
            description: 'An API endpoint has a broken access control vulnerability. Exploit it to get admin data.',
            objectives: 'Find and exploit the IDOR (Insecure Direct Object Reference) vulnerability.',
            categoryId: 'web',
            points: 250,
            tags: 'web,api,idor,access-control,advanced',
            estimatedTime: 45,
            isActive: true,
            dockerImage: null,
            flag: 'nerdsCTF{1d0r_1s_r34l_4nd_d4ng3r0us}',
            hints: [
                { content: 'Try changing the user ID in the API request', costPoints: 0 },
                { content: 'The admin user has ID 1. Try accessing /api/users/1', costPoints: 25 },
            ],
        },
    ];

    for (const c of challenges) {
        const { id, flag, hints, ...challengeData } = c;
        await upsert('challenges', id, { ...challengeData, createdAt: new Date() });

        // Flag (SHA-256 hashed)
        const flagDocId = `flag-${id}`;
        await upsert('flags', flagDocId, {
            challengeId: id,
            flagHash: sha256(flag),
            isDynamic: false,
        });

        // Hints
        for (let i = 0; i < hints.length; i++) {
            await upsert('hints', `hint-${id}-${i + 1}`, {
                challengeId: id,
                content: hints[i].content,
                costPoints: hints[i].costPoints,
            });
        }
    }
}

async function seedAcademy() {
    console.log('\n🎓 Seeding Academy...');

    const topics = [
        {
            id: 'topic-web-basics',
            title: 'Web Security Basics',
            description: 'Introduction to web security concepts',
            orderIndex: 1,
            lessons: [
                {
                    id: 'lesson-http',
                    title: 'Understanding HTTP',
                    orderIndex: 1,
                    contentMarkdown: `# Understanding HTTP\n\nHTTP (HyperText Transfer Protocol) is the foundation of data communication on the web.\n\n## Key Concepts\n\n- **Request Methods**: GET, POST, PUT, DELETE\n- **Status Codes**: 200 OK, 404 Not Found, 500 Server Error\n- **Headers**: Metadata about the request/response\n- **Cookies**: Small data stored in the browser\n\n## Security Implications\n\nHTTP by itself is **not encrypted**. Always use HTTPS in production to prevent man-in-the-middle attacks.\n\n## Exercise\n\nOpen your browser DevTools and inspect the network tab while loading any webpage. Look at the request/response headers.`,
                    quizzes: [
                        {
                            question: 'Which HTTP method is typically used to submit form data?',
                            optionsJson: JSON.stringify(['GET', 'POST', 'DELETE', 'HEAD']),
                            correctOption: 'POST',
                        },
                    ],
                },
                {
                    id: 'lesson-cookies',
                    title: 'Cookies and Sessions',
                    orderIndex: 2,
                    contentMarkdown: `# Cookies and Sessions\n\nCookies are small pieces of data stored by the browser, used to maintain state between requests.\n\n## Cookie Attributes\n\n| Attribute | Description |\n|-----------|-------------|\n| **HttpOnly** | Prevents JavaScript access — protects against XSS |\n| **Secure** | Only sent over HTTPS |\n| **SameSite** | Controls cross-origin requests — protects against CSRF |\n| **Expires/Max-Age** | When the cookie expires |\n\n## Common Vulnerabilities\n\n- **Session Fixation**: Attacker fixes a known session ID\n- **Session Hijacking**: Stealing session cookies via XSS\n- **CSRF**: Forging requests using valid cookies\n\n## Best Practice\n\nAlways set **HttpOnly**, **Secure**, and **SameSite=Strict** (or Lax) on authentication cookies.`,
                    quizzes: [
                        {
                            question: 'Which cookie attribute prevents JavaScript from reading the cookie value?',
                            optionsJson: JSON.stringify(['Secure', 'HttpOnly', 'SameSite', 'Expires']),
                            correctOption: 'HttpOnly',
                        },
                    ],
                },
            ],
        },
        {
            id: 'topic-crypto-intro',
            title: 'Cryptography Fundamentals',
            description: 'Core concepts in modern cryptography',
            orderIndex: 2,
            lessons: [
                {
                    id: 'lesson-encoding',
                    title: 'Encoding vs Encryption',
                    orderIndex: 1,
                    contentMarkdown: `# Encoding vs Encryption\n\nThese are often confused, but they serve very different purposes.\n\n## Encoding\n\n**Encoding** transforms data into a specific format for transmission or storage. It is **NOT** secret — anyone can decode it.\n\nCommon encodings:\n- **Base64**: Encodes binary data as ASCII text\n- **URL Encoding**: Encodes special characters in URLs (%20 = space)\n- **ROT13**: Shifts letters 13 positions (substitution cipher)\n- **Hex**: Encodes bytes as hexadecimal characters\n\n## Encryption\n\n**Encryption** uses a key to make data unreadable without the corresponding key.\n\nCommon algorithms:\n- **AES** (symmetric — same key for encrypt/decrypt)\n- **RSA** (asymmetric — public/private key pair)\n- **ChaCha20** (modern stream cipher)\n\n## Key Takeaway\n\n⚠️ **Encoding is not encryption!** Never rely on Base64 or ROT13 to protect sensitive data.`,
                    quizzes: [
                        {
                            question: 'Is Base64 a form of encryption?',
                            optionsJson: JSON.stringify(['Yes, it is strong encryption', 'No, it is just encoding', 'Only when combined with AES', 'Yes, if using a key']),
                            correctOption: 'No, it is just encoding',
                        },
                    ],
                },
            ],
        },
        {
            id: 'topic-network-security',
            title: 'Network Security',
            description: 'Understanding network protocols and security',
            orderIndex: 3,
            lessons: [
                {
                    id: 'lesson-http-headers',
                    title: 'HTTP Security Headers',
                    orderIndex: 1,
                    contentMarkdown: `# HTTP Security Headers\n\nHTTP response headers can significantly improve web security.\n\n## Important Security Headers\n\n### Content-Security-Policy (CSP)\nControls which resources the browser is allowed to load.\n\`\`\`\nContent-Security-Policy: default-src 'self'\n\`\`\`\n\n### X-Frame-Options\nPrevents clickjacking attacks by controlling iframe embedding.\n\`\`\`\nX-Frame-Options: DENY\n\`\`\`\n\n### Strict-Transport-Security (HSTS)\nForces HTTPS connections.\n\`\`\`\nStrict-Transport-Security: max-age=31536000; includeSubDomains\n\`\`\`\n\n### X-Content-Type-Options\nPrevents MIME sniffing.\n\`\`\`\nX-Content-Type-Options: nosniff\n\`\`\`\n\n## Exercise\n\nUse [securityheaders.com](https://securityheaders.com) to analyze a website's security headers.`,
                    quizzes: [
                        {
                            question: 'Which header prevents your page from being embedded in an iframe on another site?',
                            optionsJson: JSON.stringify(['Content-Security-Policy', 'X-Frame-Options', 'Strict-Transport-Security', 'X-Content-Type-Options']),
                            correctOption: 'X-Frame-Options',
                        },
                    ],
                },
            ],
        },
    ];

    for (const topic of topics) {
        const { lessons, ...topicData } = topic;
        await upsert('academyTopics', topic.id, topicData);

        for (const lesson of lessons) {
            const { quizzes, ...lessonData } = lesson;
            await upsert('lessons', lesson.id, { ...lessonData, topicId: topic.id });

            for (let i = 0; i < quizzes.length; i++) {
                await upsert('quizzes', `quiz-${lesson.id}-${i + 1}`, {
                    lessonId: lesson.id,
                    ...quizzes[i],
                });
            }
        }
    }
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
    console.log('🔥 Starting Firestore seed...\n');
    console.log(`   Project: ${process.env.FIREBASE_PROJECT_ID}`);

    await seedRoles();
    await seedBadges();
    await seedCategories();
    await seedChallenges();
    await seedAcademy();

    console.log('\n✅ Firestore seed complete!');
    console.log('\nFirestore Collections created:');
    console.log('  • roles, badges, categories');
    console.log('  • challenges, flags, hints');
    console.log('  • academyTopics, lessons, quizzes');
    console.log('\nNext steps:');
    console.log('  1. Go to Firebase Console → Firestore to verify the data');
    console.log('  2. Start backend: npm run dev');

    process.exit(0);
}

main().catch((err) => {
    console.error('\n❌ Seed failed:', err.message);
    process.exit(1);
});
