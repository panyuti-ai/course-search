import { readFile } from 'node:fs/promises';

// Match the course cards: discard generated filler, and never use the generated
// 「結論」 as a student's assessment or manufacture a numeric rating from text.
const REVIEW_NOISE = [
  /共\s*\d+\s*則留言[^。]*。?/g,
  /有此相同課程名稱心得，但請先注意是否為該老師（[^）]*）所開之課程。?/g,
  /未配對到對應課程，但有這位老師相關的心得。?/g,
];
const text = value => typeof value === 'string' ? value.trim() : '';
const courseKey = value => text(value).replace(/\s+/g, '')
  .replace(/[\uff01-\uff5e]/g, char => String.fromCharCode(char.charCodeAt(0) - 0xfee0)).toLowerCase();
const teachers = value => text(value).split(/[,，、\/]/).map(name => name.trim()).filter(Boolean);

export function buildCourseReviewIndex(records) {
  const byCourse = new Map();
  const byTeacher = new Map();
  for (const record of Array.isArray(records) ? records : []) {
    let summary = text(record?.['整體評價']);
    for (const noise of REVIEW_NOISE) summary = summary.replace(noise, '');
    summary = summary.replace(/^[\s。、，]+|[\s。、，]+$/g, '');
    const key = courseKey(record?.course);
    if (!key || summary.length < 6) continue;
    const names = teachers(record.teacher);
    const entry = { course: text(record.course), key, teachers: names, style: text(record['上課方式']), summary };
    const named = byCourse.get(key) || [];
    named.push(entry);
    byCourse.set(key, named);
    // A joint-teacher review cannot be attributed to an individual teacher.
    if (names.length !== 1) continue;
    const taught = byTeacher.get(names[0]) || [];
    if (!taught.some(other => other.key === key && other.summary === summary)) taught.push(entry);
    byTeacher.set(names[0], taught);
  }
  return { byCourse, byTeacher };
}

function compact(entry) {
  return { course: entry.course.slice(0, 80), teacher: entry.teachers.join('、').slice(0, 120),
    style: entry.style.slice(0, 100), summary: entry.summary.slice(0, 500) };
}

export function findCourseReviewEvidence(course, index) {
  const key = courseKey(course.course);
  const names = new Set(teachers(course.teacher));
  const exact = (index.byCourse.get(key) || []).filter(entry => entry.teachers.some(name => names.has(name)));
  if (exact.length) {
    const best = exact.reduce((a, b) => b.summary.length > a.summary.length ? b : a);
    return { scope: 'course', entries: [compact(best)] };
  }
  const seen = new Set();
  const references = [...names].flatMap(name => index.byTeacher.get(name) || [])
    .filter(entry => {
      const identity = `${entry.key}|${entry.teachers[0]}|${entry.summary}`;
      if (entry.key === key || seen.has(identity)) return false;
      seen.add(identity);
      return true;
    }).slice(0, 2);
  return { scope: references.length ? 'teacher' : 'none', entries: references.map(compact) };
}

let cachedIndex;
export async function readCourseReviewIndex() {
  if (!cachedIndex) {
    cachedIndex = readFile(new URL('../public/course_reviews.json', import.meta.url), 'utf8')
      .then(contents => {
        const records = JSON.parse(contents);
        if (!Array.isArray(records)) throw new Error('Course reviews must be an array');
        return buildCourseReviewIndex(records);
      }).catch(error => { cachedIndex = undefined; throw error; });
  }
  return cachedIndex;
}
