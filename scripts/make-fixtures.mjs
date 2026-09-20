// Generates original synthetic scenes; contains no downloaded or personal media.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { findExecutable } from '../src/config.mjs';
import { run } from '../src/server.mjs';
const output=path.resolve(process.argv[2] || 'fixtures');
const ffmpeg=await findExecutable('ffmpeg',process.argv[3]);
await fs.mkdir(output,{recursive:true});
const width=320,height=240,fps=12,seconds=6;
const scenes=[
  {id:'simple motion',expected:'A red square changes position from the left side to the right side on a light gray background. No audio or people.'},
  {id:'multiple scenes',expected:'Three scenes in order: a red square; a blue circle; a yellow triangle, each centered on a light gray background.'},
  {id:'occlusion count',expected:'Three blue circles remain along the top. A yellow square changes position left to right behind a stationary dark vertical rectangle; it is partly or fully hidden in the middle. There are no people or sounds.'}
];
const manifest=[];
for(let scene=0;scene<scenes.length;scene++) {
  const raw=path.join(output,scenes[scene].id+'.rgb');
  const target=path.join(output,scenes[scene].id+'.mp4');
  const handle=await fs.open(raw,'wx');
  try {
    for(let frame=0;frame<fps*seconds;frame++) {
      const buffer=Buffer.alloc(width*height*3,230);
      const pixel=(x,y,c)=>{if(x>=0&&x<width&&y>=0&&y<height){const offset=(y*width+x)*3;buffer[offset]=c[0];buffer[offset+1]=c[1];buffer[offset+2]=c[2];}};
      const rectangle=(left,top,w,h,c)=>{for(let y=top;y<top+h;y++)for(let x=left;x<left+w;x++)pixel(x,y,c);};
      const circle=(cx,cy,r,c)=>{for(let y=cy-r;y<=cy+r;y++)for(let x=cx-r;x<=cx+r;x++)if((x-cx)**2+(y-cy)**2<=r*r)pixel(x,y,c);};
      const progress=frame/(fps*seconds-1);
      if(scene===0)rectangle(Math.round(20+230*progress),95,50,50,[235,25,25]);
      if(scene===1){const section=Math.floor(frame/(fps*2));
        if(section===0)rectangle(120,80,80,80,[235,25,25]);
        if(section===1)circle(160,120,45,[25,70,235]);
        if(section===2)for(let y=65;y<170;y++){const radius=Math.floor((y-65)*0.55);rectangle(160-radius,y,radius*2+1,1,[245,210,20]);}
      }
      if(scene===2){for(const x of [65,160,255])circle(x,40,18,[25,70,235]);rectangle(Math.round(15+235*progress),115,55,55,[245,210,20]);rectangle(130,75,60,135,[30,30,30]);}
      await handle.write(buffer);
    }
  } finally {await handle.close();}
  try { await run(ffmpeg,['-hide_banner','-loglevel','error','-nostdin','-f','rawvideo','-pixel_format','rgb24',
    '-video_size',`${width}x${height}`,'-framerate',String(fps),'-i',raw,'-an','-c:v','libx264','-pix_fmt','yuv420p','-n',target],AbortSignal.timeout(60000),60000); }
  finally {await fs.unlink(raw);}
  manifest.push({...scenes[scene],file:path.basename(target),seconds,width,height,fps,container:'mp4',codec:'h264',audio:false,
    sha256:createHash('sha256').update(await fs.readFile(target)).digest('hex')});
}
await fs.writeFile(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log('Created three six-second synthetic MP4 fixtures and their ground-truth manifest.');
