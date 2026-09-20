// Outputs are PRIVATE by default: review/redact paths, prompts and model aliases before sharing.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import { loadConfig,VERSION } from '../src/config.mjs';
import { analyzeVideo,requestLocal,TOOL,validateArguments } from '../src/server.mjs';
const flags={};for(let i=2;i<process.argv.length;i+=2)flags[process.argv[i].replace(/^--/,'')]=process.argv[i+1];
const config=await loadConfig(flags.config);
const mode=flags.mode||'vision', repeats=Number(flags.repeats||3);
if(!['vision','orchestration','end-to-end'].includes(mode)||!Number.isInteger(repeats)||repeats<1||repeats>10)throw new Error('Invalid mode or repeat count.');
const fixtures=path.resolve(flags.fixtures), manifest=JSON.parse(await fs.readFile(path.join(fixtures,'manifest.json'),'utf8'));
const directory=path.resolve(flags.output);await fs.mkdir(directory,{recursive:true});
const models=await requestLocal(config,'/api/v1/models',undefined,AbortSignal.timeout(10000));
const chatModel=flags['chat-model'];
if(mode!=='vision' && !models.models.some(model=>model.loaded_instances?.some(instance=>instance.id===chatModel)))
  throw new Error('Chat model is not loaded. Load it manually; the harness never changes loaded models.');
const chatSettings={temperature:0.2,max_tokens:700,stream:false,tool_choice:'auto',parallel_tool_calls:false};
if(flags['chat-reasoning'])chatSettings.reasoning_effort=flags['chat-reasoning'];
const implementationHashes={};
for(const [name,url] of [['server',new URL('../src/server.mjs',import.meta.url)],['config',new URL('../src/config.mjs',import.meta.url)],['harness',new URL(import.meta.url)]])
  implementationHashes[name]=createHash('sha256').update(await fs.readFile(url)).digest('hex');
const metadata={toolVersion:VERSION,os:{platform:os.platform(),release:os.release(),arch:os.arch()},node:process.versions.node,
  lmStudioVersion:flags['lm-version']||'not supplied',mode,repeats,chatModel:chatModel||null,visionModel:config.visionModel,
  frameCount:config.frameCount,visionTemperature:0.2,visionMaxTokens:config.maxOutputTokens,visionReasoningEffort:config.visionReasoningEffort??'host default',chatSettings,implementationHashes,
  modelSnapshot:models.models.filter(model=>model.key===config.visionModel || model.loaded_instances?.some(instance=>[chatModel,config.visionModel].includes(instance.id))),
  prompts:{system:'For video questions, first call list_videos to find the exact file, then analyze_video with its path and the user question. Never use read_file to interpret a video. After the result, answer briefly using only those observations and preserve uncertainty. If a tool fails, say so. Do not invent a description.',
    userTemplate:'Please tell me what is visible in the video titled "{title}" in my folder.'},
  note:mode==='orchestration'?'Vision is isolated: analyze_video returns deterministic ground truth. No vision inference counts toward this mode.':'Live vision calls; outputs preserved even when wrong.'};
