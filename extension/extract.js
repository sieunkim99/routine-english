// Serialized into the active page by scripting.executeScript; must be self-contained.
export function extractPage(){
 const limit=6000;
 const active=document.activeElement;
 if(active?.matches('input,textarea,[contenteditable="true"]'))throw Error('입력창 대신 본문을 선택해주세요.');
 const selection=getSelection()?.toString().trim()||'';
 const root=document.querySelector('article,[role="main"],main')||document.body;
 const blocked='script,style,noscript,nav,header,footer,aside,form,input,textarea,select,button,[contenteditable],[aria-hidden="true"],[hidden]';
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node,total='',count=0;
 while(!selection&&(node=walker.nextNode())&&count++<20000&&total.length<limit){const parent=node.parentElement;if(!parent||parent.closest(blocked))continue;const css=getComputedStyle(parent);if(css.display==='none'||css.visibility==='hidden'||!parent.getClientRects().length)continue;const value=node.textContent.replace(/\s+/g,' ').trim();if(value.length>1)total+=value+'\n';}
 const text=(selection||total).slice(0,limit).trim();if(text.length<20)throw Error('읽을 수 있는 텍스트가 부족해요. 본문을 선택하거나 직접 붙여넣어주세요.');
 return {title:document.title.slice(0,300),url:location.origin+location.pathname,text,kind:selection?'selection':'page',capturedAt:Date.now()};
}
