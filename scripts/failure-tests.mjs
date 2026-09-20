// Uses synthetic fixtures and a loopback stub; does not restart LM Studio or unload models.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { loadConfig } from '../src/config.mjs';
import { analyzeVideo,run } from '../src/server.mjs';
const [configFile,fixturesArg,outputFile]=process.argv.slice(2);
const original=await loadConfig(configFile);const fixtures=path.resolve(fixturesArg);
const results=[];let requests=0;
const server=http.createServer((req,res)=>{
  req.resume();res.setHeader('Content-Type','application/json');
  if(req.url==='/api/v1/models')res.end(JSON.stringify({models:[{key:'fixture-vision',capabilities:{vision:true},loaded_instances:[{id:'fixture-vision'}]}]}));
  else{requests++;res.end(JSON.stringify({choices:[{finish_reason:'stop',message:{content:'Synthetic vision stub: transport and extraction succeeded.'}}]}));}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const config={...original,port:server.address().port,visionModel:'fixture-vision'};
const source=path.join(fixtures,'simple motion.mp4');
const generated=[];
const tempFolders=async()=>new Set((await fs.readdir(os.tmpdir())).filter(name=>name.startsWith('framesamplerelay-')));
async function check(name,args,expectedSuccess,overrides={},options={}){
  const before=await tempFolders();const started=Date.now();let actualSuccess=false,error=null;
  try{await analyzeVideo(args,{...config,...overrides},options);actualSuccess=true;}catch(e){error=e.message;}
  const after=await tempFolders();const cleanup=[...after].every(name=>before.has(name));
  results.push({name,expectedSuccess,actualSuccess,cleanup,passed:actualSuccess===expectedSuccess&&cleanup,error,seconds:(Date.now()-started)/1000,kind:'extraction and failure handling; vision stub, not model compatibility'});
}
try{
  await check('missing file',{path:path.join(fixtures,'missing.mp4'),question:'Describe.'},false);
  await check('invalid outside path',{path:path.join(os.tmpdir(),'outside.mp4'),question:'Describe.'},false);
  await check('filename with spaces',{path:source,question:'Describe.'},true);
  const corrupt=path.join(fixtures,'corrupt.mp4');generated.push(corrupt);await fs.writeFile(corrupt,'not a video');
  await check('corrupt video',{path:corrupt,question:'Describe.'},false);
  const playlist=path.join(fixtures,'unsupported.m3u8');generated.push(playlist);await fs.writeFile(playlist,'#EXTM3U');
  await check('unsupported playlist',{path:playlist,question:'Describe.'},false);
  await fs.writeFile(corrupt,'#EXTM3U\n#EXTINF:6,\nhttp://127.0.0.1:1/should-not-be-opened\n');
  await check('wrong video extension cannot activate playlist demuxer',{path:corrupt,question:'Describe.'},false);
  const sub=path.join(fixtures,'nested');await fs.mkdir(sub);const nested=path.join(sub,'nested clip.mp4');generated.push(nested);await fs.copyFile(source,nested);
  await check('nested directory',{path:nested,question:'Describe.'},true);
  const controller=new AbortController();
  await check('cancel during extraction',{path:source,question:'Describe.'},false,{}, {signal:controller.signal,progress:message=>{if(message==='Extracting sampled frames')controller.abort();}});
  for(const [extension,codec] of [['mov','mpeg4'],['m4v','mpeg4'],['mkv','mpeg4'],['avi','mpeg4'],['webm','libvpx']]){
    const target=path.join(fixtures,'format.'+extension);generated.push(target);
    await run(config.ffmpegPath,['-v','error','-nostdin','-i',source,'-an','-c:v',codec,'-n',target],AbortSignal.timeout(30000));
    await check('container '+extension,{path:target,question:'Describe.'},true);
  }
  for(const [name,seconds] of [['short',1],['long',65]]){
    const target=path.join(fixtures,name+'.mp4');generated.push(target);
    await run(config.ffmpegPath,['-v','error','-nostdin','-f','lavfi','-i',`color=c=red:s=320x240:r=12:d=${seconds}`,'-an','-c:v','libx264','-n',target],AbortSignal.timeout(30000));
    await check(name+' video',{path:target,question:'Describe.'},true);
    if(name==='long')await check('configured duration limit',{path:target,question:'Describe.'},false,{maxDurationSeconds:10});
  }
  await check('size limit',{path:source,question:'Describe.'},false,{maxBytes:10});
  await fs.unlink(nested);generated.splice(generated.indexOf(nested),1);await fs.rmdir(sub);
}finally{
  for(const file of generated)await fs.rm(file,{force:true});
  await new Promise(resolve=>server.close(resolve));
}
await fs.writeFile(outputFile,JSON.stringify({results,stubInferenceRequests:requests,realLMStudioRestart:'not performed; preserved running setup'},null,2)+'\n');
console.log(JSON.stringify({tests:results.length,passed:results.filter(r=>r.passed).length,failures:results.filter(r=>!r.passed)},null,2));
if(results.some(r=>!r.passed))process.exitCode=1;
