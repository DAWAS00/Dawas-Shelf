import { chromium } from 'playwright';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const destination = path.join(root, 'public', 'media');
await mkdir(destination, { recursive: true });
const display = await readFile(path.join(root, 'node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff2'));
const body = await readFile(path.join(root, 'node_modules/@fontsource/spectral/files/spectral-latin-400-normal.woff2'));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.setContent(`<style>@font-face{font-family:Display;src:url(data:font/woff2;base64,${display.toString('base64')});font-weight:600}@font-face{font-family:Body;src:url(data:font/woff2;base64,${body.toString('base64')})}body{margin:0}canvas{display:block}</style><canvas width="1280" height="720"></canvas>`);
await page.evaluate(async () => {
  await Promise.all([document.fonts.load('600 48px Display'), document.fonts.load('24px Body')]);
  const canvas = document.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const c = { paper: '#f5f1e7', mist: '#eef1ee', deep: '#e9e3d5', ink: '#23282a', light: '#5b6360', celadon: '#6d8f7d', green: '#4e6b5c' };
  const texture = document.createElement('canvas');
  texture.width = 420; texture.height = 420;
  const tx = texture.getContext('2d');
  let seed = 149;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < 27000; i++) {
    tx.fillStyle = `rgba(35,40,42,${random() * .045})`;
    tx.fillRect(random() * 420, random() * 420, .4 + random() * 1.1, .4 + random() * 1.1);
  }
  const fiber = ctx.createPattern(texture, 'repeat');
  function text(value, x, y, size, font = 'Body', color = c.ink, align = 'left') {
    ctx.font = `${font === 'Display' ? '600' : '400'} ${size}px ${font}`;
    ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(value, x, y);
  }
  function stroke(points, color, width = 2) {
    ctx.beginPath(); ctx.moveTo(...points[0]);
    for (const point of points.slice(1)) ctx.lineTo(...point);
    ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = color; ctx.stroke();
  }
  function torn(x, y, w, h, index) {
    ctx.beginPath();
    for (let i = 0; i <= 16; i++) { const px = x + w * i / 16; const py = y + Math.sin(i * 9.4 + index) * 1.2; if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
    for (let i = 1; i <= 14; i++) ctx.lineTo(x + w + Math.sin(i * 6.7 + index) * 1.2, y + h * i / 14);
    for (let i = 15; i >= 0; i--) ctx.lineTo(x + w * i / 16, y + h + Math.sin(i * 8.1 + index) * 1.6);
    for (let i = 13; i >= 0; i--) ctx.lineTo(x + Math.cos(i * 6.8 + index) * 1.1, y + h * i / 14);
    ctx.closePath();
  }
  function resource(index, x, y, angle, phase) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    const w = 266, h = 334;
    ctx.shadowColor = 'rgba(52,48,38,.15)'; ctx.shadowBlur = 29; ctx.shadowOffsetY = 16;
    torn(-w/2, -h/2, w, h, index);
    ctx.fillStyle = index === 1 ? c.paper : c.mist; ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.save(); torn(-w/2, -h/2, w, h, index); ctx.clip(); ctx.fillStyle = fiber; ctx.fillRect(-w/2,-h/2,w,h); ctx.restore();
    text(['01 / Discover','02 / Learn','03 / Create'][index], -104, -127, 15, 'Body', c.green);
    if (index === 0) {
      ctx.fillStyle = 'rgba(109,143,125,.09)'; ctx.fillRect(-105, -98, 210, 139);
      stroke([[-87,-77],[87,-77]], 'rgba(109,143,125,.3)', 1);
      [-86,-76,-66].forEach(x => { ctx.beginPath();ctx.arc(x,-88,2,0,Math.PI*2);ctx.fillStyle=c.green;ctx.fill(); });
      text('✳', 0, -33, 36, 'Body', c.green, 'center');
      text('Follow a question.', 0, 3, 23, 'Display', c.ink, 'center');
      ctx.fillStyle = c.paper; ctx.fillRect(-84, 16, 168, 12);
      ctx.fillStyle = 'rgba(109,143,125,.28)'; ctx.fillRect(-75, 21, 100 + 10*Math.sin(phase), 2);
      text('Websites', -103, 89, 42, 'Display');
      text('A useful place to begin.', -103, 124, 15, 'Body', c.light);
    } else if (index === 1) {
      ctx.fillStyle = c.green; ctx.fillRect(-105, -98, 210, 139);
      text('SKILL.md', -84, -69, 15, 'Body', c.paper);
      stroke([[-84,-48],[66,-48]], 'rgba(245,241,231,.28)', 1);
      const lines = [139,99,146,80];
      lines.forEach((length, i) => stroke([[-83,-25+i*16],[-83+length,-25+i*16]], i%2 ? c.paper : '#a9c6b4', 2));
      text('AI skills', -103, 89, 42, 'Display');
      text('A little reusable expertise.', -103, 124, 15, 'Body', c.light);
      ctx.beginPath(); ctx.moveTo(103,-167); ctx.lineTo(133,-137); ctx.lineTo(103,-137); ctx.closePath(); ctx.fillStyle=c.deep; ctx.fill();
    } else {
      text('“', -99, 17, 165, 'Display', c.green);
      text('What if…', -72, 15, 39, 'Display');
      stroke([[-103,39],[-55,37],[26,40],[84,38]], c.celadon, 2);
      text('Prompts', -103, 89, 42, 'Display');
      text('An idea, ready to grow.', -103, 124, 15, 'Body', c.light);
    }
    ctx.restore();
  }
  function render(frame, total) {
    const p = frame / total * Math.PI * 2;
    ctx.clearRect(0,0,1280,720); ctx.fillStyle = c.paper; ctx.fillRect(0,0,1280,720);
    const mist = ctx.createRadialGradient(950 + 80*Math.sin(p),190 + 15*Math.cos(p),0,850,280,700);
    mist.addColorStop(0,'rgba(109,143,125,.17)');mist.addColorStop(1,'rgba(109,143,125,0)');ctx.fillStyle=mist;ctx.fillRect(0,0,1280,720);
    const mist2=ctx.createRadialGradient(180+45*Math.cos(p),560,10,260,500,500);mist2.addColorStop(0,'rgba(109,143,125,.11)');mist2.addColorStop(1,'rgba(109,143,125,0)');ctx.fillStyle=mist2;ctx.fillRect(0,0,1280,720);
    // Mist-washed mountain silhouettes sit behind the practical resource cards.
    ctx.save(); ctx.globalAlpha=.10; ctx.fillStyle=c.celadon; ctx.beginPath(); ctx.moveTo(400,580);ctx.lineTo(745,151);ctx.lineTo(842,251);ctx.lineTo(962,175);ctx.lineTo(1240,580);ctx.closePath();ctx.fill();ctx.restore();
    ctx.strokeStyle='rgba(78,107,92,.25)';ctx.lineWidth=1.5;ctx.setLineDash([3,9]);
    ctx.beginPath();ctx.moveTo(155,378);ctx.bezierCurveTo(390,75+8*Math.cos(p),854,595+12*Math.sin(p),1145,315);ctx.stroke();ctx.setLineDash([]);
    const centers = [{x:328,y:332+13*Math.sin(p),a:-.105+.017*Math.cos(p)},{x:640,y:310+11*Math.sin(p+1.5),a:.022+.015*Math.sin(p)},{x:953,y:338+13*Math.sin(p+3),a:.095+.017*Math.cos(p+2)}];
    resource(0,centers[0].x,centers[0].y,centers[0].a,p);
    resource(2,centers[2].x,centers[2].y,centers[2].a,p);
    resource(1,centers[1].x,centers[1].y,centers[1].a,p);
    // A hand-painted shelf ties the floating papers together.
    ctx.fillStyle=c.green;ctx.globalAlpha=.75;ctx.beginPath();ctx.moveTo(128,558);ctx.lineTo(453,555);ctx.lineTo(722,558);ctx.lineTo(1150,554);ctx.lineTo(1129,563);ctx.lineTo(742,565);ctx.lineTo(455,561);ctx.lineTo(144,565);ctx.closePath();ctx.fill();ctx.globalAlpha=1;
    text('A little curiosity. A world of possibility.',640,631,30,'Display',c.green,'center');
    text('Websites   ·   Skills   ·   Prompts   ·   Workflows',640,668,16,'Body',c.light,'center');
    // One small cinnabar stamp, as specified by the design system.
    ctx.save();ctx.translate(1152,89);ctx.rotate(.06);torn(-17,-21,34,42,41);ctx.fillStyle='#a44a3f';ctx.fill();stroke([[-7,-8],[7,-8],[7,8],[-7,8],[-7,-8]],c.paper,1.5);stroke([[0,-12],[0,12],[-10,12]],c.paper,1.5);ctx.restore();
    ctx.fillStyle=fiber;ctx.fillRect(0,0,1280,720);
    return canvas.toDataURL('image/png').split(',')[1];
  }
  window.renderHero = render;
});
const videoPath = path.join(destination, 'shelf-hero.mp4');
const ffmpeg = spawn('ffmpeg', ['-y','-hide_banner','-loglevel','error','-f','image2pipe','-framerate','24','-i','pipe:0','-an','-c:v','libx264','-preset','slow','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart',videoPath]);
let stderr='';ffmpeg.stderr.on('data',chunk=>{stderr+=chunk;});
const finished = new Promise((resolve,reject)=>{ffmpeg.on('error',reject);ffmpeg.on('close',code=>code===0?resolve():reject(new Error(stderr)));});
try {
  for (let frame=0;frame<192;frame++) {
    const data=await page.evaluate(frame=>window.renderHero(frame,192),frame);
    const buffer=Buffer.from(data,'base64');
    if(frame===40) {
      const poster = await page.evaluate(() => document.querySelector('canvas').toDataURL('image/webp',.88).split(',')[1]);
      await writeFile(path.join(destination,'shelf-hero-poster.webp'),Buffer.from(poster,'base64'));
    }
    if(!ffmpeg.stdin.write(buffer)) await once(ffmpeg.stdin,'drain');
    if(frame%48===0) console.log(`Rendered ${frame}/192 frames`);
  }
  ffmpeg.stdin.end();await finished;
  console.log(`Created 8-second silent H.264 hero loop at ${videoPath}`);
} finally { await browser.close(); }
