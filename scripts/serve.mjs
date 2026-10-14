import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),port=Number(process.env.PORT||5173);
const server=http.createServer(async(req,res)=>{try{const p=new URL(req.url,'http://127.0.0.1').pathname;let rel=p==='/'?'index.html':decodeURIComponent(p.slice(1));if(rel==='buddy.js')rel='extension/buddy.js';if(rel==='routine-english-extension.zip')rel='dist/web/routine-english-extension.zip';
 if(!(rel==='index.html'||rel==='buddy-demo.html'||rel==='extension/buddy.js'||rel==='sample.html'||rel==='PRIVACY.md'||rel==='dist/web/routine-english-extension.zip'||/^shared\/[\w-]+\.(js|css|svg)$/.test(rel))){res.writeHead(404);res.end('Not found');return;}
 const content=await readFile(path.join(root,rel));res.writeHead(200,{'Content-Type':{'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.zip':'application/zip','.md':'text/plain; charset=utf-8'}[path.extname(rel)],'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(content);
 }catch{res.writeHead(404);res.end('Not found');}});
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`포트 ${port}이 사용 중입니다. 기존 서버를 Ctrl+C로 종료한 뒤 다시 실행해주세요.`:e.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`설치 전 미리보기 http://127.0.0.1:${port}\n확장 프로그램은 서버 없이 동작합니다.`));
