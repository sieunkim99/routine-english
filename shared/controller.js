import {openingQuestion} from './voice.js';
import {initialState,migrate,material,selectSkill,reviewQueue,dueAt,validateSettings} from './state.js';
import {generate} from './ai.js';
// The service worker owns all changes; the UI never receives the credential.
export function createController(store,{ai=generate,now=Date.now,id=()=>crypto.randomUUID()}={}){
 let queue=Promise.resolve();
 const transact=fn=>{const p=queue.then(fn);queue=p.catch(()=>{});return p;};
 async function snapshot(){const {state,credential}=await store.local.get(['state','credential']);const temp=await store.session.get(['active','pageContext','captureError']);return {state:migrate(state),hasKey:!!credential?.key,...temp};}
 async function save(state){state.revision++;await store.local.set({state});return state;}
 async function call(type,payload){const {credential}=await store.local.get(['credential']);return ai(type,payload,{key:credential?.key});}
 return {snapshot,dispatch:msg=>transact(async()=>{
  let snap=await snapshot(),s=snap.state;
  switch(msg.type){
   case 'snapshot':return snap;
   case 'connect':{
    if(!msg.consent)throw Error('API 연결과 데이터 전달 안내에 동의해주세요.');const key=String(msg.key||'').trim();if(key.length<20||key.length>500)throw Error('API 키를 확인해주세요.');await ai('check',{}, {key});
    const settings=validateSettings({...s.settings,...msg.settings});await store.local.set({credential:{key,verifiedAt:now()}});s.consent=true;s.settings=settings;await save(s);return snapshot();
   }
   case 'goal':{
    if(!s.consent||!snap.hasKey)throw Error('먼저 AI를 연결해주세요.');const content=String(msg.text||'').trim();if(!content&&!msg.forcePlan)throw Error('영어로 하고 싶은 일을 들려주세요.');if(content.length>4000)throw Error('조금 짧게 이야기해주세요.');
    const messages=[...(s.onboarding.messages.length?s.onboarding.messages:[{role:'assistant',content:openingQuestion}]),...(content?[{role:'user',content}]:[])];if(!messages.some(m=>m.role==='user'))throw Error('먼저 나의 이야기를 들려주세요.');
    const result=await call('onboard',{profile:s.profile,messages,forcePlan:!!msg.forcePlan||!!s.onboarding.proposal||messages.filter(m=>m.role==='user').length>=3});s.onboarding.messages=[...messages,{role:'assistant',content:result.reply}];s.onboarding.proposal=result.ready?{profile:result.profile,curriculum:result.curriculum,feedback:result.feedback}:null;await save(s);return snapshot();
   }
   case 'approve':{
    const plan=s.onboarding.proposal;if(!plan)throw Error('먼저 코치가 계획을 준비하도록 이야기해주세요.');s.profile=plan.profile;s.curriculum=plan.curriculum.map((c,i)=>({...c,id:`${c.id.slice(0,60)}-${i}`}));s.onboarding.approved=true;s.onboarding.proposal=null;s.lastInvitation=now();await save(s);return snapshot();
   }
   case 'revise':await store.session.set({active:null});s.onboarding.approved=false;s.onboarding.proposal=null;s.onboarding.messages=[];await save(s);return snapshot();
   case 'mode':s.settings.voice=msg.voice!==false;await save(s);return snapshot();
   case 'settings':s.settings=validateSettings({...s.settings,...msg.settings});s.lastInvitation=now();await save(s);return snapshot();
   case 'invited':s.lastInvitation=now();await save(s);return snapshot();
   case 'snooze':s.snooze=now()+Math.min(1440,Math.max(1,Number(msg.minutes)||30))*60000;await save(s);return snapshot();
   case 'resume':s.snooze=0;s.lastInvitation=now();await save(s);return snapshot();
   case 'start':{
    if(snap.active)throw Error('진행 중인 대화를 먼저 마쳐주세요.');if(!s.onboarding.approved)throw Error('먼저 나의 학습 계획을 확인해주세요.');
    let source,skill,review=false;const chosen=selectSkill(s,now());let previous;
    if(msg.kind==='review'){
     previous=reviewQueue(s,now())[0]||s.sessions.at(-1);if(!previous)throw Error('아직 복습할 대화가 없어요. 현재 페이지로 먼저 대화해보세요.');review=true;skill=s.curriculum.find(c=>c.id===previous.skillId)||chosen.skill;
     source={title:'지난 대화 이어가기',url:'',text:`Previous objective: ${previous.skillTitle}\nPrevious learner answers: ${previous.messages.filter(m=>m.role==='user').map(m=>m.content).join('\n')}\nUseful expression to retrieve (do not reveal first): ${previous.feedback.expression}\nTarget chunk: ${previous.chunk||''}\nNext focus: ${previous.feedback.nextFocus}`};
    }else{source=material(msg.source||snap.pageContext);skill=chosen.skill;}
    const result=await call('start',{profile:s.profile,skill,source,review,chunk:previous?.chunk||'',recent:previous?[previous]:s.sessions.slice(-3)});
    const active={id:id(),source,skill,review,connection:result.connection,hint:result.hint,hintUsed:false,task:result.task||null,chunk:result.task?.chunk||'',attempts:[],messages:[{role:'assistant',content:result.question,task:result.task}],feedback:null,createdAt:now()};await store.session.set({active});return snapshot();
   }
   case 'turn':{
    const a=snap.active;if(!a||a.feedback)throw Error('진행 중인 대화가 없어요.');const text=String(msg.text||'').trim();if(!text||text.length>4000)throw Error('답변을 한두 문장으로 입력해주세요.');
    const attempts=[...(a.attempts||[]),{mode:a.task?.mode||'short',response:text}];const messages=[...a.messages,{role:'user',content:text}];const finish=messages.filter(m=>m.role==='user').length>=3;
    const result=await call(finish?'finish':'turn',{profile:s.profile,skill:a.skill,source:a.source,review:a.review,hintUsed:a.hintUsed,chunk:a.chunk,attempts,messages,recent:s.sessions.slice(-3)});
    a.attempts=attempts;a.task=finish?null:result.task||null;a.messages=finish?messages:[...messages,{role:'assistant',content:result.reply,task:result.task}];a.feedback=finish?result:null;a.lastFeedback=finish?'':result.feedback;await store.session.set({active:a});if(finish)await record(s,a);return snapshot();
   }
   case 'finish':{
    const a=snap.active;if(!a||!a.messages.some(m=>m.role==='user'))throw Error('먼저 한 번 답해보세요.');if(!a.feedback){a.feedback=await call('finish',{profile:s.profile,skill:a.skill,source:a.source,review:a.review,hintUsed:a.hintUsed,chunk:a.chunk,attempts:a.attempts,messages:a.messages,recent:s.sessions.slice(-3)});await store.session.set({active:a});}await record(s,a);return snapshot();
   }
   case 'hint':if(snap.active){snap.active.hintUsed=true;await store.session.set({active:snap.active});}return snapshot();
   case 'close':if(snap.active?.feedback)await record(s,snap.active);await store.session.set({active:null});return snapshot();
   case 'disconnect':await store.local.remove('credential');return snapshot();
   default:throw Error('지원하지 않는 요청입니다.');
  }
 })};
 async function record(s,a){if(s.sessions.some(x=>x.id===a.id))return;const at=now();s.sessions.push({id:a.id,at,due:dueAt(a.feedback.score,a.hintUsed,at),skillId:a.skill.id,skillTitle:a.skill.title,title:a.source.title,url:a.source.url,hint:a.hintUsed,chunk:a.chunk||'',attempts:a.attempts||[],messages:a.messages,feedback:a.feedback});s.lastInvitation=at;await save(s);}
 }
