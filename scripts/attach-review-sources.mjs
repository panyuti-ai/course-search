/**
 * 將 scripts/dcard_raw.json 裡的 Dcard 原文連結掛回 public/course_reviews.json。
 *
 * 使用方式：
 *   1. 先執行 npm run crawl-dcard 產生 scripts/dcard_raw.json
 *   2. 再執行 npm run attach-review-sources
 *
 * 只發布文章網址、標題與公開互動數，不會把完整貼文或留言複製到前端資料。
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_PATH = path.join(__dirname, 'dcard_raw.json');
const REVIEWS_PATH = path.join(__dirname, '../public/course_reviews.json');

function normalize(value) {
    return String(value || '').replace(/\s+/g, '').toLowerCase();
}

function keyFor(course, teacher) {
    return `${normalize(course)}|${normalize(teacher)}`;
}

function sourceFromPost(post) {
    const id = Number(post?.id);
    const forumAlias = String(post?.forumAlias || '').trim();
    const url = String(post?.url || '').trim()
        || (Number.isFinite(id) && forumAlias
            ? `https://www.dcard.tw/f/${forumAlias}/p/${id}`
            : '');
    if (!url) return null;
    return {
        url,
        title: String(post?.title || '').trim(),
        commentCount: Number(post?.commentCount) || 0,
        likeCount: Number(post?.likeCount) || 0,
    };
}

if (!fs.existsSync(RAW_PATH)) {
    console.error(`找不到 ${RAW_PATH}`);
    console.error('請先執行 npm run crawl-dcard 取得原始文章索引。');
    process.exit(1);
}

const rawGroups = JSON.parse(fs.readFileSync(RAW_PATH, 'utf8'));
const reviews = JSON.parse(fs.readFileSync(REVIEWS_PATH, 'utf8'));
const sourceIndex = new Map();

rawGroups.forEach((group) => {
    const sources = (Array.isArray(group?.posts) ? group.posts : [])
        .map(sourceFromPost)
        .filter(Boolean)
        .sort((a, b) => (b.commentCount + b.likeCount) - (a.commentCount + a.likeCount))
        .slice(0, 5);
    if (sources.length) sourceIndex.set(keyFor(group.course, group.teacher), sources);
});

let matched = 0;
const enriched = reviews.map((review) => {
    const sources = sourceIndex.get(keyFor(review.course, review.teacher));
    if (!sources?.length) return review;
    matched++;
    return { ...review, sources };
});

fs.writeFileSync(REVIEWS_PATH, `${JSON.stringify(enriched, null, 2)}\n`, 'utf8');
console.log(`完成：${matched}/${reviews.length} 筆心得已附上 Dcard 原文來源。`);
