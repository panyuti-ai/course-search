/**
 * scrapeFcu.js
 * 爬逢甲大學課程檢索系統，將當學期所有課程存入 public/fcu_courses.json
 *
 * 用法：
 *   node scripts/scrapeFcu.js --year 113 --sms 2
 *   node scripts/scrapeFcu.js          ← 自動判斷當前學年學期
 *
 * 參數：
 *   --year   學年 (e.g. 113)
 *   --sms    學期 1=上學期 2=下學期 3=暑期甲 4=暑期乙
 *   --out    輸出路徑 (預設 public/fcu_courses.json)
 *   --delay  每次請求間隔 ms (預設 300)
 *   --only   只抓指定的那一個學期，不自動補抓其他學期
 *   --merge  併入輸出檔既有資料：只取代這次抓到的學期，其餘學期原封不動保留
 *
 * 只更新單一學期又不想洗掉舊資料時：
 *   node scripts/scrapeFcu.js --year 115 --sms 1 --only --merge
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.FCU_BASE_URL || 'https://coursesearch02.fcu.edu.tw/Service/Search.asmx';

// ── CLI 參數解析 ──────────────────────────────────────────────
function parseArgs() {
    const args = process.argv.slice(2);
    const get = (flag) => {
        const i = args.indexOf(flag);
        return i !== -1 && args[i + 1] ? args[i + 1] : null;
    };

    // 自動推算學年學期（台灣學年）
    const now = new Date();
    const month = now.getMonth() + 1;
    const twYear = now.getFullYear() - 1911;
    let year = get('--year') || String(month >= 8 ? twYear : twYear - 1);
    let sms  = get('--sms')  || (month >= 2 && month <= 7 ? '2' : '1');

    return {
        year,
        sms,
        out:   get('--out')   || path.join(__dirname, '../public/fcu_courses.json'),
        delay: Number(get('--delay') || 300),
        only:  args.includes('--only'),
        merge: args.includes('--merge'),
    };
}

// ── HTTP helper ───────────────────────────────────────────────
async function post(endpoint, body) {
    const res = await fetch(`${BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} on ${endpoint}`);
    return res.json();
}

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

// ── 抓部門清單 ────────────────────────────────────────────────
async function fetchDeptList(baseOptions) {
    // GetType1Result with unitId="*" pulls every dept; we need the college list first
    // Try fetching degree=1 (undergraduate) with empty deptId to see what the API returns
    const data = await post('GetType1Result', {
        baseOptions,
        typeOptions: { degree: '1', deptId: '', unitId: '', classId: '' },
    });
    return data;
}

// ── 抓單一科系所有課程 ─────────────────────────────────────────
async function fetchUnitCourses(baseOptions, degree, deptId, unitId) {
    const data = await post('GetType1Result', {
        baseOptions,
        typeOptions: { degree, deptId, unitId, classId: '*' },
    });
    return Array.isArray(data?.items) ? data.items : [];
}

// ── 用 Type2 搜尋全部課程（不限科系）─────────────────────────
async function fetchAllByType2(baseOptions, delay) {
    // Search with no filters returns everything for the semester
    // We page through by iterating over weekdays (MON-FRI) + "*"
    const days = ['*', '1', '2', '3', '4', '5', '6', '7'];
    const allItems = new Map();

    for (const week of days) {
        await sleep(delay);
        try {
            const data = await post('GetType2Result', {
                baseOptions,
                typeOptions: {
                    code:              { enabled: false, value: '' },
                    weekPeriod:        { enabled: week !== '*', week, period: '*' },
                    course:            { enabled: false, value: '' },
                    teacher:           { enabled: false, value: '' },
                    useEnglish:        { enabled: false },
                    useLanguage:       { enabled: false, value: '01' },
                    specificSubject:   { enabled: false, value: '1' },
                    courseDescription: { enabled: false, value: '' },
                },
            });
            const items = Array.isArray(data?.items) ? data.items : [];
            items.forEach((item) => {
                const key = item.selCode || item.courseId || JSON.stringify(item);
                if (!allItems.has(key)) allItems.set(key, item);
            });
            console.log(`  day=${week}: got ${items.length} courses (total unique: ${allItems.size})`);
        } catch (e) {
            console.warn(`  day=${week} failed: ${e.message}`);
        }
    }
    return Array.from(allItems.values());
}

// ── 課程格式轉換 ──────────────────────────────────────────────
// Actual FCU API field names (from live response):
//   sub_name     = 課程名稱
//   scr_teacher  = 教師
//   scr_credit   = 學分
//   scr_selcode  = 選課代碼
//   cls_name     = 班級名稱
//   scr_period   = 時間字串 e.g. "(一)03-04 圖212_資訊素養 賴璉錡"
//   scj_scr_mso  = 必/選修
//   sub_id3      = 課程編碼（如 IECS4927，跨學期穩定）
//   scr_remarks  = 備註
//   scr_acptcnt  = 實收名額（已選上人數）
//   scr_precnt   = 開放名額（上限）
//   scr_english  = 是否全英語授課 EMI，Y/N
//   scr_ldl      = 上課方式（課堂教學／遠距…）
//   scr_date     = 開課期間（全學期／期中前…）
// 未取用：unt_ls、cls_id、sub_id、scr_dup（校內流水號），
//         scr_examid／scr_examfn／scr_exambf（疑似考試相關，語意未確認）

// 去重鍵。選課代碼是一個「班級」的唯一識別，必須納入：同一門課常同時開給多個
// 班級（例如 IECS4927 開給資訊四甲／乙／丙／丁），四筆的課名、教師、時間、學期
// 完全相同，只有班級與名額不同（56/60、56/60、58/60、69/69）。若不納入選課代碼，
// 四筆會被併成一筆，留下的名額只代表其中某一班，對其他班的學生是錯的。
// selCode 缺漏時退回原本的比對方式。
function plannerCourseKey(c) {
    const base = `${c.course}|${c.teacher}|${c.times.join(',')}|${c.semester}`;
    return c.selCode ? `${base}|${c.selCode}` : base;
}

function toCountOrNull(value) {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

function normalizeCourse(raw, year, sms) {
    const courseName = raw.sub_name || '';
    const teacher    = raw.scr_teacher || '';
    const credits    = raw.scr_credit ?? null;
    const selCode    = raw.scr_selcode || '';
    const period     = raw.scr_period || '';
    const times      = parsePeriodString(period);
    const required   = (raw.scj_scr_mso || '').includes('必修');

    return {
        course:     courseName.trim(),
        teacher:    teacher.trim(),
        credits:    credits !== null ? Number(credits) : null,
        times,
        rooms:      parseRoomsFromPeriod(period, teacher),
        selCode,
        courseCode: (raw.sub_id3 || '').trim(),
        semester:   `${year}-${sms}`,
        dept:       raw.cls_name || '',
        required,
        enrolled:   toCountOrNull(raw.scr_acptcnt),
        capacity:   toCountOrNull(raw.scr_precnt),
        emi:        (raw.scr_english || '').trim().toUpperCase() === 'Y',
        mode:       (raw.scr_ldl || '').trim(),
        dateRange:  (raw.scr_date || '').trim(),
        note:       raw.scr_remarks || '',
        source:     'fcu_scrape',
    };
}

// 節次標記，例如 (一)03 或 (一)03-05。parsePeriodString 與 parseRoomsFromPeriod 共用。
const PERIOD_RE = /[（(]([一二三四五六日])[)）](\d{2})(?:-(\d{2}))?/g;

// Parse FCU period string like "(一)03-04 圖212 賴璉錡" or "(三)07-09 (五)11-13"
function parsePeriodString(str) {
    const dayMap = { '一': 'MON', '二': 'TUE', '三': 'WED', '四': 'THU', '五': 'FRI', '六': 'SAT', '日': 'SUN' };
    const slots = [];
    const re = new RegExp(PERIOD_RE.source, 'g');
    let m;
    while ((m = re.exec(str)) !== null) {
        const day = dayMap[m[1]];
        if (!day) continue;
        const start = parseInt(m[2], 10);
        const end   = m[3] ? parseInt(m[3], 10) : start;
        for (let p = start; p <= end; p++) {
            slots.push(`${day}${p}`);
        }
    }
    return slots;
}

// 從節次字串裡取出教室。教室緊接在每個節次標記之後，例如
//   "(二)05     學209 王治強"                  → 學209
//   "(二)05 未排教室 (三)05 未排教室 周兆龍,…"  → 未排教室
// 但教室可能整個不存在，此時該位置直接是教師名：
//   "(一)00 曾怡享"                            → 無教室
// 因此用 scr_teacher 的內容排除教師名。回傳去重後的陣列，順序保留。
function parseRoomsFromPeriod(str, teacher) {
    const text = String(str || '');
    const teacherNames = new Set(
        String(teacher || '').split(/[,，、\/\s]+/).map((t) => t.trim()).filter(Boolean)
    );

    // 先蒐集所有節次標記的位置，教室就落在相鄰兩個標記之間
    const re = new RegExp(PERIOD_RE.source, 'g');
    const marks = [];
    let m;
    while ((m = re.exec(text)) !== null) {
        marks.push({ end: m.index + m[0].length, start: m.index });
    }

    const rooms = [];
    const seen = new Set();
    marks.forEach((mark, i) => {
        const until = i + 1 < marks.length ? marks[i + 1].start : text.length;
        const token = text.slice(mark.end, until).trim().split(/\s+/)[0] || '';
        if (!token) return;
        // 教師名可能以逗號串接，取第一個名字判斷即可
        if (teacherNames.has(token.split(/[,，、]/)[0])) return;
        if (seen.has(token)) return;
        seen.add(token);
        rooms.push(token);
    });
    return rooms;
}

// ── 主流程 ────────────────────────────────────────────────────
async function scrapeSemester(year, sms, delay) {
    const baseOptions = { lang: 'cht', year, sms };
    console.log(`\n  ── 學年=${year} 學期=${sms} ──`);

    let rawItems = await fetchAllByType2(baseOptions, delay);

    if (!rawItems.length) {
        console.log('  → Type2 無結果，改用課名空字串搜尋...');
        await sleep(delay);
        try {
            const data = await post('GetType2Result', {
                baseOptions,
                typeOptions: {
                    code:              { enabled: false, value: '' },
                    weekPeriod:        { enabled: false, week: '*', period: '*' },
                    course:            { enabled: true,  value: '' },
                    teacher:           { enabled: false, value: '' },
                    useEnglish:        { enabled: false },
                    useLanguage:       { enabled: false, value: '01' },
                    specificSubject:   { enabled: false, value: '1' },
                    courseDescription: { enabled: false, value: '' },
                },
            });
            rawItems = Array.isArray(data?.items) ? data.items : [];
        } catch (e) {
            console.warn(`  → 搜尋失敗：${e.message}`);
        }
    }

    const courses = rawItems
        .map((r) => normalizeCourse(r, year, sms))
        .filter((c) => c.course.length >= 2);

    const seen = new Set();
    return courses.filter((c) => {
        const key = plannerCourseKey(c);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

async function main() {
    const { year, sms, out, delay, only, merge } = parseArgs();

    // Determine which semesters to scrape.
    // Always include the requested semester; unless --only is given, also add the other
    // semester of the same year plus both semesters of the previous year.
    const targets = [];

    // Requested semester first
    targets.push({ year, sms });

    if (!only) {
        // The other semester of the same year
        const otherSms = sms === '1' ? '2' : '1';
        targets.push({ year, sms: otherSms });

        // Previous year, both semesters
        const prevYear = String(Number(year) - 1);
        targets.push({ year: prevYear, sms: '1' });
        targets.push({ year: prevYear, sms: '2' });
    }

    // Deduplicate target list
    const seen = new Set();
    const uniqueTargets = targets.filter(({ year: y, sms: s }) => {
        const key = `${y}-${s}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    console.log(`\n逢甲課程爬蟲  抓取學期：${uniqueTargets.map(t => `${t.year}-${t.sms}`).join(', ')}\n`);

    const allCourses = [];
    for (const target of uniqueTargets) {
        const courses = await scrapeSemester(target.year, target.sms, delay);
        console.log(`  → ${target.year}-${target.sms}: ${courses.length} 筆`);
        allCourses.push(...courses);
    }

    // --merge：保留輸出檔裡「這次沒抓的學期」，只取代這次抓到的學期。
    // 抓到 0 筆時直接中止，避免把既有資料覆蓋成空檔。
    let kept = [];
    if (merge) {
        if (!allCourses.length) {
            throw new Error('--merge 模式下這次一筆都沒抓到，為避免洗掉既有資料，已中止寫入。');
        }
        if (fs.existsSync(out)) {
            let existing;
            try {
                existing = JSON.parse(fs.readFileSync(out, 'utf-8'));
            } catch (e) {
                throw new Error(`--merge 無法解析既有檔案 ${out}：${e.message}`);
            }
            if (!Array.isArray(existing)) {
                throw new Error(`--merge 既有檔案 ${out} 不是陣列，已中止寫入。`);
            }
            const scrapedSemesters = new Set(uniqueTargets.map(({ year: y, sms: s }) => `${y}-${s}`));
            kept = existing.filter((c) => !scrapedSemesters.has(c?.semester));
            console.log(`\n  merge：保留既有 ${kept.length} 筆（未被這次抓取涵蓋的學期）`);
        } else {
            console.log(`\n  merge：${out} 尚不存在，等同全新建立`);
        }
    }

    // Global deduplicate across semesters
    const globalSeen = new Set();
    const deduped = [...kept, ...allCourses].filter((c) => {
        const key = plannerCourseKey(c);
        if (globalSeen.has(key)) return false;
        globalSeen.add(key);
        return true;
    });

    const outDir = path.dirname(out);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(out, JSON.stringify(deduped, null, 2), 'utf-8');

    const depts = new Set(deduped.map((c) => c.dept).filter(Boolean));
    console.log(`\n✓ 已寫入 ${out}`);
    console.log(`  總課程數：${deduped.length}  科系數：${depts.size}`);
    const bySemester = new Map();
    deduped.forEach((c) => {
        const key = c.semester || '(未知)';
        bySemester.set(key, (bySemester.get(key) || 0) + 1);
    });
    const scrapedSemesters = new Set(uniqueTargets.map(({ year: y, sms: s }) => `${y}-${s}`));
    Array.from(bySemester.keys()).sort().forEach((key) => {
        const mark = scrapedSemesters.has(key) ? '（本次抓取）' : '（沿用既有）';
        console.log(`  ${key}: ${bySemester.get(key)} 筆 ${mark}`);
    });
}

// 僅在直接以 node 執行時啟動爬蟲；被 import 時不執行，以便對解析函式做單元測試。
const invokedDirectly = process.argv[1]
    && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (invokedDirectly) {
    main().catch((e) => {
        console.error('爬蟲執行失敗：', e);
        process.exit(1);
    });
}

export { normalizeCourse, parsePeriodString, parseRoomsFromPeriod };
