"""
Dcard 爬蟲腳本（curl_cffi 版）— 本機 Windows 執行

安裝依賴（只需跑一次）：
    pip install curl_cffi

使用方式：
    1. 用普通 Chrome 登入 dcard.tw
    2. F12 → Network → 任意 request → Request Headers → 複製 cookie: 整行值
    3. PowerShell 執行：
         $env:DCARD_COOKIE='貼上cookie值'
         python scripts/crawl_dcard.py

中斷續跑：把 RESUME_FROM 改成已處理的課程數再重跑

輸出：scripts/dcard_raw.json
"""

import json
import os
import sys
import time
from pathlib import Path

try:
    from curl_cffi import requests as cf_requests
except ImportError:
    print("❌  請先安裝 curl_cffi：pip install curl_cffi")
    sys.exit(1)

BASE_DIR      = Path(__file__).parent
COURSES_PATH  = BASE_DIR / "../public/fcu_courses.json"
OUTPUT_PATH   = BASE_DIR / "dcard_raw.json"

# ── 設定區 ────────────────────────────────────────────────────────────────────
POSTS_PER_COURSE  = 15
COMMENTS_PER_POST = 30
REQUEST_DELAY_S   = 1.5
RESUME_FROM       = 0
# ─────────────────────────────────────────────────────────────────────────────

DCARD_COOKIE = os.environ.get("DCARD_COOKIE", "")
if not DCARD_COOKIE:
    print("❌  請設定 DCARD_COOKIE 環境變數。")
    print("   PowerShell: $env:DCARD_COOKIE='cookie值'")
    sys.exit(1)

SESSION = cf_requests.Session(impersonate="chrome124")
SESSION.headers.update({
    "accept":          "application/json, text/plain, */*",
    "accept-language": "zh-TW,zh;q=0.9",
    "referer":         "https://www.dcard.tw/",
})
# 把 cookie 字串轉成 dict
for part in DCARD_COOKIE.split(";"):
    kv = part.strip().split("=", 1)
    if len(kv) == 2:
        SESSION.cookies.set(kv[0].strip(), kv[1].strip())


def api_get(url: str):
    for attempt in range(3):
        try:
            r = SESSION.get(url, timeout=15)
            if r.status_code == 429:
                print("  ⚠️  rate-limit，等 10 秒後重試…")
                time.sleep(10)
                continue
            if r.status_code != 200:
                print(f"  HTTP {r.status_code}")
                return None
            return r.json()
        except Exception as e:
            if attempt == 2:
                print(f"  請求失敗: {e}")
            time.sleep(2)
    return None


def search_posts(course: str, teacher: str):
    from urllib.parse import quote
    query = quote(f"逢甲 {course} {teacher}")
    url = f"https://www.dcard.tw/service/api/v2/search/posts?query={query}&limit={POSTS_PER_COURSE}&order=asc"
    data = api_get(url)
    if not data:
        return []
    return data if isinstance(data, list) else data.get("posts", [])


def fetch_comments(post_id) -> list[str]:
    url = f"https://www.dcard.tw/service/api/v2/posts/{post_id}/comments?limit={COMMENTS_PER_POST}"
    data = api_get(url)
    if not data:
        return []
    return [c.get("content", "") for c in data if c.get("content")]


def deduplicate(courses):
    seen = set()
    out = []
    for c in courses:
        key = f"{c.get('course')}|{c.get('teacher')}"
        if key not in seen:
            seen.add(key)
            out.append(c)
    return out


def main():
    raw = json.loads(COURSES_PATH.read_text(encoding="utf-8"))
    courses = [c for c in deduplicate(raw) if c.get("course") and c.get("teacher")]
    print(f"共 {len(courses)} 門不重複課程（原始 {len(raw)} 筆）\n")

    results = []
    if OUTPUT_PATH.exists() and RESUME_FROM > 0:
        results = json.loads(OUTPUT_PATH.read_text(encoding="utf-8"))
        print(f"從第 {RESUME_FROM} 筆繼續，已有 {len(results)} 筆\n")

    # 連線測試
    print("正在測試連線...")
    test = api_get("https://www.dcard.tw/service/api/v2/search/posts?query=%E9%80%A2%E7%94%B2&limit=1")
    if test is None:
        print("❌  無法連到 Dcard API，請重新複製 cookie 再試。")
        sys.exit(1)
    print("✅  連線成功，開始爬取...\n")

    todo = courses[RESUME_FROM:]
    processed = RESUME_FROM

    for c in todo:
        processed += 1
        print(f"[{processed}/{len(courses)}] {c['course']} / {c['teacher']} ... ", end="", flush=True)

        time.sleep(REQUEST_DELAY_S)
        posts = search_posts(c["course"], c["teacher"])

        if not posts:
            print("無結果，略過")
            continue

        enriched = []
        for p in posts:
            time.sleep(REQUEST_DELAY_S)
            comments = fetch_comments(p["id"])
            enriched.append({
                "id":           p["id"],
                "title":        p.get("title", ""),
                "content":      p.get("content", ""),
                "likeCount":    p.get("likeCount", 0),
                "commentCount": p.get("commentCount", 0),
                "createdAt":    p.get("createdAt", ""),
                "comments":     comments,
            })

        results.append({
            "course":  c["course"],
            "teacher": c["teacher"],
            "posts":   enriched,
        })
        print(f"{len(enriched)} 篇")

        if processed % 50 == 0:
            OUTPUT_PATH.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
            print(f"  → 已存檔 ({processed} 筆)")

    OUTPUT_PATH.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n完成！共 {len(results)} 門課有 Dcard 資料，存至 {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
