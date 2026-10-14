import {createController} from './shared/controller.js';
import {migrate,canInvite,reviewQueue} from './shared/state.js';
import {extractPage} from './extract.js';
import {activityContext} from './activity.js';
const controller=createController(chrome.storage);
const ready=Promise.all([chrome.storage.local.setAccessLevel({accessLevel:'TRUSTED_CONTEXTS'}),chrome.storage.session.setAccessLevel({accessLevel:'TRUSTED_CONTEXTS'})]);
let captureSequence=0;
export async function capture(tab){const sequence=++captureSequence;try{
 const fallback=activityContext(tab);if(!tab?.id||!fallback)throw Error('일반 웹페이지에서 RoutineEnglish 아이콘이나 단축키로 열어주세요.');
 let context;try{const [result]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:extractPage});context=result?.result&&!result.error?{...result.result,tabId:tab.id}:null;}catch{}
 if(sequence===captureSequence)await chrome.storage.session.set({pageContext:context||{...fallback,tabId:tab.id},captureError:''});
 }catch(error){if(sequence===captureSequence)await chrome.storage.session.set({pageContext:null,captureError:error.message});}}
function openFromAction(tab){chrome.sidePanel.open({tabId:tab.id}).catch(()=>{});capture(tab);}
chrome.action.onClicked.addListener(openFromAction);
chrome.contextMenus.onClicked.addListener((info,tab)=>{if(info.menuItemId==='practice')openFromAction(tab);});
async function schedule(){await ready;const {state}=await chrome.storage.local.get('state');const s=migrate(state);if(s.onboarding.approved&&s.settings.enabled){const alarm=await chrome.alarms.get('invite');let development=false;try{development=(await chrome.management?.getSelf?.())?.installType==='development';}catch{}const period=s.settings.schedule==='times'?1:Math.min(5,development?s.settings.interval:Math.max(.5,s.settings.interval));if(!alarm||alarm.periodInMinutes!==period)await chrome.alarms.create('invite',{periodInMinutes:period,delayInMinutes:period});}else await chrome.alarms.clear('invite');}
let buddySync=Promise.resolve();
function syncBuddy(refresh=false){buddySync=buddySync.catch(()=>{}).then(async()=>{
 if(!chrome.scripting.registerContentScripts||!chrome.permissions)return;const snap=await controller.snapshot(),enabled=snap.state.settings.buddyEnabled&&await chrome.permissions.contains({origins:['https://*/*','http://*/*']});const scripts=await chrome.scripting.getRegisteredContentScripts({ids:['routine-buddy']});
 if(enabled&&!scripts.length)await chrome.scripting.registerContentScripts([{id:'routine-buddy',matches:['https://*/*','http://*/*'],js:['buddy.js'],runAt:'document_idle',allFrames:false,persistAcrossSessions:true}]);
 if(!enabled&&scripts.length)await chrome.scripting.unregisterContentScripts({ids:['routine-buddy']});
 const tabs=await chrome.tabs.query({});for(const tab of tabs){if(enabled&&/^https?:/.test(tab.url||'')){try{if(refresh)await chrome.scripting.executeScript({target:{tabId:tab.id},func:()=>document.getElementById('routine-english-buddy')?.remove()});await chrome.scripting.executeScript({target:{tabId:tab.id},files:['buddy.js']});}catch{}}try{await chrome.tabs.sendMessage(tab.id,{type:'buddy-state',enabled,quietUntil:snap.state.snooze});}catch{}}
 });return buddySync;}
