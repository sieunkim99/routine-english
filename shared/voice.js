/** Browser voice turns: explicit completion, pause-tolerant recognition, no mic/TTS overlap. */
export const openingQuestion = 'Think of a recent moment when English would have helped you — a video, a message, a conversation, or something else. What were you trying to understand or say?';
export function speechChunks(text,max=220){const chunks=[];let pending='';for(const word of String(text).trim().split(/\s+/)){if(pending&&pending.length+word.length+1>max){chunks.push(pending);pending='';}pending+=(pending?' ':'')+word;}if(pending)chunks.push(pending);return chunks;}
// Prefer conversational voices rather than the first OS voice (which can be a novelty voice).
export function coachVoice(voices=[]){
 const english=voices.filter(v=>/^en(?:[-_]|$)/i.test(v.lang||'')&&!/Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Deranged|Good News|Hysterical|Junior|Pipe Organ|Trinoids|Whisper|Zarvox|Wobble|Jester|Organ|Superstar/i.test(v.name||''));
 const priorities=[/Google US English/i,/Microsoft.*(?:Jenny|Aria|Emma).*Natural/i,/Samantha/i,/Microsoft.*(?:Jenny|Aria|Emma)/i,/Google.*English/i,/Karen/i,/Daniel/i,/Alex/i];
 for(const pattern of priorities){const match=english.find(v=>pattern.test(v.name||''));if(match)return match;}
 return english.find(v=>v.default)||english.find(v=>/^en[-_]US$/i.test(v.lang))||english[0];
}
export function createVoice({Recognition, synthesis, Utterance, setTimer=setTimeout,clearTimer=clearTimeout,onState=()=>{},onTranscript=()=>{},onError=()=>{}}={}){
 let recognition=null,wanted=false,state='idle',transcript='',prefix='',parts=new Map(),interim=new Map(),restartTimer=null,stopTimer=null,stopResolve=null,generation=0,speechGeneration=0,voiceWaitCleanup=null;
 const update=s=>{state=s;onState(s);};
 const combine=()=>[prefix,...[...new Set([...parts.keys(),...interim.keys()])].sort((a,b)=>a-b).map(i=>parts.get(i)||interim.get(i)||'')].filter(Boolean).join(' ').trim();
 function clearRestart(){if(restartTimer!==null){clearTimer(restartTimer);restartTimer=null;}}
 function settle(){if(stopTimer!==null){clearTimer(stopTimer);stopTimer=null;}if(stopResolve){const resolve=stopResolve;stopResolve=null;resolve(transcript);}}
 function begin(){
  if(!wanted)return;const token=++generation;parts=new Map();interim=new Map();const r=recognition=new Recognition();r.lang='en-US';r.continuous=true;r.interimResults=true;r.maxAlternatives=1;
  r.onstart=()=>{if(token===generation&&wanted)update('listening');};
  r.onresult=e=>{if(token!==generation)return;for(let i=e.resultIndex;i<e.results.length;i++){const result=e.results[i],text=result[0].transcript.trim();if(result.isFinal){parts.set(i,text);interim.delete(i);}else interim.set(i,text);}transcript=combine();onTranscript(transcript);};
  r.onerror=e=>{if(token!==generation)return;if(e.error==='no-speech'||e.error==='aborted'&&!wanted)return;wanted=false;clearRestart();onError(e.error==='not-allowed'||e.error==='service-not-allowed'?'마이크 사용을 허용한 뒤 음성 대화를 다시 시작해주세요.':'음성 인식 연결이 끊겼어요. 인식된 내용은 남아 있어요. 다시 시작하거나 텍스트로 보내주세요.');update('idle');settle();};
  r.onend=()=>{if(token!==generation)return;recognition=null;prefix=transcript;if(wanted){update('reconnecting');restartTimer=setTimer(()=>{restartTimer=null;begin();},250);}else{update('idle');settle();}};
  try{r.start();update('listening');}catch{wanted=false;recognition=null;update('idle');onError('음성 인식을 시작하지 못했어요. 다시 시작하거나 텍스트로 채팅해주세요.');settle();}
 }
 function cancelSpeech(){speechGeneration++;voiceWaitCleanup?.();voiceWaitCleanup=null;synthesis?.cancel();if(state==='speaking')update('idle');}
 function cancel(){wanted=false;generation++;clearRestart();const r=recognition;recognition=null;r?.abort();update('idle');settle();}
 function start(initial=''){
  if(!Recognition){onError('이 브라우저는 음성 인식을 지원하지 않아요. 텍스트로 채팅할 수 있어요.');return false;}
  cancel();cancelSpeech();transcript=prefix=String(initial).trim();parts=new Map();interim=new Map();wanted=true;begin();return wanted;
 }
 function stop(){wanted=false;clearRestart();if(!recognition){update('idle');return Promise.resolve(transcript);}update('finishing');return new Promise(resolve=>{stopResolve=resolve;stopTimer=setTimer(()=>{generation++;const r=recognition;recognition=null;r?.abort();update('idle');settle();},1800);try{recognition.stop();}catch{update('idle');settle();}});}
 function speak(text,done=()=>{}){
  cancel();cancelSpeech();const token=++speechGeneration;const chunks=speechChunks(text);if(!synthesis||!Utterance){onError('읽어주기가 지원되지 않아요. 코치의 답변을 화면에서 확인해주세요.');return;}
  let selectedVoice;
  const play=i=>{if(token!==speechGeneration)return;if(i>=chunks.length){update('idle');done();return;}const u=new Utterance(chunks[i]);u.lang=selectedVoice?.lang||'en-US';u.rate=1;u.pitch=1;u.volume=1;if(selectedVoice)u.voice=selectedVoice;
   u.onend=()=>play(i+1);u.onerror=()=>{if(token===speechGeneration){update('idle');onError('코치 음성을 재생하지 못했어요. 화면의 답변을 읽거나 다시 듣기를 눌러주세요.');}};update('speaking');synthesis.speak(u);
  };
  const available=synthesis.getVoices?.()||[];
  if(available.length||!synthesis.addEventListener){selectedVoice=coachVoice(available);play(0);return;}
  // Chrome may populate voices after the first request. Wait briefly, with cancellable fallback.
  update('speaking');
  let timer;
  const cleanup=()=>{synthesis.removeEventListener?.('voiceschanged',ready);if(timer!==undefined)clearTimer(timer);};
  const ready=()=>{if(token!==speechGeneration)return;const voices=synthesis.getVoices?.()||[];if(!voices.length)return;launch(voices);};
  const launch=voices=>{cleanup();voiceWaitCleanup=null;if(token!==speechGeneration)return;selectedVoice=coachVoice(voices);play(0);};
  voiceWaitCleanup=cleanup;synthesis.addEventListener('voiceschanged',ready);timer=setTimer(()=>launch(synthesis.getVoices?.()||[]),1000);

 }
 return {start,stop,cancel,speak,cancelSpeech,get state(){return state;},get transcript(){return transcript;},get listening(){return wanted;},dispose(){cancel();cancelSpeech();}};
}
