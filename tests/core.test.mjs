import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadConfig,findExecutable } from '../src/config.mjs';
import { validateArguments,validateFile,finalText,modelStatus,requestLocal } from '../src/server.mjs';
const root=path.join(os.tmpdir(),'video-unit-root');
const config={allowedRoot:root,maxBytes:1000};
const valid={path:path.join(root,'video with spaces.mp4'),question:'What is visible?'};
test('accepts spaces and nested folders',()=>{
  assert.equal(validateArguments(valid,config).extension,'.mp4');
  assert.equal(validateArguments({...valid,path:path.join(root,'sub','clip.MOV')},config).extension,'.mov');
});
for(const name of ['outside','prefix','traversal','relative','url','unsupported','empty-question','extra-option'])test('rejects '+name,()=>{
  const changes={outside:{path:path.join(os.tmpdir(),'other.mp4')},prefix:{path:root+'-other'+path.sep+'clip.mp4'},
    traversal:{path:root+path.sep+'..'+path.sep+'clip.mp4'},relative:{path:'clip.mp4'},url:{path:'https://example.invalid/a.mp4'},
    unsupported:{path:path.join(root,'clip.m3u8')},'empty-question':{question:''},'extra-option':{url:'http://example.invalid'}};
  assert.throws(()=>validateArguments({...valid,...changes[name]},config));
});
if(process.platform==='win32')for(const value of ['\\\\host\\share\\clip.mp4','\\\\?\\C:\\clip.mp4',root+'\\clip.mp4:stream',root+'\\NUL.mp4',root+'\\sub.\\clip.mp4'])
  test('rejects Windows ambiguous path '+path.basename(value),()=>assert.throws(()=>validateArguments({...valid,path:value},config)));
test('filesystem boundary: missing, empty, directory, hard link, junction escape',async()=>{
  const base=await fs.mkdtemp(path.join(os.tmpdir(),'video-unit-'));
  const inside=path.join(base,'inside'),outside=path.join(base,'outside');
  await fs.mkdir(inside);await fs.mkdir(outside);
  const files=[path.join(inside,'valid.mp4'),path.join(inside,'empty.mp4'),path.join(outside,'private.mp4'),path.join(inside,'hard.mp4')];
  const link=path.join(inside,'escape');
  try{
    await fs.writeFile(files[0],'valid');await fs.writeFile(files[1],'');await fs.writeFile(files[2],'outside');await fs.link(files[2],files[3]);
    await fs.symlink(outside,link,process.platform==='win32'?'junction':'dir');
    const local={allowedRoot:inside,maxBytes:1000};
    await validateFile(files[0],local);
    await assert.rejects(validateFile(path.join(inside,'missing.mp4'),local),/does not exist/);
    await assert.rejects(validateFile(files[1],local),/empty/);
    await assert.rejects(validateFile(inside,local));
    await assert.rejects(validateFile(files[3],local),/hard link/);
    await assert.rejects(validateFile(path.join(link,'private.mp4'),local),/outside/);
  }finally{await fs.unlink(link).catch(()=>{});for(const file of files)await fs.rm(file,{force:true});await fs.rmdir(inside);await fs.rmdir(outside);await fs.rmdir(base);}
});
test('missing FFmpeg gives an actionable error',async()=>await assert.rejects(findExecutable('ffmpeg',path.join(os.tmpdir(),'absent-video-binary')),/missing/));
test('rejects incomplete, empty, reasoning and tool-call outputs',()=>{
  assert.equal(finalText({choices:[{finish_reason:'stop',message:{content:'A square.',reasoning_content:'not returned'}}]}),'A square.');
  for(const message of [{content:''},{content:'<think>text'},{content:'description',tool_calls:[{}]}])
    assert.throws(()=>finalText({choices:[{finish_reason:'stop',message}]}));
  assert.throws(()=>finalText({choices:[{finish_reason:'length',message:{content:'partial'}}]}));
});
test('loopback API: missing/unloaded/text-only models, auth, redirects, service restart',async()=>{
  let scenario='missing';
  const handler=(req,res)=>{
    if(scenario==='auth'){res.writeHead(401);res.end('{}');return;}
    if(scenario==='redirect'){res.writeHead(302,{Location:'https://example.invalid/'});res.end('{}');return;}
    const model={key:'test-vision',capabilities:{vision:scenario!=='text'},loaded_instances:scenario==='unloaded'?[]:[{id:'test-vision'}]};
    res.setHeader('Content-Type','application/json');res.end(JSON.stringify({models:scenario==='missing'?[]:[model]}));
  };
  let server=http.createServer(handler);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const local={port:server.address().port,visionModel:'test-vision'};
  try{
    await assert.rejects(modelStatus(local),/not available/);
    scenario='unloaded';await assert.rejects(modelStatus(local),/not loaded/);
    scenario='text';await assert.rejects(modelStatus(local),/vision support/);
    scenario='auth';await assert.rejects(modelStatus(local),/401/);
    scenario='redirect';await assert.rejects(requestLocal(local,'/api/v1/models',undefined,AbortSignal.timeout(2000)),/302/);
    await new Promise(resolve=>server.close(resolve));
    await assert.rejects(modelStatus(local),/Could not reach/);
    scenario='ready';server=http.createServer(handler);await new Promise(resolve=>server.listen(local.port,'127.0.0.1',resolve));
    assert.equal((await modelStatus(local)).key,'test-vision');
  }finally{await new Promise(resolve=>server.close(resolve));}
});
test('MCP start/restart uses only one tool and refuses unknown tools',async()=>{
  const base=await fs.mkdtemp(path.join(os.tmpdir(),'video-mcp-unit-'));
  const cfg=path.join(base,'config.json');const input=path.join(base,'requests.jsonl');const output=path.join(base,'responses.jsonl');
  const serverPath=fileURLToPath(new URL('../src/server.mjs',import.meta.url));
  await fs.writeFile(cfg,JSON.stringify({allowedRoot:base,visionModel:'test',ffmpegPath:process.execPath,ffprobePath:process.execPath}));
  const lines=[{id:1,method:'initialize',params:{protocolVersion:'2025-06-18'}},{method:'notifications/initialized'},
    {id:2,method:'tools/list'},{id:3,method:'tools/call',params:{name:'execute'}},
    {id:4,method:'tools/call',params:{name:'analyze_video',arguments:{path:'bad',question:'what?'}}}];
  await fs.writeFile(input,lines.map(line=>JSON.stringify({jsonrpc:'2.0',...line})).join('\n')+'\n');
  try{for(let attempt=0;attempt<2;attempt++){
    const i=await fs.open(input,'r'),o=await fs.open(output,'w');
    try{await new Promise((resolve,reject)=>{const child=spawn(process.execPath,[serverPath,cfg],{windowsHide:true,stdio:[i.fd,o.fd,'ignore']});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error('server exit')));});}
    finally{await i.close();await o.close();}
    const replies=(await fs.readFile(output,'utf8')).trim().split('\n').map(JSON.parse);
    assert.deepEqual(replies.find(r=>r.id===2).result.tools.map(t=>t.name),['analyze_video']);
    assert.equal(replies.find(r=>r.id===3).error.code,-32602);assert.equal(replies.find(r=>r.id===4).result.isError,true);
  }}finally{for(const file of [cfg,input,output])await fs.rm(file,{force:true});await fs.rmdir(base);}
});
