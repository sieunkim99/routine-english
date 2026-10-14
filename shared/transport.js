import {initialState} from './state.js';
export const isExtension=!!globalThis.chrome?.runtime?.id;
export async function send(message){if(isExtension){const response=await chrome.runtime.sendMessage(message);if(!response?.ok)throw Error(response?.error||'확장을 새로고침하고 다시 열어주세요.');return response.value;}return previewSend(message);}
// A separate, explicitly labelled product preview. Never stores or asks for a real API key.
let saved=null;try{if(!isExtension)saved=JSON.parse(sessionStorage.getItem('routine-preview')||'null');}catch{}
let preview=saved||{state:initialState(),hasKey:false,active:null,pageContext:{title:'A small garden, a shared neighborhood',url:'',text:'Neighbors turned an unused parking area into a community garden. Every Saturday, they share food and exchange gardening tips. Some residents worry about maintenance costs. Volunteers want everyone to feel welcome.'}};
const plan={profile:{wish:'관심사를 나누며 다양한 사람들과 가까워지기',scene:'취미 모임에서 내 이야기를 하고 상대에게 자연스럽게 질문하는 모습',scope:'일상, 취미, 새로운 사람과 대화',currentAbility:'짧은 문장으로 표현할 수 있지만 대화를 이어가는 연습이 필요함',firstStep:'관심사와 이유를 한 문장으로 연결하기',level:'A2'},curriculum:[{id:'explain',title:'내 생각과 이유 전하기',objective:'관심 있는 주제에 대한 생각을 이유와 함께 전달한다.',hint:'I think … because …'},{id:'listen',title:'상대의 핵심 이해하기',objective:'짧은 설명을 듣거나 읽고 내 말로 요약한다.',hint:'You mean …'},{id:'ask',title:'질문으로 대화 이어가기',objective:'상대의 말에 연결되는 질문을 한다.',hint:'What do you like about …?'}]};
async function previewSend(m){if(m.type==='snapshot')return structuredClone(preview);if(m.type==='connect'){preview.hasKey=true;preview.state.consent=true;preview.state.settings={...preview.state.settings,...m.settings};}
 else if(m.type==='goal'){const messages=preview.state.onboarding.messages;if(m.text)messages.push({role:'user',content:m.text});messages.push({role:'assistant',content:messages.filter(x=>x.role==='user').length<2&&!m.forcePlan?'Who would you like to talk with, and what would you talk about?':'I’ve prepared a sample plan. In the installed extension, your own English helps the coach understand your level and goals.'});if(messages.filter(x=>x.role==='user').length>=2||m.forcePlan)preview.state.onboarding.proposal=structuredClone(plan);}
 else if(m.type==='approve'){preview.state.profile=preview.state.onboarding.proposal.profile;preview.state.curriculum=preview.state.onboarding.proposal.curriculum;preview.state.onboarding.approved=true;preview.state.onboarding.proposal=null;}
 else if(m.type==='revise')preview.state.onboarding.approved=false;
 else if(m.type==='start')preview.active={id:crypto.randomUUID(),source:preview.pageContext,skill:plan.curriculum[0],review:m.kind==='review',hint:'I think … because …',hintUsed:false,connection:'관심 있는 내용을 이유와 함께 표현하는 첫걸음이에요.',messages:[{role:'assistant',content:m.kind==='review'?'What is one benefit of sharing a garden with neighbors?':'What interests you about this community garden, and why?'}],feedback:null};
 else if(m.type==='turn'){const a=preview.active;a.messages.push({role:'user',content:m.text});if(a.messages.filter(x=>x.role==='user').length<3)a.messages.push({role:'assistant',content:'How could this help people get to know each other?'});else finish();}
 else if(m.type==='finish')finish();
 else if(m.type==='hint')preview.active.hintUsed=true;
 else if(m.type==='close')preview.active=null;
 else if(m.type==='settings')preview.state.settings={...preview.state.settings,...m.settings};
 else if(m.type==='disconnect')preview.hasKey=false;
 function finish(){const a=preview.active;a.feedback={strength:'미리보기에서는 답변을 평가하지 않아요.',improvement:'실제 AI는 내가 쓴 표현을 바탕으로 개선점 하나를 알려줘요.',expression:'I like shared gardens because they bring people together.',nextFocus:'다른 관심사에서도 이유를 덧붙여보기',score:1};if(!preview.state.sessions.some(s=>s.id===a.id))preview.state.sessions.push({...a,at:Date.now(),due:Date.now()+86400000,skillId:a.skill.id,skillTitle:a.skill.title});}
 sessionStorage.setItem('routine-preview',JSON.stringify(preview));return structuredClone(preview);
}
