/**
 * Dcard 爬蟲腳本 — 本機執行
 * 用法：node scripts/crawl-dcard.mjs
 *
 * 輸出：scripts/dcard_raw.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COURSES_PATH = path.join(__dirname, '../public/fcu_courses.json');
const OUTPUT_PATH  = path.join(__dirname, 'dcard_raw.json');

const DCARD_SEARCH_API = 'https://www.dcard.tw/service/api/v2/search/posts';
const DCARD_POST_API   = 'https://www.dcard.tw/service/api/v2/posts';

const POSTS_PER_COURSE  = 15;   // 每門課最多抓幾篇
const COMMENTS_PER_POST = 30;   // 每篇最多抓幾則留言
const REQUEST_DELAY_MS  = 1200; // 每次請求間隔（避免被封）
const RESUME_FROM       = 0;    // 中斷後繼續：填已處理的課程數

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
    'Referer': 'https://www.dcard.tw/',
    'Accept': 'application/json',
};

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function fetchJSON(url) {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
    return res.json();
}

/** 搜尋某門課的文章清單，從最舊到最新 */
async function searchPosts(course, teacher) {
    const query = encodeURIComponent(`逢甲 ${course} ${teacher}`);
    const url = `${DCARD_SEARCH_API}?query=${query}&limit=${POSTS_PER_COURSE}&order=asc`;
    try {
        const data = await fetchJSON(url);
        return Array.isArray(data) ? data : (data.posts || []);
    } catch (e) {
        console.warn(`  搜尋失敗 [${course} ${teacher}]: ${e.message}`);
        return [];
    }
}

/** 抓單篇文章的留言 */
async function fetchComments(postId) {
    const url = `${DCARD_POST_API}/${postId}/comments?limit=${COMMENTS_PER_POST}`;
    try {
        const data = await fetchJSON(url);
        return (Array.isArray(data) ? data : []).map(c => c.content || '').filter(Boolean);
    } catch {
        return [];
    }
}

/** 去重：同課名+老師只處理一次 */
function deduplicateCourses(courses) {
    const seen = new Set();
    return courses.filter(c => {
        const key = `${c.course}|${c.teacher}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

async function main() {
    const raw = JSON.parse(fs.readFileSync(COURSES_PATH, 'utf-8'));
    const courses = deduplicateCourses(raw).filter(c => c.course && c.teacher);
    console.log(`共 ${courses.length} 門不重複課程（原始 ${raw.length} 筆）`);

    // 讀取已有進度（支援中斷續跑）
    let results = [];
    if (fs.existsSync(OUTPUT_PATH) && RESUME_FROM > 0) {
        results = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
        console.log(`從第 ${RESUME_FROM} 筆繼續，已有 ${results.length} 筆`);
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
                id:       p.id,
                title:    p.title || '',
                content:  p.content || '',
                likeCount: p.likeCount || 0,
                commentCount: p.commentCount || 0,
                createdAt: p.createdAt || '',
                comments,
            });
        }

        results.push({
            course:  c.course,
            teacher: c.teacher,
            posts:   enrichedPosts,
        });

        console.log(`${enrichedPosts.length} 篇`);

        // 每 50 筆存一次，防止中斷遺失
        if (processed % 50 === 0) {
            fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2), 'utf-8');
            console.log(`  → 已存檔 (${processed} 筆)`);
        }
    }

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`\n完成！共 ${results.length} 門課有 Dcard 資料，存至 ${OUTPUT_PATH}`);
}

main().catch(e => { console.error(e); process.exit(1); });
