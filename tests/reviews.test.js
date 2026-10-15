import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildCourseReviewIndex, findCourseReviewEvidence } from '../lib/course-reviews.js';

const review = (course, teacher, summary, style = '') => ({ course, teacher, 整體評價: summary, 上課方式: style });

test('reviews match both course and teacher, retain qualitative workload evidence and do not invent ratings', () => {
  const index = buildCourseReviewIndex([
    review('程式設計(一)', '甲老師', '每週都有作業與小考。', '每週作業'),
    review('程式設計(一)', '甲老師', '每週都有作業與小考，期末需要完成分組專題。', '每週作業、分組報告'),
    review('程式設計(一)', '乙老師', '平時沒有作業，只需完成期末報告。'),
  ]);
  const evidence = findCourseReviewEvidence({ course: '程式設計（一）', teacher: '甲老師' }, index);
  assert.equal(evidence.scope, 'course');
  assert.equal(evidence.entries.length, 1);
  assert.equal(evidence.entries[0].teacher, '甲老師');
  assert.match(evidence.entries[0].summary, /分組專題/);
  assert.equal(evidence.entries[0].style, '每週作業、分組報告');
  assert.doesNotMatch(JSON.stringify(evidence), /沒有作業|difficulty|score/);
});

test('other-course reviews are labeled as teacher references rather than this course feedback', () => {
  const index = buildCourseReviewIndex([
    review('查詢課程', '乙老師', '這位老師每週都有額外測驗。'),
    review('同老師其他課', '甲老師', '需要分組報告與期末成果發表。'),
    review('共同授課', '甲老師、乙老師', '無法確認這則內容是評論哪位老師。'),
  ]);
  const evidence = findCourseReviewEvidence({ course: '查詢課程', teacher: '甲老師' }, index);
  assert.equal(evidence.scope, 'teacher');
  assert.deepEqual(evidence.entries.map(entry => entry.course), ['同老師其他課']);
  assert.deepEqual(findCourseReviewEvidence({ course: '查詢課程', teacher: '未收錄老師' }, index), { scope: 'none', entries: [] });
  assert.deepEqual(findCourseReviewEvidence({ course: '查詢課程', teacher: '' }, index), { scope: 'none', entries: [] });
});

test('joint-teacher reviews can match their own course without being attributed to unrelated courses', () => {
  const index = buildCourseReviewIndex([review('共同授課', '甲老師、乙老師', '期末有分組專題及個人測驗。')]);
  assert.equal(findCourseReviewEvidence({ course: '共同授課', teacher: '乙老師' }, index).scope, 'course');
  assert.equal(findCourseReviewEvidence({ course: '其他課', teacher: '乙老師' }, index).scope, 'none');
});

test('generated filler and conclusions cannot masquerade as student feedback', () => {
  const index = buildCourseReviewIndex([
    { ...review('只有套話', '甲老師', '共 2 則留言，無明顯正負評傾向'), 結論: '這堂課超級輕鬆，推薦所有人修課' },
    review('真實描述', '甲老師', '有此相同課程名稱心得，但請先注意是否為該老師（甲老師）所開之課程。共 2 則留言，無明顯正負評傾向。每週需繳交一份作業。'),
  ]);
  assert.equal(findCourseReviewEvidence({ course: '只有套話', teacher: '甲老師' }, index).scope, 'teacher');
  const evidence = findCourseReviewEvidence({ course: '真實描述', teacher: '甲老師' }, index);
  assert.equal(evidence.entries[0].summary, '每週需繳交一份作業');
  assert.doesNotMatch(JSON.stringify(evidence), /共 2 則|超級輕鬆|請先注意/);
});

test('review context is bounded and avoids duplicate teacher references', () => {
  const duplicate = review('同教師其他課', '甲老師', '長篇心得'.repeat(300), '上課方式'.repeat(100));
  const index = buildCourseReviewIndex([duplicate, duplicate,
    review('第二門課', '甲老師', '每週都有課堂討論與個人作業。'),
    review('第三門課', '甲老師', '期末繳交一份完整專題成果。')]);
  const evidence = findCourseReviewEvidence({ course: '查詢課程', teacher: '甲老師' }, index);
  assert.equal(evidence.entries.length, 2);
  assert.equal(evidence.entries[0].summary.length, 500);
  assert.equal(evidence.entries[0].style.length, 100);
  assert.equal(new Set(evidence.entries.map(entry => entry.course)).size, 2);
});
