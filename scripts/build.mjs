import {mkdir,cp,copyFile,rm,readdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
await rm('dist',{recursive:true,force:true});
for(const dir of ['dist/web','dist/extension']){await mkdir(dir,{recursive:true});await cp('shared',`${dir}/shared`,{recursive:true});}
await rm('dist/extension/shared/buddy-demo.js');await copyFile('index.html','dist/web/index.html');await copyFile('buddy-demo.html','dist/web/buddy-demo.html');await copyFile('extension/buddy.js','dist/web/buddy.js');await copyFile('PRIVACY.md','dist/web/PRIVACY.md');
await cp('extension','dist/extension',{recursive:true});await copyFile('index.html','dist/extension/options.html');await copyFile('LICENSE','dist/extension/LICENSE.txt');await copyFile('PRIVACY.md','dist/extension/PRIVACY.md');
// Small dependency-free ZIP writer (stored entries), so installers need no Node or server.
const table=Array.from({length:256},(_,i)=>{for(let j=0;j<8;j++)i=(i&1)?0xedb88320^(i>>>1):i>>>1;return i>>>0;});
function crc(buf){let c=0xffffffff;for(const x of buf)c=table[(c^x)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
async function files(dir,prefix=''){let out=[];for(const e of await readdir(dir,{withFileTypes:true})){const rel=prefix+e.name;if(e.isDirectory())out.push(...await files(path.join(dir,e.name),rel+'/'));else out.push({name:rel,data:await readFile(path.join(dir,e.name))});}return out;}
let offset=0;const chunks=[],central=[];for(const file of await files('dist/extension')){const name=Buffer.from(file.name);const checksum=crc(file.data);const h=Buffer.alloc(30);h.writeUInt32LE(0x04034b50,0);h.writeUInt16LE(20,4);h.writeUInt32LE(checksum,14);h.writeUInt32LE(file.data.length,18);h.writeUInt32LE(file.data.length,22);h.writeUInt16LE(name.length,26);chunks.push(h,name,file.data);const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50,0);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt32LE(checksum,16);c.writeUInt32LE(file.data.length,20);c.writeUInt32LE(file.data.length,24);c.writeUInt16LE(name.length,28);c.writeUInt32LE(offset,42);central.push(c,name);offset+=h.length+name.length+file.data.length;}
const cb=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(central.length/2,8);end.writeUInt16LE(central.length/2,10);end.writeUInt32LE(cb.length,12);end.writeUInt32LE(offset,16);const zip=Buffer.concat([...chunks,cb,end]);
await writeFile('dist/routine-english-extension.zip',zip);await writeFile('dist/web/routine-english-extension.zip',zip);
console.log('Built dist/extension, dist/web, dist/routine-english-extension.zip');
