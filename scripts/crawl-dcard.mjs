/**
 * Dcard 爬蟲腳本（curl 子程序版）— 本機 Windows 執行
 *
 * 使用方式：
 *   1. 用普通 Chrome 登入 dcard.tw
 *   2. F12 → Network → 任意 request → Request Headers → 複製 cookie: 整行值
 *   3. PowerShell 執行：
 *        $env:DCARD_COOKIE='貼上cookie值'
 *        npm run crawl-dcard
 *
 * 中斷續跑：把 RESUME_FROM 改成已處理的課程數再重跑
 *
 * 輸出：scripts/dcard_raw.json
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COURSES_PATH = path.join(__dirname, '../public/fcu_courses.json');
const OUTPUT_PATH  = path.join(__dirname, 'dcard_raw.json');

// ── 設定區 ────────────────────────────────────────────────────────────────────
const POSTS_PER_COURSE  = 15;
const COMMENTS_PER_POST = 30;
const REQUEST_DELAY_MS  = 1500;
const RESUME_FROM       = 0;

const DCARD_COOKIE = process.env.DCARD_COOKIE || '';
// ─────────────────────────────────────────────────────────────────────────────

if (!DCARD_COOKIE) {
    console.error('❌  請設定 DCARD_COOKIE 環境變數。');
    console.error('   PowerShell: $env:DCARD_COOKIE=\'cookie值\'');
    process.exit(1);
}

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

function curlGet(url) {
    // 用系統 curl，TLS 指紋與 Node.js 不同，可繞過 Cloudflare JA3 偵測
    const cookieEscaped = DCARD_COOKIE.replace(/'/g, "'\\''");
    const cmd = [
        'curl.exe', '-s', '-L',
        '--max-time', '15',
        '-H', `"accept: application/json, text/plain, */*"`,
        '-H', `"accept-language: zh-TW,zh;q=0.9"`,
        '-H', `"referer: https://www.dcard.tw/"`,
        '-H', `"user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"`,
        '-H', `"cookie: ${DCARD_COOKIE.replace(/"/g, '\\"')}"`,
        `"${url}"`,
    ].join(' ');

    try {
        const out = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
        if (!out || !out.trim()) return null;
        return JSON.parse(out);
    } catch {
        return null;
    }
}

async function apiGet(url) {
    let data = curlGet(url);
    if (data === null) {
        // 簡單重試一次
        await sleep(3000);
        data = curlGet(url);
    }
    return data;
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

    // 先測試 curl 是否可用且能打通 Dcard
    console.log('正在測試連線...');
    const test = curlGet('https://www.dcard.tw/service/api/v2/search/posts?query=%E9%80%A2%E7%94%B2&limit=1');
    if (!test) {
        console.error('❌  無法連到 Dcard API，請確認：\n  1. curl 指令存在（在 PowerShell 輸入 curl --version）\n  2. cookie 有效（重新從瀏覽器複製）');
        process.exit(1);
    }
    console.log('✅  連線成功，開始爬取...\n');

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
