// Serialized into the active page by scripting.executeScript; must be self-contained.
export function extractPage(){
 const limit=6000;
 const active=document.activeElement;
 const notion=/(^|\.)notion\.(?:so|site|com)$/.test(location.hostname||'');
 const inNotionBlock=notion&&!!active?.closest?.('[data-block-id],.notion-page-content');
 const editing=active?.matches('input,textarea')||active?.matches('[contenteditable="true"]')&&!inNotionBlock;
 const selection=editing?'':getSelection()?.toString().trim()||'';
 const root=(notion&&active?.closest?.('.notion-page-content'))||(notion&&document.querySelector('.notion-page-content,[data-testid="page-content"]'))||document.querySelector('[role="main"],main')||(document.querySelectorAll?.('article').length>1?document.body:document.querySelector('article'))||document.body;
 const blocked='script,style,noscript,nav,header,footer,aside,form,input,textarea,select,button,[aria-hidden="true"],[hidden]';
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node,total='',onScreen='',count=0;
 while(!selection&&(node=walker.nextNode())&&count++<20000&&onScreen.length<limit){const parent=node.parentElement;if(!parent||parent.closest(blocked)||!notion&&parent.closest('[contenteditable]'))continue;const css=getComputedStyle(parent);if(css.display==='none'||css.visibility==='hidden'||!parent.getClientRects().length)continue;const value=node.textContent.replace(/\s+/g,' ').trim();if(value.length>1){if(total.length<limit)total+=value+'\n';const rect=parent.getBoundingClientRect?.();if(!rect||rect.bottom>0&&rect.top<(globalThis.innerHeight||900))onScreen+=value+'\n';}}
 const text=(selection||(onScreen.trim().length>=20?onScreen:total)).slice(0,limit).trim();if(text.length<20)throw Error('읽을 수 있는 텍스트가 부족해요. 본문을 선택하거나 직접 붙여넣어주세요.');
 return {title:document.title.slice(0,300),url:location.origin+location.pathname,text,kind:selection?'selection':'page',capturedAt:Date.now()};
}
