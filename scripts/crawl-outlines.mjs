import 'dotenv/config';
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchOutline, createSummaryCache, outlineKey, validCourseIdentity, safeOutlineError } from '../lib/course-outlines.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const option = (name, fallback) => { const i = args.indexOf(name); return i < 0 ? fallback : args[i + 1]; };
const semester = option('--semester', '115-1');
const limit = Number(option('--limit', Infinity));
const delay = Number(option('--delay', 500));
const concurrency = Number(option('--concurrency', 2));
const output = resolve(option('--out', resolve(root, 'public/course_outlines.json')));
const summaryOnly = args.includes('--summarize-only');
const withAI = summaryOnly || args.includes('--summarize');
const maxConcurrency = summaryOnly ? 6 : 3;
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > maxConcurrency) throw new Error(`Concurrency must be 1 to ${maxConcurrency}`);
if (!validCourseIdentity(semester, '0001') || !(limit > 0) || !Number.isFinite(delay) || delay < 200) throw new Error('Invalid semester, limit or delay (minimum 200 ms)');
if (withAI && !process.env.COURSE_SUMMARY_API_KEY && !process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
  throw new Error('AI credential missing; add it securely before --summarize or --summarize-only. Fetch-only remains available.');
}
const catalog = JSON.parse(await readFile(resolve(root, 'public/fcu_courses.json'), 'utf8'));
const all = [...new Map(catalog.filter(c => c.semester === semester && validCourseIdentity(c.semester, c.selCode)).map(c => [outlineKey(c.semester,c.selCode),c])).values()];
if (!all.length) throw new Error('No matching catalog courses');
let data = {version:1,records:{}};
try { data = JSON.parse(await readFile(output, 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
if (data.version !== 1 || !data.records || typeof data.records !== 'object' || Array.isArray(data.records)) throw new Error('Invalid existing dataset; refusing to overwrite');
const summarizeCached = createSummaryCache(Object.values(data.records));
await mkdir(dirname(output), {recursive:true});
let writing = Promise.resolve();
function checkpoint() {
  writing = writing.then(async () => {
  data.updatedAt = new Date().toISOString();
  data.coverage = {semester,total:all.length,fetched:all.filter(c=>data.records[outlineKey(c.semester,c.selCode)]).length,
    summarized:all.filter(c=>data.records[outlineKey(c.semester,c.selCode)]?.ai?.sourceHash === data.records[outlineKey(c.semester,c.selCode)]?.contentHash && data.records[outlineKey(c.semester,c.selCode)]?.ai).length};
  const temporary = `${output}.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify(data,null,2)+'\n');
  await rename(temporary,output);
  });
  return writing;
}
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const hasLearning = record => Boolean(record && (record.description || record.objectives?.length || record.topics?.length));
let processed=0,failures=0,consecutiveFailures=0,cursor=0,stopping=false;
process.on('SIGINT',()=>{stopping=true;});
process.on('SIGTERM',()=>{stopping=true;});
async function worker() {
while (!stopping && cursor < all.length && processed < limit) {
  const course=all[cursor++];
  const key=outlineKey(course.semester,course.selCode);
  let record=data.records[key];
  if (summaryOnly && !hasLearning(record)) continue;
  if (record && (!withAI || !hasLearning(record) || record.ai?.sourceHash === record.contentHash) && !args.includes('--refresh')) continue;
  if (processed >= limit) break;
  processed++;
  const taskNumber=processed;
  try {
    if (!record || (!summaryOnly && args.includes('--refresh'))) {
      const fresh=await fetchOutline(course.semester,course.selCode);
      record={...fresh,course:course.course,teacher:course.teacher};
      if (data.records[key]?.ai?.sourceHash === record.contentHash) record.ai=data.records[key].ai;
      data.records[key]=record;
      await checkpoint(); // preserve newly fetched official data even if the AI operation fails
    }
    if (withAI && hasLearning(record) && record.ai?.sourceHash !== record.contentHash) {
      record.ai=await summarizeCached(record,course);
      await checkpoint();
    }
    consecutiveFailures=0;
    console.log(`${taskNumber} ${semester}/${course.selCode}: official${record.ai ? ' + AI' : ''} saved`);
  } catch (error) {
    failures++;consecutiveFailures++;
    // Errors never include token-bearing redirect URLs or upstream response bodies.
    console.error(`${semester}/${course.selCode}: ${safeOutlineError(error)}`);
    if (consecutiveFailures >= 3) { console.error('Three consecutive failures; stopping to avoid hammering the upstream. Rerun resumes saved progress.'); stopping=true; break; }
    await pause(2000 * consecutiveFailures);
  }
  await pause(delay);
}
}
await Promise.all(Array.from({length:concurrency},worker));
await checkpoint();
console.log(JSON.stringify(data.coverage));
if (failures) process.exitCode=1;
