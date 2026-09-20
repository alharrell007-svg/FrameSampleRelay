import fs from 'node:fs/promises';
import path from 'node:path';
export const VERSION = '0.2.0-rc.3';
export class ConfigError extends Error {}
export async function findExecutable(name, explicit) {
  const executable = process.platform === 'win32' ? name + '.exe' : name;
  const candidates = explicit ? [explicit] : (process.env.PATH || '').split(path.delimiter)
    .filter(item => item && path.isAbsolute(item)).map(item => path.join(item, executable));
  for (const candidate of candidates) {
    if (!path.isAbsolute(candidate)) continue;
    try {
      if (!(await fs.stat(candidate)).isFile()) continue;
      await fs.access(candidate, process.platform === 'win32' ? fs.constants.F_OK : fs.constants.X_OK);
      return await fs.realpath(candidate);
    } catch {}
  }
  throw new ConfigError(`${name} is missing. Install FFmpeg with ffprobe and add its bin folder to PATH, or supply explicit executable paths.`);
}
export async function loadConfig(filename) {
  if (Number(process.versions.node.split('.')[0]) < 22) throw new ConfigError('Node.js 22 or newer is required.');
  if (!filename) throw new ConfigError('Specify a configuration file. Run the setup command first.');
  let raw;
  try { raw = JSON.parse((await fs.readFile(filename, 'utf8')).replace(/^\uFEFF/, '')); }
  catch { throw new ConfigError('Cannot read the JSON configuration. Run setup or check its syntax.'); }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new ConfigError('Configuration must be an object.');
  const allowed = ['allowedRoot','visionModel','ffmpegPath','ffprobePath','port','frameCount','maxBytes','maxDurationSeconds','maxOutputTokens','timeoutMs','visionReasoningEffort'];
  if (Object.keys(raw).some(key => !allowed.includes(key))) throw new ConfigError('Unknown configuration key. Credentials belong in LM_STUDIO_API_TOKEN, not this file.');
  if (typeof raw.allowedRoot !== 'string' || !path.isAbsolute(raw.allowedRoot) ||
      (process.platform === 'win32' && !/^[a-z]:[\\/]/i.test(raw.allowedRoot)))
    throw new ConfigError('allowedRoot must be an absolute local folder.');
  const root = path.normalize(raw.allowedRoot);
  if (root === path.parse(root).root) throw new ConfigError('Choose a specific video folder, not an entire drive.');
  let real;
  try { real = await fs.realpath(root); if (!(await fs.stat(real)).isDirectory()) throw new Error(); }
  catch { throw new ConfigError('The configured video folder is missing or inaccessible.'); }
  const normal = value => process.platform === 'win32' ? value.toLowerCase() : value;
  if (normal(real) !== normal(root)) throw new ConfigError('The configured video folder must not be redirected by a link.');
  if (typeof raw.visionModel !== 'string' || !raw.visionModel.trim() || raw.visionModel.length > 300 || /[\x00-\x1f]/.test(raw.visionModel))
    throw new ConfigError('visionModel must be the exact loaded API model identifier from LM Studio.');
  const config = { allowedRoot: real, visionModel: raw.visionModel.trim(), port: 1234, frameCount: 6,
    maxBytes: 512 * 1024 * 1024, maxDurationSeconds: 600, maxOutputTokens: 700, timeoutMs: 180000, ...raw };
  config.allowedRoot = real;
  if (config.visionReasoningEffort !== undefined && !['none','low','medium','high'].includes(config.visionReasoningEffort))
    throw new ConfigError('visionReasoningEffort must be none, low, medium, or high when supplied.');
  const bounds = { port:[1024,65535], frameCount:[1,12], maxBytes:[1,1024*1024*1024],
    maxDurationSeconds:[1,1800], maxOutputTokens:[64,4096], timeoutMs:[1000,600000] };
  for (const [key,[min,max]] of Object.entries(bounds))
    if (!Number.isInteger(config[key]) || config[key] < min || config[key] > max) throw new ConfigError(`Invalid ${key}; expected integer ${min} through ${max}.`);
  config.ffmpegPath = await findExecutable('ffmpeg', raw.ffmpegPath);
  config.ffprobePath = await findExecutable('ffprobe', raw.ffprobePath);
  return Object.freeze(config);
}
