import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { normalizeOutline, fetchOutline, summarizeOutline, validateSummary, readOutlines, safeOutlineError, createSummaryCache } from '../lib/course-outlines.js';

// Synthetic academic response; not a claim about currently available FCU fields.
const fixture = {
  courseDescription:'<p>學習資料結構與演算法。</p>',
  courseObjectives:['設計堆疊與佇列','分析時間複雜度'],
  teachPlans:[{content:'第 1 週：陣列與鏈結串列'},{content:'第 2 週：堆疊'}],
  gradeRules:[{evalb_name:'期中考',score_rate:30},{evalb_name:'期末考',score_rate:40},{evalb_name:'作業',score_rate:30}],
  access_token:'must-never-be-published',
};
test('crawl diagnostics never include upstream JSON or token-bearing URLs',()=>{
  let malformed;
  try { JSON.parse('PRIVATE-TOKEN upstream response'); } catch(error) { malformed=error; }
  assert.doesNotMatch(safeOutlineError(malformed),/PRIVATE-TOKEN|upstream response/);
  assert.doesNotMatch(safeOutlineError(new Error('fetch failed https://example.invalid/?token=PRIVATE-TOKEN')),/PRIVATE-TOKEN/);
  assert.equal(safeOutlineError(new Error('Official detail HTTP 503')),'Official detail HTTP 503');
});
test('official extraction preserves grading and excludes tokens',()=>{
  const result=normalizeOutline(fixture,'115-1','0001');
  assert.equal(result.description,'學習資料結構與演算法。');
  assert.equal(result.gradeRules.reduce((sum,r)=>sum+r.percentage,0),100);
  assert.equal(result.topics.length,2);
  assert.doesNotMatch(JSON.stringify(result),/must-never-be-published/);
  assert.equal(result.contentHash,normalizeOutline(fixture,'115-1','0001').contentHash);
  assert.throws(()=>normalizeOutline({unexpected:'something'},'115-1','0001'),/No recognized/);
});
test('detail extraction rejects invalid percentages and strips executable source markup',()=>{
  const result=normalizeOutline({...fixture,courseDescription:'<script>bad()</script><p>安全文字</p>',
    gradeRules:[{evalb_name:'Invalid',score_rate:101},{evalb_name:'Missing'},{evalb_name:'Valid',score_rate:25}]},'115-1','0001');
  assert.equal(result.description,'安全文字');
  assert.deepEqual(result.gradeRules,[{name:'Valid',percentage:25}]);
});
test('FCU schema extracts description, targets, weekly progress and grading notes',()=>{
  const actualShape={success:true,info:{yms_year:115,yms_smester:1,scr_selcode:'0869'},
    description:{describe_ch:'官方課程介紹'},targets:[{describe_ch:'官方目標'}],
    weeklyScds:[{tpd_week:'01',tpd_reading:'<div>課程介紹</div>'}],
    textBooks:{tpb_book:'自編講義'},readings:{tpc_book:'參考教材'},
    gradeRules:[{evalb_name:'期末專題',score_rate:40,evalb_memo:'成果發表'}],
    gradeRuleDescribe:{tpa_score_new:'配分說明'},teachersInfo:[{email:'not-to-publish@example.invalid'}]};
  const result=normalizeOutline(actualShape,'115-1','0869');
  assert.equal(result.description,'官方課程介紹');
  assert.deepEqual(result.topics,['第 01 週：課程介紹']);
  assert.deepEqual(result.objectives,['官方目標']);
  assert.deepEqual(result.textbooks,['自編講義','參考教材']);
  assert.equal(result.gradeRules[0].note,'成果發表');
  assert.equal(result.gradingNote,'配分說明');
  assert.doesNotMatch(JSON.stringify(result),/not-to-publish/);
  assert.throws(()=>normalizeOutline(actualShape,'115-1','0866'),/identity mismatch/);
  const empty=normalizeOutline({success:true,info:actualShape.info,gradeRules:[],weeklyScds:[]},'115-1','0869');
  assert.equal(empty.status,'unpublished');assert.deepEqual(empty.gradeRules,[]);
});
test('official request obtains its own short-lived token and rejects unrelated redirects',async()=>{
  let calls=0;
  const fetchImpl=async(url,options)=>{
    calls++;
    assert.ok(options.signal);
    if(calls===1)return {ok:true,url:'https://ilearntools.fcu.edu.tw/syllabus?token=local-fixture',text:async()=>''};
    assert.deepEqual(JSON.parse(options.body),{access_token:'local-fixture'});
    return {ok:true,json:async()=>({d:JSON.stringify(fixture)})};
  };
  const result=await fetchOutline('115-1','0001',{fetchImpl});
  assert.equal(calls,2);assert.equal(result.gradeRules.length,3);
  await assert.rejects(fetchOutline('115-1','0001',{fetchImpl:async()=>({ok:true,url:'https://example.invalid/?token=x',text:async()=>''})}),/Unexpected/);
  await assert.rejects(fetchOutline('bad','0001',{fetchImpl}),/Invalid/);
});
test('official redirects obtain the token without downloading the syllabus landing page',async()=>{
  const calls=[];
  await fetchOutline('115-1','0001',{fetchImpl:async(url,options)=>{
    calls.push(url);
    if(calls.length<3){
      assert.equal(options.redirect,'manual');
      return {status:302,headers:{get:()=>calls.length===1
        ? 'https://ilearntools.fcu.edu.tw/W320104/W320104_SyllabusFullVer.aspx?courseid=11510001&lang=cht'
        : 'https://ilearntools.fcu.edu.tw/W320104/W320104_SyllabusFullVer.aspx?token=local-fixture'},body:{cancel:async()=>{}}};
    }
    assert.equal(JSON.parse(options.body).access_token,'local-fixture');
    return {ok:true,json:async()=>({d:fixture})};
  }});
  assert.equal(calls.length,3);
  assert.ok(calls.every(url=>!url.includes('token=')));
});
test('AI cannot alter official grading and its summary is tied to the source hash',async()=>{
  const official=normalizeOutline(fixture,'115-1','0001');
  const ai=await summarizeOutline(official,{course:'資料結構'}, {
    env:{ANTHROPIC_API_KEY:'local-test-only'},
    fetchImpl:async(url,options)=>{
      const prompt=JSON.parse(options.body).messages[0].content;
      assert.match(prompt,/不要重新計算或改寫配分/);
      return {ok:true,json:async()=>({content:[{type:'text',text:JSON.stringify({summary:'認識資料結構並分析演算法。',learn:['堆疊與佇列','複雜度分析'],tags:['資料結構'],gradeRules:[{name:'假的配分',percentage:100}]})}]})};
    },
  });
  assert.equal(ai.sourceHash,official.contentHash);
  assert.equal(ai.gradeRules,undefined);
  assert.equal(official.gradeRules[0].percentage,30);
  await assert.rejects(summarizeOutline(official,{course:'資料結構'},{env:{}}),/credential missing/);
  await assert.rejects(summarizeOutline({...official,description:'',objectives:[],topics:[]},{course:'資料結構'},{env:{}}),/Learning scope/);
  assert.throws(()=>validateSummary({summary:'Summary'}),/learning scope/);
  assert.throws(()=>validateSummary({summary:'Summary',learn:[{}]}),/learning scope/);
  assert.equal(validateSummary({summary:'僅有實習介紹，沒有列出具體範圍。',learn:[]}).scopeUnavailable,true);
});
test('dataset reader refreshes an atomic replacement and rejects corrupt files',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'outlines-'));
  const file=join(directory,'data.json');
  try {
    assert.deepEqual((await readOutlines(file)).records,{});
    await writeFile(file,JSON.stringify({version:1,records:{'115-1|0001':{course:'One'}}}));
    assert.equal((await readOutlines(file)).records['115-1|0001'].course,'One');
    await writeFile(file,'broken');
    await assert.rejects(readOutlines(file));
  }finally{await rm(directory,{recursive:true,force:true});}
});
test('identical summary requests share one provider call while different titles or sources stay distinct',async()=>{
  const outline=normalizeOutline(fixture,'115-1','0001');let calls=0;
  const summarize=createSummaryCache([],async record=>{
    calls++;await new Promise(resolve=>setImmediate(resolve));
    return {summary:'課程摘要',learn:['學習資料結構'],tags:[],sourceHash:record.contentHash};
  });
  const [first,second]=await Promise.all([summarize(outline,{course:'資料結構'}),summarize(outline,{course:'資料結構'})]);
  assert.equal(calls,1);assert.equal(first,second);
  await summarize(outline,{course:'另一門課'});assert.equal(calls,2);
  await summarize({...outline,contentHash:'changed'},{course:'資料結構'});assert.equal(calls,3);
});
test('OpenRouter-compatible responses preserve a sparse scope without inventing learning topics',async()=>{
  const official=normalizeOutline({courseDescription:'遴選學生至業界實習。'},'115-1','0001');
  const ai=await summarizeOutline(official,{course:'校外實習'},{
    env:{COURSE_SUMMARY_PROVIDER:'openai',COURSE_SUMMARY_API_KEY:'local-test-only',COURSE_SUMMARY_BASE_URL:'https://openrouter.ai/api/v1',COURSE_SUMMARY_MODEL:'openai/gpt-4o-mini'},
    fetchImpl:async(url,options)=>{
      assert.equal(url,'https://openrouter.ai/api/v1/chat/completions');
      const request=JSON.parse(options.body);
      assert.equal(request.response_format.type,'json_object');
      assert.match(request.messages[0].content,/learn 可以是空陣列/);
      return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({summary:'學生至業界參與實習。',learn:[],tags:['實習']})}}]})};
    },
  });
  assert.deepEqual(ai.learn,[]);assert.equal(ai.scopeUnavailable,true);
  assert.equal(ai.sourceHash,official.contentHash);
});
test('summary cache reuses current saved results, rejects stale results and retries failures',async()=>{
  const outline={...normalizeOutline(fixture,'115-1','0001'),course:'資料結構'};
  const ai={summary:'課程摘要',learn:['學習資料結構'],tags:[],sourceHash:outline.contentHash};
  let calls=0;
  const saved=createSummaryCache([{...outline,ai}],async()=>{calls++;throw new Error('Unexpected call');});
  assert.equal(await saved(outline,outline),ai);assert.equal(calls,0);
  const retry=createSummaryCache([{...outline,ai:{...ai,sourceHash:'stale'}}],async()=>{
    calls++;if(calls===1)throw new Error('Temporary provider failure');return ai;
  });
  await assert.rejects(retry(outline,outline),/Temporary provider failure/);
  assert.equal(await retry(outline,outline),ai);assert.equal(calls,2);
});