await fs.writeFile(path.join(directory,'configuration.json'),JSON.stringify(metadata,null,2)+'\n',{flag:'wx'});
const resultsFile=path.join(directory,'attempts.jsonl');
const listingTool={name:'list_videos',description:'List videos in the allowed folder so you can discover the exact path.',inputSchema:{type:'object',properties:{},additionalProperties:false}};
const readTool={name:'read_file',description:'Read a text document. Cannot interpret a video.',inputSchema:{type:'object',properties:{path:{type:'string'}},required:['path']}};
const tools=[listingTool,TOOL,readTool].map(t=>({type:'function',function:{name:t.name,description:t.description,parameters:t.inputSchema}}));
let consecutiveFailures=0, completed=0;
outer: for(const fixture of manifest)for(let attempt=1;attempt<=repeats;attempt++){
  const started=Date.now();const record={fixture:fixture.id,video:fixture,attempt,mode,chatModel:chatModel||null,visionModel:config.visionModel,
    toolInvocations:0,validToolInvocations:0,videoAnalyses:0,analysisSucceeded:false,discoverySucceeded:false,finalAnswer:null,trace:[],errors:[],manualIntervention:false};
  const target=path.join(fixtures,fixture.file);const question=`What is visible in the video titled "${fixture.id}"?`;
  const runVision=async(args)=>{
    record.videoAnalyses++;
    const answer=await analyzeVideo(args,config,{observe:response=>record.trace.push({kind:'vision-response',finish:response.choices?.[0]?.finish_reason,
      content:response.choices?.[0]?.message?.content,usage:response.usage})});
    record.analysisSucceeded=true;return answer;
  };
  try{
    if(mode==='vision')record.finalAnswer=await runVision({path:target,question});
    else{
      const messages=[{role:'system',content:metadata.prompts.system},{role:'user',content:metadata.prompts.userTemplate.replace('{title}',fixture.id)}];
      for(let turn=0;turn<5;turn++){
        const response=await requestLocal(config,'/v1/chat/completions',{model:chatModel,messages,tools,...chatSettings},AbortSignal.timeout(180000));
        const choice=response.choices?.[0], message=choice?.message;
        record.trace.push({kind:'chat-response',turn,finish:choice?.finish_reason,content:message?.content,tool_calls:message?.tool_calls,usage:response.usage});
        if(!message)throw new Error('No assistant message');
        if(!message.tool_calls?.length){record.finalAnswer=message.content||null;if(choice.finish_reason!=='stop')record.errors.push('incomplete-chat-output');break;}
        messages.push({role:'assistant',content:message.content||null,tool_calls:message.tool_calls,
          ...(message.reasoning_content?{reasoning_content:message.reasoning_content}:{})});
        for(const call of message.tool_calls){
          let result;
          try{
            const args=JSON.parse(call.function.arguments||'{}');
            if(call.function.name==='list_videos'){
              record.discoverySucceeded=true;result=JSON.stringify(manifest.map(item=>({title:item.id,path:path.join(fixtures,item.file)})));
            }else if(call.function.name==='analyze_video'){
              record.toolInvocations++;const checked=validateArguments(args,config);
              if(path.normalize(checked.absolute)!==path.normalize(target))throw new Error('Selected the wrong fixture');
              record.validToolInvocations++;
              result=mode==='orchestration'?fixture.expected:await runVision(args);
            }else throw new Error('Wrong tool: '+call.function.name);
          }catch(error){record.errors.push(error.message);result='Tool error: '+error.message;}
          record.trace.push({kind:'tool-result',tool:call.function.name,result});
          messages.push({role:'tool',tool_call_id:call.id,content:result});
        }
      }
      if(record.validToolInvocations===0)record.errors.push('No correct video-tool invocation');
      if(!record.finalAnswer)record.errors.push('No final answer');
    }
  }catch(error){record.errors.push(error.message);}
  record.elapsedSeconds=(Date.now()-started)/1000;
  record.structuralSuccess=mode==='vision'?record.analysisSucceeded:Boolean(record.discoverySucceeded&&record.validToolInvocations>0&&record.finalAnswer&&record.errors.length===0&&(mode==='orchestration'||record.analysisSucceeded));
  await fs.appendFile(resultsFile,JSON.stringify(record)+'\n');
  console.log(JSON.stringify({fixture:fixture.id,attempt,mode,success:record.structuralSuccess,seconds:record.elapsedSeconds,errors:record.errors}));
  completed++;consecutiveFailures=record.structuralSuccess?0:consecutiveFailures+1;
  if(flags['max-failures'] && consecutiveFailures>=Number(flags['max-failures']))break outer;
}
await fs.writeFile(path.join(directory,'run-status.json'),JSON.stringify({planned:manifest.length*repeats,completed,
  skipped:manifest.length*repeats-completed,earlyStop:completed<manifest.length*repeats,reason:completed<manifest.length*repeats?'Consecutive failure limit reached':null},null,2)+'\n');