async function buddyStatus(){const snap=await controller.snapshot();return {enabled:!!snap.state.settings.buddyEnabled,quietUntil:snap.state.snooze};}
async function setup(details){await ready;await chrome.sidePanel.setPanelBehavior({openPanelOnActionClick:false});await chrome.alarms.clear('practice');await chrome.contextMenus.removeAll();chrome.contextMenus.create({id:'practice',title:'이 내용으로 영어 대화',contexts:['selection']});await schedule();await syncBuddy();if(details?.reason==='install')chrome.runtime.openOptionsPage();}
chrome.runtime.onInstalled.addListener(setup);chrome.runtime.onStartup.addListener(async()=>{await schedule();await syncBuddy();});
chrome.permissions?.onRemoved?.addListener(async()=>{const snap=await controller.snapshot();if(snap.state.settings.buddyEnabled&&!await chrome.permissions.contains({origins:['https://*/*','http://*/*']}))await controller.dispatch({type:'settings',settings:{buddyEnabled:false,delivery:'notification'}});await syncBuddy();});
chrome.storage.onChanged.addListener(async(changes,area)=>{if(area!=='local'||!changes.state)return;await schedule();if(changes.state.newValue?.settings?.buddyEnabled!==changes.state.oldValue?.settings?.buddyEnabled||changes.state.newValue?.snooze!==changes.state.oldValue?.snooze)await syncBuddy();if(changes.state.newValue?.snooze>Date.now()){await chrome.notifications.clear('practice');const {invitationWindow}=await chrome.storage.session.get('invitationWindow');if(invitationWindow){try{await chrome.windows.remove(invitationWindow);}catch{}await chrome.storage.session.remove('invitationWindow');}}});
chrome.tabs.onActivated.addListener(async({tabId})=>{captureSequence++;const {pageContext}=await chrome.storage.session.get('pageContext');if(pageContext&&pageContext.tabId!==tabId)await chrome.storage.session.set({pageContext:null,captureError:''});});
chrome.tabs.onUpdated.addListener(async(tabId,change)=>{if(change.status==='loading'){const {pageContext}=await chrome.storage.session.get('pageContext');if(pageContext?.tabId===tabId){captureSequence++;await chrome.storage.session.set({pageContext:null,captureError:'페이지가 바뀌었어요. 아이콘이나 ⌘⇧Y로 다시 열어주세요.'});}}});
chrome.runtime.onMessage.addListener((message,sender,respond)=>{
 if(sender.id===chrome.runtime.id&&sender.tab&&/^https?:/.test(sender.tab.url||'')&&['buddy-status','buddy-start','buddy-quiet','buddy-settings'].includes(message.type)){
  let opened;if(message.type==='buddy-start'){opened=chrome.sidePanel.open({tabId:sender.tab.id});opened.catch(()=>{});}
  const work=async()=>{await ready;const status=await buddyStatus();if(!status.enabled)throw Error('설정에서 고양이 친구를 켜주세요.');if(message.type==='buddy-quiet'){await controller.dispatch({type:'snooze',minutes:60});return buddyStatus();}if(message.type==='buddy-settings'){await chrome.runtime.openOptionsPage();return status;}if(message.type==='buddy-start'){await opened;await capture(sender.tab);let snap=await controller.snapshot();if(!snap.hasKey||!snap.state.onboarding.approved){await chrome.runtime.openOptionsPage();return status;}if(snap.active?.feedback){await controller.dispatch({type:'close'});snap=await controller.snapshot();}if(!snap.active&&snap.pageContext?.tabId===sender.tab.id)await controller.dispatch({type:'start',kind:'page'});}return status;};
  work().then(value=>respond({ok:true,value}),error=>respond({ok:false,error:error.message}));return true;
 }
 if(sender.id!==chrome.runtime.id||!sender.url?.startsWith(chrome.runtime.getURL('')))return;
 const work=async()=>{await ready;if(message.type==='capture'){const [tab]=await chrome.tabs.query({active:true,lastFocusedWindow:true});await capture(tab);return controller.snapshot();}if(message.type==='options'){await chrome.runtime.openOptionsPage();return {};}
 if(message.type==='buddy-refresh'){await syncBuddy(true);return controller.snapshot();}
 if(!['skip-goal','snapshot','connect','mode','goal','approve','revise','settings','snooze','resume','review-reveal','review-rate','start','turn','finish','hint','support','close','disconnect'].includes(message.type))throw Error('지원하지 않는 요청입니다.');
 const result=await controller.dispatch(message);if(message.type==='settings'&&'buddyEnabled' in (message.settings||{}))await syncBuddy();return result;};
 work().then(value=>respond({ok:true,value}),error=>respond({ok:false,error:error.message||'요청을 완료하지 못했어요.'}));return true;
});
let inviting=false;
chrome.alarms.onAlarm.addListener(async alarm=>{if(alarm.name!=='invite'||inviting)return;inviting=true;try{await ready;const {state,credential}=await chrome.storage.local.get(['state','credential']);if(!credential?.key)return;const {active}=await chrome.storage.session.get('active');if(active&&!active.feedback)return;const s=migrate(state);const activity=await chrome.idle.queryState(120);if(!canInvite(s,Date.now(),activity))return;
 const count=reviewQueue(s).length;
 if(s.settings.delivery==='buddy'&&s.settings.buddyEnabled){const [tab]=await chrome.tabs.query({active:true,lastFocusedWindow:true});if(!tab?.id)return;try{await chrome.tabs.sendMessage(tab.id,{type:'buddy-invite',review:count>0});}catch{return;}}else if(s.settings.delivery==='popup'){const {invitationWindow}=await chrome.storage.session.get('invitationWindow');if(invitationWindow){try{await chrome.windows.get(invitationWindow);return;}catch{}}const win=await chrome.windows.create({url:chrome.runtime.getURL('panel.html?invite=1'),type:'popup',width:410,height:640,focused:false});await chrome.storage.session.set({invitationWindow:win.id});}else await chrome.notifications.create('practice',{type:'basic',iconUrl:'icon.png',title:count?'지난 표현, 한 문장 떠올려볼까요?':'지금 보는 내용으로 영어 한 문장?',message:count?'정답을 보기 전에 한 번 떠올려봐요. 막히면 힌트를 받고, 바쁘면 미뤄도 좋아요.':'내 목표에 맞춰 한 문장부터 연습해요. 아이콘이나 ⌘⇧Y로 열어주세요.',buttons:[{title:count?'복습하기':'학습 열기'},{title:'30분 뒤'}]});await controller.dispatch({type:'invited'});
 }finally{inviting=false;}});
async function openLearning(){const {state}=await chrome.storage.local.get('state');await chrome.storage.session.set({preferredView:migrate(state).sessions.length?'review':'page'});try{const win=await chrome.windows.getLastFocused();await chrome.sidePanel.open({windowId:win.id});}catch{await chrome.tabs.create({url:chrome.runtime.getURL('panel.html?view=review')});}await chrome.notifications.clear('practice');}
chrome.notifications.onClicked.addListener(openLearning);
chrome.notifications.onButtonClicked.addListener(async(id,index)=>{if(id!=='practice')return;if(index===1){await controller.dispatch({type:'snooze',minutes:30});await chrome.notifications.clear(id);}else await openLearning();});
