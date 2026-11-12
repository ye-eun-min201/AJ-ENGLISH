import '../client/quiz-options.js';
const aj = (data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
class ActivityError extends Error{constructor(status,message,details={}){super(message);this.status=status;this.details=details;}}
function ae(status,message,details){throw new ActivityError(status,message,details);}
async function af(db,sql,...args){return db.prepare(sql).bind(...args).first();}
async function aa(db,sql,...args){return (await db.prepare(sql).bind(...args).all()).results||[];}
function adate(now){return new Date(now+32400000).toISOString().slice(0,10);}
const ACT_CONTRACTIONS = { "i'm":'i am', "you're":'you are', "we're":'we are', "they're":'they are', "he's":'he is', "she's":'she is', "it's":'it is', "that's":'that is', "what's":'what is', "there's":'there is', "don't":'do not', "doesn't":'does not', "didn't":'did not', "can't":'cannot', "couldn't":'could not', "won't":'will not', "wouldn't":'would not', "shouldn't":'should not', "isn't":'is not', "aren't":'are not', "wasn't":'was not', "weren't":'were not', "i've":'i have', "you've":'you have', "we've":'we have', "they've":'they have', "i'll":'i will', "you'll":'you will', "we'll":'we will', "they'll":'they will', "i'd":'i would', "you'd":'you would', "we'd":'we would', "they'd":'they would', "let's":'let us' };
function anorm(s){return String(s||'').normalize('NFKC').toLowerCase().replace(/[’‘]/g,"'").replace(/\b[a-z]+'[a-z]+\b/g,w=>ACT_CONTRACTIONS[w]||w).replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();}
function adecode(s){try{return JSON.parse(s);}catch{return {};}}
async function ar(db,user,profile){if(!profile?.current_room_id)return null;return af(db,'SELECT r.id,r.name,r.code,(SELECT COUNT(*) FROM room_members WHERE room_id=r.id) AS memberCount FROM rooms r JOIN room_members m ON m.room_id=r.id AND m.user_id=? WHERE r.id=?',user,profile.current_room_id);}
function acards(content,fallback){const rows=[...(content?.decks||[]).flatMap(d=>d.cards||[]),...fallback];const map=new Map();for(const c of rows)if(c?.id&&c.en&&c.ko)map.set(c.id,c);return [...map.values()];}
function adayHash(value){let result=2166136261;for(const letter of value){result^=letter.charCodeAt(0);result=Math.imul(result,16777619);}return result>>>0;}
function arotate(rows,offset){if(!rows.length)return[];const index=offset%rows.length;return [...rows.slice(index),...rows.slice(0,index)];}
function acollection(content,cards,collection){
 const words=Array.isArray(content?.dailyWords)?content.dailyWords:[],speaking=Array.isArray(content?.speakingExpressions)?content.speakingExpressions:[],phrases=content?.days?.[5]?.phrases||[];
 const candidates=collection==='words'?[...words.filter(c=>c.kind!=='표현'),...cards.filter(c=>c.kind==='단어')]:[...speaking.filter(c=>c.kind!=='단어'),...phrases.filter(c=>c.kind!=='단어'),...cards.filter(c=>c.kind!=='단어')];
 const seen=new Set(),source=[];for(const card of candidates){const key=anorm(card?.en);if(!key||!card?.ko||seen.has(key))continue;seen.add(key);source.push(card);}return source;
}
function acard(card,index,collection){return{id:card.id||'round-'+index,en:card.en,ko:card.ko,note:card.note||'',kind:card.kind||(collection==='words'?'단어':'표현'),studyDay:Number.isInteger(card.studyDay)&&card.studyDay>=1&&card.studyDay<=7?card.studyDay:null};}
function agrade(run,challenge,index,value){const card=challenge.cards[index],english=run.mode!=='listening'||card.answerType==='english',expected=english?card.en:card.ko;return{expected,correct:english?anorm(value)===anorm(expected):String(value||'').trim()===String(expected).trim()};}
function adailyDate(run,challenge,today){if(challenge.daily===true&&run.local_date!==today)ae(409,'새 날짜의 문제 확인',{restartDaily:true,today});}
async function amastery(db,user){
 const history=await aa(db,`SELECT r.challenge_json,a.question_index FROM activity_answers a JOIN activity_runs r ON r.id=a.run_id WHERE r.user_id=? AND a.correct=1 UNION SELECT r.challenge_json,p.question_index FROM daily_rail_passes p JOIN activity_runs r ON r.id=p.run_id WHERE r.user_id=?`,user,user);
 const ids=new Set(),english=new Set();for(const row of history){const card=adecode(row.challenge_json).cards?.[row.question_index];if(card?.id)ids.add(String(card.id));if(card?.en)english.add(anorm(card.en));}return{ids,english};
}
async function adailyState(db,run,now,resumed){
 const challenge=adecode(run.challenge_json),answers=await aa(db,`SELECT a.question_index AS [index],a.answer,a.correct,EXISTS(SELECT 1 FROM daily_rail_passes p WHERE p.run_id=a.run_id AND p.question_index=a.question_index) AS passed,COALESCE(w.points,0) AS pointsAwarded,COALESCE(w.coins,0) AS coins FROM activity_answers a LEFT JOIN activity_awards w ON w.id='answer:'||a.run_id||':'||a.question_index AND w.applied=1 WHERE a.run_id=? ORDER BY a.question_index`,run.id);
 const totals=await af(db,'SELECT COALESCE(SUM(points),0) AS earnedPoints,COALESCE(SUM(coins),0) AS earnedCoins,COALESCE(SUM(CASE WHEN id=? THEN points ELSE 0 END),0) AS completionPoints FROM activity_awards WHERE user_id=? AND applied=1 AND (id=? OR id LIKE ?)',run.id,run.user_id,run.id,'answer:'+run.id+':%');
 const normalized=answers.map(a=>({...a,correct:!!a.correct,firstCorrect:!!a.correct,passed:!!a.passed,points:a.pointsAwarded}));
 return{runId:run.id,mode:run.mode,challenge,startedAt:run.started_at,daily:true,practice:challenge.practice===true,date:run.local_date,today:adate(now),resumed,finished:!!run.finished_at,answers:normalized,progress:{answered:answers.length,correct:answers.filter(a=>a.correct).length,passed:answers.filter(a=>a.passed).length,total:challenge.cards.length},...totals};
}
async function adailyStart(db,{user,room,collection,content,cards,now,practice}){
 const date=adate(now),goal=await af(db,"SELECT * FROM activity_runs WHERE user_id=? AND local_date=? AND json_extract(challenge_json,'$.daily')=1 AND json_extract(challenge_json,'$.collection')=? AND COALESCE(json_extract(challenge_json,'$.practice'),0)=0 LIMIT 1",user,date,collection);
 if(!practice&&goal)return adailyState(db,goal,now,true);
 if(practice){if(!goal?.finished_at)ae(409,'오늘 10문제 완료 후 추가 연습');const active=await af(db,"SELECT * FROM activity_runs WHERE user_id=? AND local_date=? AND json_extract(challenge_json,'$.daily')=1 AND json_extract(challenge_json,'$.collection')=? AND json_extract(challenge_json,'$.practice')=1 AND finished_at IS NULL LIMIT 1",user,date,collection);if(active)return adailyState(db,active,now,true);}
 const count=await af(db,'SELECT COUNT(*) AS n FROM activity_runs WHERE user_id=? AND local_date=?',user,date);if(count.n>=100)ae(429,'오늘의 연습 기록 한도');
 const source=acollection(content,cards,collection);if(!source.length)ae(409,collection==='words'?'등록된 영단어 없음':'등록된 말하기 문장 없음');
 const mastered=await amastery(db,user),known=card=>mastered.english.has(anorm(card.en));
 const teacherIds=new Set((collection==='words'?content?.dailyWords||[]:content?.speakingExpressions||[]).map(c=>String(c.id))),teacherEnglish=new Set((collection==='words'?content?.dailyWords||[]:content?.speakingExpressions||[]).map(c=>anorm(c.en)));
 const isTeacher=card=>teacherIds.has(String(card.id))||teacherEnglish.has(anorm(card.en));
 const round=practice?(await af(db,"SELECT COUNT(*) AS n FROM activity_runs WHERE user_id=? AND local_date=? AND json_extract(challenge_json,'$.daily')=1 AND json_extract(challenge_json,'$.collection')=? AND json_extract(challenge_json,'$.practice')=1",user,date,collection)).n+1:0;
 const seed=adayHash(date+':'+collection+':'+round),ordered=[];
 for(const wasKnown of [false,true])for(const teacher of [true,false])ordered.push(...arotate(source.filter(card=>known(card)===wasKnown&&isTeacher(card)===teacher),seed));
 const selected=Array.from({length:10},(_,index)=>ordered[index%ordered.length]),seen=new Set();
 const chosen=selected.map((card,index)=>{const key=anorm(card.en),repeated=seen.has(key);seen.add(key);const base=acard(card,index,collection),raw=globalThis.AJQuizOptions?.distractors?.(base,source,3)||[],wrong=[...new Set(raw.filter(x=>typeof x==='string'&&x.trim()&&x.trim()!==String(base.ko).trim()).map(x=>x.trim()))].slice(0,3);return{...base,distractors:wrong,answerType:wrong.length===3?'meaning':'english',review:known(card)||repeated,repeated};});
 const challenge={daily:true,practice:!!practice,date,collection,cards:chosen,allowedCardIds:[],reviewCount:chosen.filter(c=>c.review).length,repeatedPractice:chosen.some(c=>c.repeated),bankExhausted:source.every(known),note:chosen.some(c=>c.repeated)?'등록 문제 부족 · 일부 반복 복습':chosen.some(c=>c.review)?'미학습 문제 우선 · 일부 이전 문제 복습':''};
 const id=crypto.randomUUID();await db.prepare('INSERT OR IGNORE INTO activity_runs (id,user_id,room_id,mode,challenge_json,started_at,local_date) VALUES (?,?,?,?,?,?,?)').bind(id,user,room||null,'listening',JSON.stringify(challenge),now,date).run();
 const saved=await af(db,`SELECT * FROM activity_runs WHERE user_id=? AND local_date=? AND json_extract(challenge_json,'$.daily')=1 AND json_extract(challenge_json,'$.collection')=? AND COALESCE(json_extract(challenge_json,'$.practice'),0)=? ${practice?'AND finished_at IS NULL':''} ORDER BY started_at DESC LIMIT 1`,user,date,collection,Number(!!practice));
 return adailyState(db,saved,now,saved.id!==id);
}
async function award(db,{id,user,room,category,mode,points,coins=0,seconds=0,now,cap,answer=null,completeRun=null,pass=null,noReward=false}){
 const date=adate(now),month=date.slice(0,7),queries=[];
 if(answer)queries.push(db.prepare('INSERT OR IGNORE INTO activity_answers (run_id,question_index,answer,correct,answered_at) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM activity_runs WHERE id=? AND user_id=? AND finished_at IS NULL)').bind(answer.runId,answer.index,answer.value,Number(answer.correct),now,answer.runId,user));
 if(pass)queries.push(db.prepare('INSERT OR IGNORE INTO daily_rail_passes (run_id,question_index,passed_at) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM activity_runs WHERE id=? AND user_id=? AND finished_at IS NULL)').bind(pass.runId,pass.index,now,pass.runId,user));
 const awardIndex=queries.length;
 let requested='?',requestedArgs=[points],conditions='1=1',conditionArgs=[];
 if(completeRun){
  requested="MAX(0,(CASE WHEN EXISTS(SELECT 1 FROM activity_answers WHERE run_id=?) THEN 4+2*COALESCE((SELECT SUM(correct) FROM activity_answers WHERE run_id=?),0) ELSE ? END)-COALESCE((SELECT SUM(points) FROM activity_awards WHERE id LIKE ?),0))";
  requestedArgs=[completeRun,completeRun,points,'answer:'+completeRun+':%'];
  conditions='EXISTS(SELECT 1 FROM activity_runs WHERE id=? AND user_id=? AND finished_at IS NULL)';conditionArgs=[completeRun,user];
 }else if(answer){
  conditions='EXISTS(SELECT 1 FROM activity_runs WHERE id=? AND user_id=? AND finished_at IS NULL) AND EXISTS(SELECT 1 FROM activity_answers WHERE run_id=? AND question_index=? AND correct=1)';conditionArgs=[answer.runId,user,answer.runId,answer.index];
 }
 if(noReward){conditions='0=1';conditionArgs=[];}
 queries.push(db.prepare(`INSERT OR IGNORE INTO activity_awards (id,user_id,room_id,category,mode,points,coins,seconds,local_date,month,created_at) SELECT ?,?,?,?,?,MIN(${requested},MAX(0,?-COALESCE((SELECT SUM(points) FROM activity_awards WHERE user_id=? AND local_date=? AND category=?),0))),0,?,?,?,? WHERE ${conditions}`).bind(id,user,room,category,mode,...requestedArgs,cap,user,date,category,seconds,date,month,now,...conditionArgs));
 // Daily cumulative rounding preserves ten game XP => two coins with split awards.
 queries.push(db.prepare("UPDATE activity_awards SET coins=CASE WHEN category='game' THEN MAX(0,MIN(8,CAST(COALESCE((SELECT SUM(points) FROM activity_awards WHERE user_id=? AND local_date=? AND category='game'),0)/5 AS INTEGER))-COALESCE((SELECT SUM(coins) FROM activity_awards WHERE user_id=? AND local_date=? AND category='game' AND id<>? AND applied=1),0)) ELSE 0 END WHERE id=? AND applied=0").bind(user,date,user,date,id,id));
 queries.push(db.prepare('UPDATE profiles SET total_points=total_points+(SELECT points FROM activity_awards WHERE id=? AND applied=0),coins=coins+(SELECT coins FROM activity_awards WHERE id=? AND applied=0) WHERE user_id=? AND EXISTS(SELECT 1 FROM activity_awards WHERE id=? AND applied=0)').bind(id,id,user,id));
 queries.push(db.prepare('UPDATE activity_awards SET applied=1 WHERE id=? AND applied=0').bind(id));
 if(completeRun)queries.push(db.prepare('UPDATE activity_runs SET finished_at=? WHERE id=? AND user_id=? AND finished_at IS NULL').bind(now,completeRun,user));
 const results=await db.batch(queries),inserted=Number(results[awardIndex]?.meta?.changes||0)>0;
 const row=inserted?await af(db,'SELECT points,coins FROM activity_awards WHERE id=?',id):null;
 return {...(row||{points:0,coins:0}),answerInserted:!!answer&&Number(results[0]?.meta?.changes||0)>0};
}
export async function handleActivity(request,env,content,fallback=[],now=Date.now()){
 const url=new URL(request.url),p=url.pathname;
 if(!p.startsWith('/api/activity/')&&p!='/api/study/cards'&&p!='/api/mvp')return null;
 try{
  if(!env.DB)ae(503,'학습 저장소를 준비하고 있어요.');
  const db=env.DB,user=request.headers.get('x-aj-user-id'),today=adate(now),month=today.slice(0,7);
  const profile=user?await af(db,'SELECT * FROM profiles WHERE user_id=?',user):null;
  const room=user?await ar(db,user,profile):null;
  if(p==='/api/mvp'&&request.method==='GET'){
   const selected=url.searchParams.get('month')||month;if(!/^20\d{2}-(0[1-9]|1[0-2])$/.test(selected))ae(400,'올바른 월을 선택해 주세요.');
   if(!room)return aj({authenticated:!!user,month:selected,room:null,categories:{overall:[],study:[],game:[]},winners:{overall:null,study:null,game:null}});
   const rows=await aa(db,`SELECT p.public_id AS id,p.nickname,p.avatar,COALESCE(e.studyPoints,0) AS studyPoints,COALESCE(e.gamePoints,0) AS gamePoints,COALESCE(e.studyPoints,0)+COALESCE(e.gamePoints,0) AS points,COALESCE(e.activeDays,0) AS activeDays,COALESCE(e.seconds,0) AS seconds FROM room_members m JOIN profiles p ON p.user_id=m.user_id LEFT JOIN (SELECT user_id,SUM(studyPoints) AS studyPoints,SUM(gamePoints) AS gamePoints,COUNT(DISTINCT CASE WHEN studyPoints+gamePoints>0 THEN local_date END) AS activeDays,SUM(seconds) AS seconds FROM (SELECT user_id,local_date,points AS studyPoints,0 AS gamePoints,seconds FROM learning_rewards WHERE room_id=? AND month=? UNION ALL SELECT user_id,local_date,CASE WHEN category='study' THEN points ELSE 0 END AS studyPoints,CASE WHEN category='game' THEN points ELSE 0 END AS gamePoints,seconds FROM activity_awards WHERE room_id=? AND month=? AND applied=1) GROUP BY user_id) e ON e.user_id=m.user_id WHERE m.room_id=?`,room.id,selected,room.id,selected,room.id);
   const clean=rows.map(r=>({...r,avatar:adecode(r.avatar),isMe:r.id===profile.public_id}));const categories={};
   for(const [name,key]of Object.entries({overall:'points',study:'studyPoints',game:'gamePoints'})){let last='',rank=0;categories[name]=[...clean].sort((a,b)=>b[key]-a[key]||b.activeDays-a.activeDays||a.nickname.localeCompare(b.nickname)).map((r,i)=>{const k=r[key]+':'+r.activeDays;if(k!==last){rank=i+1;last=k;}return {...r,rank:r[key]>0?rank:null,categoryPoints:r[key]};});}
   return aj({authenticated:true,month:selected,room,categories,winners:Object.fromEntries(Object.entries(categories).map(([k,v])=>[k,v.find(r=>r.categoryPoints>0)||null])),rules:'학습 MVP는 20분 퀘스트와 단어장 학습 포인트, 게임 MVP는 게임 완료 포인트로 계산해요. 종합 MVP는 두 점수의 합이에요. 한국 시간 매월 1일 새로 시작하며 동점은 학습일 수를 비교해요.'});
  }
  if(p==='/api/study/cards'&&request.method==='GET')return aj({authenticated:!!user,cards:user?await aa(db,'SELECT card_id AS cardId,known,starred,attempts,updated_at AS updatedAt FROM study_cards WHERE user_id=?',user):[]});
  if(!user)ae(401,'포인트와 기록을 저장하려면 로그인해 주세요.');
  if(!profile)ae(409,'먼저 캐릭터와 별명을 만들어 주세요.');
  if(request.method!=='POST')ae(405,'지원하지 않는 요청입니다.');
  if(request.headers.get('origin')&&request.headers.get('origin')!==url.origin)ae(403,'사이트 안에서 다시 시도해 주세요.');
  if(!request.headers.get('content-type')?.includes('application/json'))ae(415,'JSON 요청이 필요해요.');
  const raw=await request.text();if(raw.length>100000)ae(413,'입력 내용이 너무 길어요.');let body;try{body=JSON.parse(raw);}catch{ae(400,'입력 형식을 확인해 주세요.');}if(!body||typeof body!=='object'||Array.isArray(body))ae(400,'입력 형식을 확인해 주세요.');
  const cards=acards(content,fallback),byId=new Map(cards.map(c=>[c.id,c]));
  if(p==='/api/study/cards'){
   const c=byId.get(body.cardId);if(!c)ae(400,'현재 단어장의 항목을 선택해 주세요.');
   if(typeof body.known!=='boolean'&&body.known!==0&&body.known!==1)ae(400,'학습 상태를 확인해 주세요.');
   const previous=await af(db,'SELECT starred FROM study_cards WHERE user_id=? AND card_id=?',user,c.id);const star=body.starred===undefined?previous?.starred||0:Number(!!body.starred);
   await db.prepare('INSERT INTO study_cards (user_id,card_id,known,starred,attempts,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(user_id,card_id) DO UPDATE SET known=excluded.known,starred=excluded.starred,attempts=study_cards.attempts+excluded.attempts,updated_at=excluded.updated_at').bind(user,c.id,Number(!!body.known),star,body.review===false?0:1,now).run();
   const key='card:'+user+':'+today+':'+c.id;const already=await af(db,'SELECT id FROM activity_awards WHERE id=?',key);let result={points:0,coins:0};
   if(body.known&&body.review!==false&&!already)result=await award(db,{id:key,user,room:room?.id||null,category:'study',mode:'flashcards',points:2,now,cap:30});
   const saved=await af(db,'SELECT card_id AS cardId,known,starred,attempts,updated_at AS updatedAt FROM study_cards WHERE user_id=? AND card_id=?',user,c.id);return aj({...saved,points:result.points,coins:result.coins});
  }
  if(p==='/api/activity/start'){
   const mode=body.mode;if(!['arrange','listening','speaking','cards'].includes(mode))ae(400,'올바른 게임을 선택해 주세요.');
   if(body.collection!==undefined&&!['words','speaking'].includes(body.collection))ae(400,'학습 모음 확인');
   if(body.daily!==undefined&&typeof body.daily!=='boolean')ae(400,'일일 문제 설정 확인');
   if(body.practice!==undefined&&typeof body.practice!=='boolean')ae(400,'추가 연습 설정 확인');
   if(body.daily===true){if(mode!=='listening'||!['words','speaking'].includes(body.collection))ae(400,'일일 문제 학습 분류 확인');return aj(await adailyStart(db,{user,room:room?.id||null,collection:body.collection,content,cards,now,practice:body.practice===true}));}
   if(body.practice===true)ae(400,'일일 문제의 추가 연습만 지원');
   const count=await af(db,'SELECT COUNT(*) AS n FROM activity_runs WHERE user_id=? AND local_date=?',user,today);if(count.n>=100)ae(429,'오늘은 충분히 연습했어요. 포인트 없이 자유 연습을 이어갈 수 있어요.');
   if(body.sourceRunId!==undefined&&(typeof body.sourceRunId!=='string'||body.sourceRunId.length>100))ae(400,'이전 게임 기록 확인');
   let challenge=null;
   if(body.sourceRunId){const old=await af(db,'SELECT challenge_json FROM activity_runs WHERE id=? AND user_id=? AND mode=?',body.sourceRunId,user,mode);if(old){const saved=adecode(old.challenge_json);if(Array.isArray(saved.cards)&&saved.cards.length===3)challenge=saved;}}
   if(!challenge){
    let source;
    if(body.collection){
     const dailyWords=Array.isArray(content?.dailyWords)?content.dailyWords:[],speaking=Array.isArray(content?.speakingExpressions)?content.speakingExpressions:[],phrases=content?.days?.[5]?.phrases||[];
     const candidates=body.collection==='words'?[...dailyWords.filter(c=>c.kind!=='표현'),...cards.filter(c=>c.kind==='단어')]:[...speaking.filter(c=>c.kind!=='단어'),...phrases.filter(c=>c.kind!=='단어'),...cards.filter(c=>c.kind!=='단어')];
     const seen=new Set();source=[];
     for(const card of candidates){const key=anorm(card?.en);if(!key||!card?.ko||seen.has(key))continue;seen.add(key);source.push(card);}
     if(!source.length&&body.collection==='words')ae(409,'등록된 영단어 없음');
    }else source=content?.days?.[5]?.phrases||cards.slice(0,3);
    if(source.length<3)ae(409,body.collection==='words'?'영단어 3개 이상 필요':body.collection==='speaking'?'말하기 문장 3개 이상 필요':'게임 표현을 세 개 이상 준비해 주세요.');
    challenge={cards:source.slice(0,3).map((c,i)=>({id:c.id||'round-'+i,en:c.en,ko:c.ko,note:c.note||'',kind:c.kind||(body.collection==='words'?'단어':'표현'),studyDay:Number.isInteger(c.studyDay)&&c.studyDay>=1&&c.studyDay<=7?c.studyDay:null})),allowedCardIds:mode==='cards'?cards.map(c=>c.id):[],...(body.collection?{collection:body.collection}:{})};
   }
   const id=crypto.randomUUID();await db.prepare('INSERT INTO activity_runs (id,user_id,room_id,mode,challenge_json,started_at,local_date) VALUES (?,?,?,?,?,?,?)').bind(id,user,room?.id||null,mode,JSON.stringify(challenge),now,today).run();return aj({runId:id,mode,challenge,startedAt:now});
  }
  if(p==='/api/activity/answer'){
   if(typeof body.runId!=='string'||body.runId.length>100)ae(400,'게임 기록 확인');
   const run=await af(db,'SELECT * FROM activity_runs WHERE id=? AND user_id=?',body.runId,user);if(!run)ae(404,'게임 기록 없음');
   const ch=adecode(run.challenge_json);adailyDate(run,ch,today);
   if(run.finished_at)ae(409,'완료된 게임');if(!['arrange','listening','speaking'].includes(run.mode))ae(400,'문제별 보상 미지원');
   const elapsed=now-run.started_at;if(ch.daily!==true&&elapsed>7200000)ae(409,'게임 시간 만료');
   const total=ch.cards?.length||0;
   if(!Number.isInteger(body.index)||body.index<0||body.index>=total)ae(400,'문제 번호 확인');
   if(typeof body.answer!=='string'||body.answer.length>2000)ae(400,'답안 형식 확인');
   const previous=await af(db,'SELECT * FROM activity_answers WHERE run_id=? AND question_index=?',run.id,body.index);
   const minimum=2000*(body.index+1);if(!previous&&elapsed<minimum)ae(409,'풀이 시간 확인',{retryAfterMs:minimum-elapsed});
   const grade=agrade(run,ch,body.index,body.answer),expected=grade.expected,correct=grade.correct;
   const result=await award(db,{id:'answer:'+run.id+':'+body.index,user,room:room?.id||null,category:'game',mode:run.mode,points:2,now,cap:40,answer:{runId:run.id,index:body.index,value:body.answer,correct},pass:ch.daily===true&&correct?{runId:run.id,index:body.index}:null,noReward:ch.practice===true});
   const saved=await af(db,'SELECT answer,correct FROM activity_answers WHERE run_id=? AND question_index=?',run.id,body.index);
   if(!saved)ae(409,'완료된 게임');
   const progress=await af(db,'SELECT COUNT(*) AS answered,COALESCE(SUM(correct),0) AS correct FROM activity_answers WHERE run_id=?',run.id);
   if(ch.daily===true){const state=await adailyState(db,run,now,true),record=state.answers.find(a=>a.index===body.index);return aj({index:body.index,answer:saved.answer,correct:!!saved.correct,firstCorrect:!!saved.correct,passed:!!record?.passed,correctAnswer:expected,points:result.points,coins:result.coins,pointsAwarded:record?.pointsAwarded||0,alreadyAnswered:!result.answerInserted,progress:state.progress,earnedPoints:state.earnedPoints,earnedCoins:state.earnedCoins,dailyCap:40});}
   return aj({index:body.index,answer:saved.answer,correct:!!saved.correct,correctAnswer:expected,points:result.points,coins:result.coins,alreadyAnswered:!result.answerInserted,progress:{...progress,total},dailyCap:40});
  }
  if(p==='/api/activity/complete'){
   if(typeof body.runId!=='string'||body.runId.length>100)ae(400,'게임 기록 확인');
   const run=await af(db,'SELECT * FROM activity_runs WHERE id=? AND user_id=?',body.runId,user);if(!run)ae(404,'이 계정의 게임 기록을 찾을 수 없어요.');
   const ch=adecode(run.challenge_json);adailyDate(run,ch,today);
   if(run.finished_at){if(ch.daily===true){const state=await adailyState(db,run,now,true);return aj({points:0,coins:0,alreadyFinished:true,score:state.progress.correct,total:state.progress.total,finished:true,earnedPoints:state.earnedPoints,earnedCoins:state.earnedCoins,completionPoints:state.completionPoints,progress:state.progress});}return aj({points:0,coins:0,alreadyFinished:true});}
   const seconds=Math.max(0,Math.floor((now-run.started_at)/1000));if(seconds<8)ae(409,'조금 더 연습한 뒤 완료해 주세요.',{retryAfterMs:8000-(now-run.started_at)});if(ch.daily!==true&&seconds>7200)ae(409,'게임 시간이 지나서 새로 시작해 주세요.');
   let score=0,total=ch.daily===true?ch.cards.length:3;
   if(run.mode==='cards'){
    if(!Array.isArray(body.cardIds))ae(400,'완료한 단어 목록을 확인해 주세요.');const ids=[...new Set(body.cardIds)];if(ids.length<3||ids.length>500||ids.some(id=>!ch.allowedCardIds.includes(id))||!Number.isInteger(body.correct)||!Number.isInteger(body.total)||body.total<3||body.correct!==body.total||body.total!==ids.length||body.total>500)ae(400,'세 개 이상의 항목을 정확히 완료하면 게임 보상을 받을 수 있어요.');score=3;
   }else{
    if(!Array.isArray(body.answers)||body.answers.length!==total)ae(400,ch.daily===true?'10문제 답안 확인':'세 문제를 모두 완료해 주세요.');
   if(ch.daily===true){const state=await adailyState(db,run,now,true);if(state.progress.answered!==total||state.progress.passed!==total)ae(409,'10문제 정답 확인 필요',{progress:state.progress});}
    for(let i=0;i<total;i++){const answer=typeof body.answers[i]==='string'?body.answers[i]:body.answers[i]?.answer;if(agrade(run,ch,i,answer).correct)score++;}
    if(run.mode!=='listening'&&score!==total)ae(400,'모든 표현을 정확히 완료해야 해요.');
   }
   const reward=await award(db,{id:run.id,user,room:room?.id||null,category:'game',mode:run.mode,points:Math.round(2+8*score/total),coins:2,seconds:Math.min(seconds,300),now,cap:40,completeRun:run.id,noReward:ch.practice===true});
   const firstAttempts=await af(db,'SELECT COUNT(*) AS answered,COALESCE(SUM(correct),0) AS correct FROM activity_answers WHERE run_id=?',run.id);
   if(firstAttempts.answered)score=firstAttempts.correct;
   if(ch.daily===true){const state=await adailyState(db,{...run,finished_at:now},now,true);return aj({points:reward.points,coins:reward.coins,score,total,seconds,dailyCap:40,finished:true,earnedPoints:state.earnedPoints,earnedCoins:state.earnedCoins,completionPoints:state.completionPoints,progress:state.progress});}
   return aj({points:reward.points,coins:reward.coins,score,total,seconds,dailyCap:40});
  }
  ae(404,'요청한 기능을 찾을 수 없어요.');
 }catch(error){if(error instanceof ActivityError)return aj({error:'activity_error',message:error.message,...error.details},error.status);console.error('Activity API failed',error?.name);return aj({error:'activity_failed',message:'학습 기록을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.'},500);}
}
