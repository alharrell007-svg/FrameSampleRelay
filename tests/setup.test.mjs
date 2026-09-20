import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
test('setup creates matching JSON/deeplink, preserves existing files, and rolls back conflicts',async()=>{
  const base=await fs.mkdtemp(path.join(os.tmpdir(),'video-setup-unit-'));
  const suffix=process.platform==='win32'?'.exe':'';
  const binaries=[path.join(base,'ffmpeg'+suffix),path.join(base,'ffprobe'+suffix)];
  for(const file of binaries)await fs.writeFile(file,'prerequisite-discovery fixture',{mode:0o700});
  const cfg=path.join(base,'video-tool.config.json'),entry=path.join(base,'lm-studio-entry.json'),html=path.join(base,'add-to-lm-studio.html');
  const cli=fileURLToPath(new URL('../cli.mjs',import.meta.url));
  async function setup(){return new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,[cli,'setup','--root',base,'--model','test-vision','--config',cfg,'--ffmpeg-dir',base],{stdio:'ignore',windowsHide:true});
    child.on('error',reject);child.on('exit',resolve);
  });}
  try{
    assert.equal(await setup(),0);
    const json=JSON.parse(await fs.readFile(entry,'utf8'));
    const href=(await fs.readFile(html,'utf8')).match(/href="([^"]+)"/)[1].replaceAll('&amp;','&');
    const url=new URL(href);
    assert.equal(url.protocol,'lmstudio:');assert.equal(url.hostname,'add_mcp');
    assert.deepEqual(JSON.parse(Buffer.from(url.searchParams.get('config'),'base64').toString()),json.mcpServers['framesamplerelay']);
    const prior=await fs.readFile(cfg,'utf8');assert.equal(await setup(),1);assert.equal(await fs.readFile(cfg,'utf8'),prior);
    await fs.unlink(cfg);
    assert.equal(await setup(),1);await assert.rejects(fs.access(cfg));
    await fs.unlink(entry);
    assert.equal(await setup(),1);await assert.rejects(fs.access(cfg));await assert.rejects(fs.access(entry));
  }finally{
    for(const file of [...binaries,cfg,entry,html])await fs.rm(file,{force:true});await fs.rmdir(base);
  }
});
