import {instructionsFor,lessonContext} from './prompts.js';
export function sourceLanguage(text){const sample=String(text||'').slice(0,6000);const hangul=(sample.match(/[가-힣]/g)||[]).length;const letters=(sample.match(/[가-힣A-Za-z]/g)||[]).length;return hangul>=12&&hangul/Math.max(letters,1)>=.2?'ko':'other';}
const str={type:'string'};const object=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
const profile=object({context:str,wish:str,scene:str,scope:str,personalMeaning:str,barrier:str,interests:str,currentAbility:str,firstStep:str,level:{type:'string',enum:['A1','A2','B1','B2','C1']}});
const task=object({mode:{type:'string',enum:['chat','choice','gap','short']},cue:str,frame:str,choices:{type:'array',items:str,maxItems:3},chunk:str});
const item=object({id:str,title:str,objective:str,hint:str,whyItMatters:str});
export const schemas={
 check:object({ok:{type:'boolean'}}),
 onboard:object({reply:str,ready:{type:'boolean'},profile,feedback:object({strength:str,improvement:str,example:str}),curriculum:{type:'array',items:item,minItems:0,maxItems:5}}),
 start:object({sourceDetail:str,question:str,hint:str,connection:str,task}),
 turn:object({reply:str,feedback:str,task}),
 finish:object({original:str,chunk:str,meaning:str,spokenSummary:str,strength:str,improvement:str,expression:str,nextFocus:str,score:{type:'integer',enum:[0,1,2]}})
};
export function prepare(type,input){const p={};if(type==='check')return p;
 p.profile=input.profile||null;p.messages=(input.messages||[]).slice(-18).map(m=>({role:m.role==='user'?'user':'assistant',content:String(m.content||'').slice(0,4000),assisted:!!m.assisted,...(m.task?{task:m.task}:{})}));
 if(type==='onboard'){const count=(input.messages||[]).filter(m=>m.role==='user').length;p.onboarding={maxResponses:3,responsesReceived:count};p.forcePlan=!!input.forcePlan||count>=3;return p;}
 p.flow=input.review?'review':'smalltalk';p.chunk=input.chunk||'';p.attempts=input.attempts||[];p.skill=input.skill;p.source=input.source?{title:String(input.source.title).slice(0,300),text:String(input.source.text).slice(0,6000),language:sourceLanguage(input.source.text),kind:input.source.kind==='activity'?'activity':'page',site:input.source.kind==='activity'?String(input.source.site||'').slice(0,120):''}:null;
 p.lesson=lessonContext(type,input);p.review=!!input.review;p.hintUsed=!!input.hintUsed;p.recent=(input.recent||[]).slice(-3).map(s=>({skillId:s.skillId,objective:s.skillTitle,hintUsed:!!s.hint,chunk:s.chunk||'',attempts:s.attempts||[],response:s.messages?.filter(m=>m.role==='user').at(-1)?.content,feedback:s.feedback}));return p;
}
export function validateOutput(schema,value){if(schema.type==='object'){if(!value||typeof value!=='object'||Array.isArray(value))throw Error('AI 응답 형식을 확인하지 못했어요. 다시 시도해주세요.');for(const k of schema.required)validateOutput(schema.properties[k],value[k]);}else if(schema.type==='array'){if(!Array.isArray(value)||value.length<(schema.minItems||0)||value.length>(schema.maxItems||Infinity))throw Error('AI 계획을 읽지 못했어요. 다시 시도해주세요.');value.forEach(v=>validateOutput(schema.items,v));}else if(schema.type==='integer'){if(!Number.isInteger(value))throw Error('AI 평가 형식이 올바르지 않아요.');}else if(typeof value!==schema.type)throw Error('AI 응답 형식이 올바르지 않아요.');if(schema.enum&&!schema.enum.includes(value))throw Error('AI 응답 범위가 올바르지 않아요.');}
export async function generate(type,input,{key,fetcher=fetch,model='gpt-4o-mini'}={}){
 if(!schemas[type])throw Error('지원하지 않는 요청입니다.');if(!key)throw Error('설정에서 OpenAI API 키를 연결해주세요.');
 const prepared=prepare(type,input);const schema=type==='onboard'&&prepared.forcePlan?{...schemas.onboard,properties:{...schemas.onboard.properties,ready:{type:'boolean',enum:[true]},curriculum:{...schemas.onboard.properties.curriculum,minItems:3,maxItems:3}}}:['start','turn'].includes(type)&&!input.review?{...schemas[type],properties:{...schemas[type].properties,task:{...task,properties:{...task.properties,mode:{type:'string',enum:['chat']},choices:{type:'array',items:str,minItems:2,maxItems:3}}}}}:schemas[type];
 let response;try{response=await fetcher('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(45000),body:JSON.stringify({model,store:false,max_output_tokens:type==='onboard'?2400:type==='check'?60:1200,instructions:instructionsFor(type),input:JSON.stringify(prepared),text:{format:{type:'json_schema',name:'routine_'+type,strict:true,schema}}})});}catch(error){throw Error(error.name==='TimeoutError'?'AI 응답이 늦어지고 있어요. 다시 시도해주세요.':'인터넷 연결을 확인해주세요. 입력한 내용은 남아 있어요.');}
 if(!response.ok){if(response.status===401)throw Error('API 키가 유효하지 않아요. 설정에서 확인해주세요.');if(response.status===429)throw Error('API 사용 한도에 도달했어요. OpenAI 결제·사용 한도를 확인해주세요.');throw Error('AI 연결에 실패했어요. 잠시 후 다시 시도해주세요.');}
 const data=await response.json();if(data.status==='incomplete')throw Error('AI 응답이 끝나지 않았어요. 다시 시도해주세요.');
 const raw=(data.output||[]).flatMap(o=>o.content||[]).filter(c=>c.type==='output_text').map(c=>c.text).join('');let result;try{result=JSON.parse(raw);}catch{throw Error('AI 응답을 읽지 못했어요. 다시 시도해주세요.');}validateOutput(schema,result);
 if(type==='start'&&!input.review&&input.source?.kind!=='activity'&&(!result.sourceDetail?.trim()||!String(input.source?.text||'').replace(/\s+/g,' ').includes(result.sourceDetail.trim().replace(/\s+/g,' '))))throw Error('현재 화면에 근거한 질문을 준비하지 못했어요. 다시 시작해주세요.');
 if(['start','turn'].includes(type)&&(result.task.mode!=='chat'&&!result.task.chunk.trim()||result.task.mode==='choice'&&result.task.choices.length<2||result.task.mode==='gap'&&!result.task.frame.includes('___')))throw Error('연습 카드를 준비하지 못했어요. 다시 시도해주세요.');
 if(type==='onboard'&&result.ready&&(result.curriculum.length<3||!result.profile.wish.trim()))throw Error('계획을 완성하지 못했어요. 한 번 더 시도해주세요.');
 if(type==='finish'&&result.original&&!(input.messages||[]).some(m=>m.role==='user'&&String(m.content).includes(result.original)))throw Error('내 답변에 근거한 표현을 확인하지 못했어요. 다시 시도해주세요.');
 if(type==='finish'&&(input.hintUsed||input.attempts?.length&&input.attempts.every(a=>['choice','suggestion'].includes(a.mode))))result.score=Math.min(result.score,1);
 return result;
}
