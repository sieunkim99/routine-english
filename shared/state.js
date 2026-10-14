export const initialState=()=>({version:4,revision:0,onboarding:{messages:[],proposal:null,approved:false},profile:null,curriculum:[],sessions:[],expressionReviews:{},settings:{enabled:true,interval:60,start:9,end:22,voice:true,buddyEnabled:false,delivery:'notification',schedule:'interval',times:[]},consent:false,snooze:0,lastInvitation:0});
export function migrate(raw){const base=initialState();if(!raw)return base;return {...base,...raw,version:4,settings:{...base.settings,...raw.settings,voice:raw.version===4?raw.settings?.voice!==false:true},onboarding:raw.onboarding?{...base.onboarding,...raw.onboarding}:{messages:raw.goalMessages||[],proposal:null,approved:false}};}
export const safeUrl=value=>{try{const u=new URL(value);return /^https?:$/.test(u.protocol)?u.origin+u.pathname:'';}catch{return '';}};
export function material(value){if(typeof value?.text!=='string'||value.text.trim().length<20)throw Error('본문을 읽기 어려워요. 읽고 싶은 문장을 선택한 뒤 확장 아이콘을 다시 눌러주세요.');return {title:String(value.title||'현재 페이지').slice(0,300),url:safeUrl(value.url),text:value.text.trim().slice(0,6000),kind:value.kind==='activity'?'activity':'page',site:value.kind==='activity'?String(value.site||'').slice(0,120):''};}
export function selectSkill(state,now=Date.now()){
 if(!state.curriculum.length)throw Error('먼저 코치와 목표를 정해주세요.');const last=new Map();for(const s of state.sessions)last.set(s.skillId,s);
 const due=state.curriculum.filter(c=>last.get(c.id)?.due<=now).sort((a,b)=>last.get(a.id).due-last.get(b.id).due);
 if(due.length)return {skill:due[0],reason:'복습할 때가 된 능력을 지금 보는 내용으로 다시 연습해요.'};
 const fresh=state.curriculum.find(c=>!last.has(c.id));if(fresh)return {skill:fresh,reason:'나의 커리큘럼에서 다음으로 연습할 능력이에요.'};
 const weak=[...state.curriculum].sort((a,b)=>last.get(a.id).feedback.score-last.get(b.id).feedback.score||last.get(a.id).at-last.get(b.id).at)[0];return {skill:weak,reason:'지난번 어려웠던 부분을 새 내용에서 다시 사용해요.'};
}
export const reviewSteps=[10*60000,86400000,3*86400000,7*86400000,14*86400000,30*86400000];
export function expressionCards(state){
 const cards=new Map();for(const session of state.sessions){const expression=session.feedback?.expression?.trim();if(!expression)continue;const key=expression.toLowerCase().replace(/\s+/g,' ');const old=cards.get(key);if(old)continue;const review=state.expressionReviews?.[session.id];cards.set(key,{...session,id:session.id,expression,meaning:session.feedback.meaning||'',stage:review?.stage||0,due:review?.due??session.at+reviewSteps[0],lastRating:review?.grade||null,repetitions:review?.history?.length||0});}return [...cards.values()];
}
export function reviewQueue(state,now=Date.now()){return expressionCards(state).filter(c=>c.due<=now).sort((a,b)=>a.due-b.due);}
export function nextExpressionReview(card,grade,now=Date.now()){
 if(!['again','hard','good'].includes(grade))throw Error('복습 상태를 골라주세요.');const stage=grade==='good'?Math.min(5,card.stage+1):grade==='again'?0:card.stage;
 const interval=grade==='hard'?Math.max(reviewSteps[0],Math.round(reviewSteps[stage]/2)):reviewSteps[stage];return {stage,due:now+interval,grade,at:now};
}
export function dueAt(score,hint,now=Date.now()){return now+(score===2?(hint?3:7):score===1?2:1)*86400000;}
export function canInvite(state,now=Date.now(),activity='active'){
 const date=new Date(now);if(!state.consent||!state.onboarding.approved||!state.settings.enabled||activity!=='active'||date.getHours()<state.settings.start||date.getHours()>=state.settings.end||now<state.snooze)return false;
 if(state.settings.schedule==='times'){return state.settings.times.some(time=>{const [h,m]=time.split(':').map(Number),slot=new Date(date);slot.setHours(h,m,0,0);return now>=slot.getTime()&&now-slot.getTime()<5*60000&&state.lastInvitation<slot.getTime();});}
 return now-state.lastInvitation>=state.settings.interval*60000;
}
export function validateSettings(s){if(typeof s.enabled!=='boolean'||!Number.isFinite(s.interval)||s.interval<=0||!Number.isInteger(s.start)||!Number.isInteger(s.end)||s.start<0||s.end>24||s.start>=s.end)throw Error('알림 간격은 양수로, 종료 시각은 시작보다 늦게 입력해주세요.');
 if(s.delivery==='buddy'&&!s.buddyEnabled)throw Error('먼저 고양이 친구를 켜주세요.');if(!Array.isArray(s.times||[]))throw Error('시각 목록을 확인해주세요.');const times=[...new Set(s.times||[])].sort();if(times.length>12||times.some(t=>!/^([01]\d|2[0-3]):[0-5]\d$/.test(t))||s.schedule==='times'&&!times.length)throw Error('정해진 시각은 14:00, 18:30처럼 입력해주세요.');
 return {enabled:s.enabled,interval:s.interval,start:s.start,end:s.end,voice:!!s.voice,buddyEnabled:!!s.buddyEnabled,delivery:['popup','buddy'].includes(s.delivery)?s.delivery:'notification',schedule:s.schedule==='times'?'times':'interval',times};}

export function starterPlan(){return {profile:{context:'',wish:'현재 콘텐츠로 가볍게 영어 이야기하기',scene:'',scope:'일상 관심사 · 목표는 나중에 추가',personalMeaning:'',barrier:'',interests:'',currentAbility:'아직 평가하지 않았어요. 대화하며 도움의 양을 조절해요.',firstStep:'현재 화면에 짧게 반응하기',level:'A2'},curriculum:[{id:'react',title:'짧게 반응하기',objective:'현재 콘텐츠에 한 단어나 짧은 구로 반응한다.',hint:'I think …',whyItMatters:'현재 이야기에서 부담 없이 시작해요.'},{id:'reason',title:'내 이유 덧붙이기',objective:'생각에 이유 하나를 짧게 덧붙인다.',hint:'because …',whyItMatters:'내 생각을 조금 더 전달해요.'},{id:'ask',title:'관심 있는 점 묻기',objective:'현재 주제에서 궁금한 점 하나를 묻는다.',hint:'What about …?',whyItMatters:'관심사로 대화를 이어가요.'}]};}
