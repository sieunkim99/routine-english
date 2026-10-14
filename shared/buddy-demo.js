// Explicit visual demo. No real extension API, permissions, credentials, or network calls.
const listeners=new Set();let quietUntil=0;
globalThis.chrome={runtime:{onMessage:{addListener:fn=>listeners.add(fn),removeListener:fn=>listeners.delete(fn)},sendMessage:async m=>{if(m.type==='buddy-start')document.querySelector('#notice').textContent='실제 확장에서는 현재 페이지의 스몰톡이 코치 창에 열려요.';if(m.type==='buddy-quiet'){quietUntil=Date.now()+3600000;document.querySelector('#notice').textContent='한 시간 조용히 기다리는 모습이에요.';}if(m.type==='buddy-settings')document.querySelector('#notice').textContent='실제 확장의 학습 설정에서 켜고 끌 수 있어요.';return {ok:true,value:{enabled:true,quietUntil}};}}};
document.querySelector('#offer').onclick=()=>{quietUntil=0;for(const fn of listeners){fn({type:'buddy-state',enabled:true,quietUntil:0},{},()=>{});fn({type:'buddy-invite',review:false},{},()=>{});}};
document.querySelector('#reveal').onclick=()=>{document.querySelector('#answer').hidden=false;};
