/**
 * Dcard 爬蟲腳本（Playwright 版）— 本機執行
 *
 * 安裝依賴（只需跑一次）：
 *   npm install -D playwright
 *   npx playwright install chromium
 *
 * 執行：
 *   npm run crawl-dcard
 *
 * 中斷續跑：把 RESUME_FROM 改成已處理的課程數再重跑
 *
 * 輸出：scripts/dcard_raw.json
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COURSES_PATH = path.join(__dirname, '../public/fcu_courses.json');
const OUTPUT_PATH  = path.join(__dirname, 'dcard_raw.json');

const POSTS_PER_COURSE  = 15;   // 每門課最多抓幾篇
const COMMENTS_PER_POST = 30;   // 每篇最多抓幾則留言
const REQUEST_DELAY_MS  = 1500; // 每次請求間隔（ms）
const RESUME_FROM       = 0;    // 中斷後繼續：填已處理的課程數

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function waitForEnter(prompt) {
    return new Promise(resolve => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question(prompt, () => { rl.close(); resolve(); });
    });
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

/** 用 Playwright page 打 Dcard API，借用瀏覽器的 cookie/headers */
async function apiGet(page, url) {
    const res = await page.evaluate(async (u) => {
        const r = await fetch(u, { credentials: 'include' });
        if (!r.ok) return null;
        return r.json();
    }, url);
    return res;
}

async function searchPosts(page, course, teacher) {
    const query = encodeURIComponent(`逢甲 ${course} ${teacher}`);
    const url = `https://www.dcard.tw/service/api/v2/search/posts?query=${query}&limit=${POSTS_PER_COURSE}&order=asc`;
    try {
        const data = await apiGet(page, url);
        if (!data) return [];
        return Array.isArray(data) ? data : (data.posts || []);
    } catch (e) {
        console.warn(`  搜尋失敗 [${course} ${teacher}]: ${e.message}`);
        return [];
    }
}

async function fetchComments(page, postId) {
    const url = `https://www.dcard.tw/service/api/v2/posts/${postId}/comments?limit=${COMMENTS_PER_POST}`;
    try {
        const data = await apiGet(page, url);
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

    // 讀取已有進度
    let results = [];
    if (fs.existsSync(OUTPUT_PATH) && RESUME_FROM > 0) {
        results = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
        console.log(`從第 ${RESUME_FROM} 筆繼續，已有 ${results.length} 筆\n`);
    }

    // 連接已開啟的 Chrome（需先用 --remote-debugging-port=9222 啟動）
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    const context = browser.contexts()[0] ?? await browser.newContext();
    const page = await context.newPage();

    // 讓使用者手動登入
    console.log('正在開啟 Dcard 登入頁面...');
    await page.goto('https://www.dcard.tw/login');
    await waitForEnter('\n請在瀏覽器視窗中登入 Dcard，登入完成後回到這裡按 Enter 繼續...');
    console.log('\n登入確認，開始爬取...\n');

    const todo = courses.slice(RESUME_FROM);
    let processed = RESUME_FROM;

    for (const c of todo) {
        processed++;
        process.stdout.write(`[${processed}/${courses.length}] ${c.course} / ${c.teacher} ... `);

        await sleep(REQUEST_DELAY_MS);
        const posts = await searchPosts(page, c.course, c.teacher);

        if (!posts.length) {
            console.log('無結果，略過');
            continue;
        }

        const enrichedPosts = [];
        for (const p of posts) {
            await sleep(REQUEST_DELAY_MS);
            const comments = await fetchComments(page, p.id);
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

        // 每 50 筆存一次，防止中斷遺失
        if (processed % 50 === 0) {
            fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2), 'utf-8');
            console.log(`  → 已存檔 (${processed} 筆)`);
        }
    }

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`\n完成！共 ${results.length} 門課有 Dcard 資料，存至 ${OUTPUT_PATH}`);

    await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
