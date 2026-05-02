/**
 * Dcard 爬蟲腳本（純 fetch + cookie 版）— 本機執行
 *
 * 使用方式：
 *   1. 用普通 Chrome 登入 dcard.tw
 *   2. F12 → Network → 任意 request → Request Headers → 複製 cookie: 整行值
 *   3. 貼到下方 DCARD_COOKIE，或用環境變數傳入：
 *        DCARD_COOKIE="..." node scripts/crawl-dcard.mjs
 *
 * 中斷續跑：把 RESUME_FROM 改成已處理的課程數再重跑
 *
 * 輸出：scripts/dcard_raw.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COURSES_PATH = path.join(__dirname, '../public/fcu_courses.json');
const OUTPUT_PATH  = path.join(__dirname, 'dcard_raw.json');

// ── 設定區 ────────────────────────────────────────────────────────────────────
const POSTS_PER_COURSE  = 15;   // 每門課最多抓幾篇
const COMMENTS_PER_POST = 30;   // 每篇最多抓幾則留言
const REQUEST_DELAY_MS  = 1500; // 每次請求間隔（ms）
const RESUME_FROM       = 0;    // 中斷後繼續：填已處理的課程數

// cookie 字串（從瀏覽器 DevTools 複製）
// 也可以用環境變數 DCARD_COOKIE="..." 傳入
const DCARD_COOKIE = process.env.DCARD_COOKIE || '';
// ─────────────────────────────────────────────────────────────────────────────

if (!DCARD_COOKIE) {
    console.error('❌  請設定 DCARD_COOKIE 環境變數，或在腳本頂端填入 cookie 字串。');
    console.error('   做法：Chrome 登入 dcard.tw → F12 → Network → 任意 request → Request Headers → 複製 cookie: 值');
    process.exit(1);
}

const HEADERS = {
    'accept':          'application/json, text/plain, */*',
    'accept-language': 'zh-TW,zh;q=0.9',
    'cookie':          DCARD_COOKIE,
    'referer':         'https://www.dcard.tw/',
    'user-agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'x-requested-with': 'XMLHttpRequest',
};

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function deduplicateCourses(courses) {
    const seen = new Set();
    return courses.filter(c => {
        const key = `${c.course}|${c.teacher}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

async function apiGet(url) {
    const res = await fetch(url, { headers: HEADERS });
    if (res.status === 429) {
        console.warn('  ⚠️  rate-limit，等 10 秒後重試…');
        await sleep(10_000);
        return apiGet(url);
    }
    if (!res.ok) {
        console.warn(`  HTTP ${res.status} for ${url}`);
        return null;
    }
    return res.json();
}

async function searchPosts(course, teacher) {
    const query = encodeURIComponent(`逢甲 ${course} ${teacher}`);
    const url = `https://www.dcard.tw/service/api/v2/search/posts?query=${query}&limit=${POSTS_PER_COURSE}&order=asc`;
    try {
        const data = await apiGet(url);
        if (!data) return [];
        return Array.isArray(data) ? data : (data.posts || []);
    } catch (e) {
        console.warn(`  搜尋失敗 [${course} ${teacher}]: ${e.message}`);
        return [];
    }
}

async function fetchComments(postId) {
    const url = `https://www.dcard.tw/service/api/v2/posts/${postId}/comments?limit=${COMMENTS_PER_POST}`;
    try {
        const data = await apiGet(url);
        if (!data) return [];
        return (Array.isArray(data) ? data : []).map(c => c.content || '').filter(Boolean);
    } catch {
        return [];
    }
}

async function main() {
    const raw = JSON.parse(fs.readFileSync(COURSES_PATH, 'utf-8'));
    const courses = deduplicateCourses(raw).filter(c => c.course && c.teacher);
    console.log(`共 ${courses.length} 門不重複課程（原始 ${raw.length} 筆）\n`);

    let results = [];
    if (fs.existsSync(OUTPUT_PATH) && RESUME_FROM > 0) {
        results = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
        console.log(`從第 ${RESUME_FROM} 筆繼續，已有 ${results.length} 筆\n`);
    }

    const todo = courses.slice(RESUME_FROM);
    let processed = RESUME_FROM;

    for (const c of todo) {
        processed++;
        process.stdout.write(`[${processed}/${courses.length}] ${c.course} / ${c.teacher} ... `);

        await sleep(REQUEST_DELAY_MS);
        const posts = await searchPosts(c.course, c.teacher);

        if (!posts.length) {
            console.log('無結果，略過');
            continue;
        }

        const enrichedPosts = [];
        for (const p of posts) {
            await sleep(REQUEST_DELAY_MS);
            const comments = await fetchComments(p.id);
            enrichedPosts.push({
                id:           p.id,
                title:        p.title || '',
                content:      p.content || '',
                likeCount:    p.likeCount || 0,
                commentCount: p.commentCount || 0,
                createdAt:    p.createdAt || '',
                comments,
            });
        }

        results.push({
            course:  c.course,
            teacher: c.teacher,
            posts:   enrichedPosts,
        });

        console.log(`${enrichedPosts.length} 篇`);

        if (processed % 50 === 0) {
            fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2), 'utf-8');
            console.log(`  → 已存檔 (${processed} 筆)`);
        }
    }

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`\n完成！共 ${results.length} 門課有 Dcard 資料，存至 ${OUTPUT_PATH}`);
}

main().catch(e => { console.error(e); process.exit(1); });
