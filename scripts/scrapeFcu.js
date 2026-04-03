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
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'https://coursesearch02.fcu.edu.tw/Service/Search.asmx';

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
//   sub_id3      = 課程代碼
//   scr_remarks  = 備註

function normalizeCourse(raw, year, sms) {
    const courseName = raw.sub_name || '';
    const teacher    = raw.scr_teacher || '';
    const credits    = raw.scr_credit ?? null;
    const selCode    = raw.scr_selcode || '';
    const times      = parsePeriodString(raw.scr_period || '');
    const required   = (raw.scj_scr_mso || '').includes('必修');

    return {
        course:   courseName.trim(),
        teacher:  teacher.trim(),
        credits:  credits !== null ? Number(credits) : null,
        times,
        selCode,
        semester: `${year}-${sms}`,
        dept:     raw.cls_name || '',
        required,
        note:     raw.scr_remarks || '',
        source:   'fcu_scrape',
    };
}

// Parse FCU period string like "(一)03-04 圖212 賴璉錡" or "(三)07-09 (五)11-13"
function parsePeriodString(str) {
    const dayMap = { '一': 'MON', '二': 'TUE', '三': 'WED', '四': 'THU', '五': 'FRI', '六': 'SAT', '日': 'SUN' };
    const slots = [];
    // Match patterns like (一)03 or (一)03-05
    const re = /[（(]([一二三四五六日])[)）](\d{2})(?:-(\d{2}))?/g;
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
        const key = `${c.course}|${c.teacher}|${c.times.join(',')}|${c.semester}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

async function main() {
    const { year, sms, out, delay } = parseArgs();

    // Determine which semesters to scrape.
    // Always include the requested semester; also add the other semester of the same year,
    // plus both semesters of the previous year for historical coverage.
    const targets = [];

    // Requested semester first
    targets.push({ year, sms });

    // The other semester of the same year
    const otherSms = sms === '1' ? '2' : '1';
    targets.push({ year, sms: otherSms });

    // Previous year, both semesters
    const prevYear = String(Number(year) - 1);
    targets.push({ year: prevYear, sms: '1' });
    targets.push({ year: prevYear, sms: '2' });

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

    // Global deduplicate across semesters
    const globalSeen = new Set();
    const deduped = allCourses.filter((c) => {
        const key = `${c.course}|${c.teacher}|${c.times.join(',')}|${c.semester}`;
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
    uniqueTargets.forEach(({ year: y, sms: s }) => {
        const count = deduped.filter(c => c.semester === `${y}-${s}`).length;
        console.log(`  ${y}-${s}: ${count} 筆`);
    });
}

main().catch((e) => {
    console.error('爬蟲執行失敗：', e);
    process.exit(1);
});
