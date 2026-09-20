import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { loadConfig, VERSION, ConfigError } from './src/config.mjs';
import { modelStatus, run, ToolError } from './src/server.mjs';
const [command, ...args] = process.argv.slice(2);
const flags = {};
for (let i=0;i<args.length;i+=2) {
  if (!args[i]?.startsWith('--') || !args[i+1] || args[i+1].startsWith('--')) {
    console.error('Use pairs such as --config config.json.'); process.exit(1);
  }
  flags[args[i].slice(2)] = args[i+1];
}
const configFile = path.resolve(flags.config || 'video-tool.config.json');
const packageRoot = path.dirname(fileURLToPath(import.meta.url));
async function versionOf(executable) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(),'local-video-doctor-'));
  const target = path.join(directory,'version.txt');
  try {
    const value = await run(executable,['-version'],AbortSignal.timeout(10000),10000,target);
    return value.split(/\r?\n/)[0].replace(/ Copyright.*/, '').slice(0,160);
  } finally { await fs.rm(target,{force:true}); await fs.rmdir(directory); }
}
try {
  if (command === 'setup') {
    if (!flags.root || !flags.model) throw new ConfigError('Setup needs --root <video-folder> and --model <loaded-vision-model-id>.');
    const raw = { allowedRoot:path.resolve(flags.root), visionModel:flags.model, port:Number(flags.port || 1234) };
    if(flags.reasoning)raw.visionReasoningEffort=flags.reasoning;
    if (flags['ffmpeg-dir']) {
      raw.ffmpegPath=path.resolve(flags['ffmpeg-dir'],process.platform==='win32'?'ffmpeg.exe':'ffmpeg');
      raw.ffprobePath=path.resolve(flags['ffmpeg-dir'],process.platform==='win32'?'ffprobe.exe':'ffprobe');
    }
    // Exclusive creation prevents overwriting a working setup, including on reinstall.
    await fs.writeFile(configFile,JSON.stringify(raw,null,2)+'\n',{flag:'wx',mode:0o600});
    let config;
    try { config=await loadConfig(configFile); }
    catch(error) { await fs.unlink(configFile); throw error; }
    const entry={command:process.execPath,args:[path.join(packageRoot,'src','server.mjs'),configFile]};
    const entryFile=path.join(path.dirname(configFile),'lm-studio-entry.json');
    try { await fs.writeFile(entryFile,JSON.stringify({mcpServers:{'framesamplerelay':entry}},null,2)+'\n',{flag:'wx',mode:0o600}); }
    catch(error) { await fs.unlink(configFile); throw error; }
    const link='lmstudio://add_mcp?name=framesamplerelay&config='+encodeURIComponent(Buffer.from(JSON.stringify(entry)).toString('base64'));
    const html='<!doctype html><meta charset="utf-8"><title>Add FrameSampleRelay</title>'+ 
      '<style>body{font:18px system-ui;max-width:650px;margin:70px auto;padding:24px;line-height:1.6}a{display:inline-block;padding:12px 20px;background:#2457cc;color:white;border-radius:8px;text-decoration:none}</style>'+ 
      '<h1>Add FrameSampleRelay</h1><p>This local page contains your machine-specific configuration. Keep it private.</p>'+ 
      '<p><a href="'+link.replaceAll('&','&amp;')+'">Add to LM Studio</a></p>'+ 
      '<p>Review the entry in LM Studio before adding it. If the button does not open LM Studio, merge the accompanying lm-studio-entry.json entry into mcp.json manually.</p>';
    try { await fs.writeFile(path.join(path.dirname(configFile),'add-to-lm-studio.html'),html,{flag:'wx',mode:0o600}); }
    catch(error) { await fs.unlink(entryFile); await fs.unlink(configFile); throw error; }
    console.log('Setup complete. Config, JSON entry, and a private add-to-lm-studio.html page were created.');
    console.log('Open that page to add the integration, or merge the JSON entry manually. Preserve existing entries.');
    console.log('Then run: node cli.mjs doctor --config <your-config-file>');
  } else if (command === 'doctor') {
    const report={project:'FrameSampleRelay',toolVersion:VERSION,node:process.versions.node,platform:process.platform,osRelease:os.release(),
      lmStudioVersion:'not exposed by model API; check About',localOnly:true,tokenPresent:Boolean(process.env.LM_STUDIO_API_TOKEN)};
    try {
      const config=await loadConfig(configFile);
      report.configValid=true; report.frameCount=config.frameCount;
      report.ffmpeg=await versionOf(config.ffmpegPath); report.ffprobe=await versionOf(config.ffprobePath);
      const model=await modelStatus(config);
      const instance=model.loaded_instances.find(item=>item.id===config.visionModel);
      report.vision={loaded:true,capable:true,architecture:model.architecture,quantization:model.quantization?.name,
        contextLength:instance?.config?.context_length,modelIdentifier:'omitted for privacy'};
      report.ready=true;
    } catch(error) { report.ready=false; report.error=error instanceof ConfigError || error instanceof ToolError?error.message:'Diagnostic failed; no sensitive details included.'; process.exitCode=1; }
    console.log(JSON.stringify(report,null,2));
  } else {
    console.log('FrameSampleRelay '+VERSION+'\nCommands:\n  setup --root <folder> --model <vision-model-id> [--config <file>] [--ffmpeg-dir <folder>] [--port <port>] [--reasoning <none|low|medium|high>]\n  doctor [--config <file>]');
    if (command && command!=='help') process.exitCode=1;
  }
} catch(error) {
  console.error(error.code==='EEXIST'?'Setup files already exist. Nothing was overwritten; use a fresh directory for reinstall testing.':
    error instanceof ConfigError?error.message:'Operation failed. Check file permissions and arguments. No sensitive details included.');
  process.exitCode=1;
}
