export const initialState=()=>({version:4,revision:0,onboarding:{messages:[],proposal:null,approved:false},profile:null,curriculum:[],sessions:[],settings:{enabled:true,interval:60,start:9,end:22,voice:true},consent:false,snooze:0,lastInvitation:0});
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
export function reviewQueue(state,now=Date.now()){const latest=new Map();for(const s of state.sessions)latest.set(s.skillId,s);return [...latest.values()].filter(s=>s.due<=now).sort((a,b)=>a.due-b.due);}
export function dueAt(score,hint,now=Date.now()){return now+(score===2?(hint?3:7):score===1?2:1)*86400000;}
export function canInvite(state,now=Date.now(),activity='active'){const date=new Date(now);return state.consent&&state.onboarding.approved&&state.settings.enabled&&activity==='active'&&date.getHours()>=state.settings.start&&date.getHours()<state.settings.end&&now>=state.snooze&&now-state.lastInvitation>=state.settings.interval*60000;}
export function validateSettings(s){if(typeof s.enabled!=='boolean'||!Number.isFinite(s.interval)||s.interval<=0||!Number.isInteger(s.start)||!Number.isInteger(s.end)||s.start<0||s.end>24||s.start>=s.end)throw Error('알림 간격은 0보다 큰 분 단위 숫자로, 종료 시각은 시작보다 늦게 입력해주세요.');return {enabled:s.enabled,interval:s.interval,start:s.start,end:s.end,voice:!!s.voice};}
