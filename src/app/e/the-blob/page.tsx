'use client';
import { useEffect, useRef, useCallback, useState } from 'react';
import { useAmbientAudio } from './useAmbientAudio';
import { Comments } from '@/components/comments/Comments';

// ── Constants & Types ──
const MAX_ENT = 20, SPAWN_MS = 12000, BABY_P = 0.03, TRAIL_N = 50, NCNT = 14;
const SK = 0.02, SD = 0.92, CE = 0.008, STILL_MS = 3000, STILL_TH = 2;
const PARTICLE_COUNT = 60;
const REDUCED_PARTICLE_COUNT = 20;
const REDUCED_MOTION_SPEED = 0.4; // multiplier for animation speeds

interface V { x: number; y: number }
interface N { x: number; y: number; vx: number; vy: number; a: number; r: number }
type ET = 'player'|'mimic'|'shy'|'dreamer'|'gravity'|'baby';
interface E {
  id:number;t:ET;x:number;y:number;vx:number;vy:number;r:number;
  ns:N[];h:number;al:number;tr:V[];age:number;born:number;sd:number;
  mb?:V[];gt?:number;gc?:number;lt?:number;cor:number;ph?:[number,number];
  pu?:number;dissolve?:number;
}
interface Particle {
  x:number;y:number;vx:number;vy:number;size:number;alpha:number;hue:number;drift:number;
}

let _i=0;
const d2=(a:V,b:V)=>Math.hypot(a.x-b.x,a.y-b.y);
const hsl=(h:number,s:number,l:number,a=1)=>`hsla(${((h%360)+360)%360},${s}%,${l}%,${a})`;

// Soft bioluminescent palette
const PALETTE = {
  cyan: 185,
  lavender: 270,
  peach: 25,
  seafoam: 155,
  rose: 330,
  gold: 45,
};
const PALETTE_HUES = Object.values(PALETTE);
const randomPaletteHue = () => PALETTE_HUES[Math.floor(Math.random() * PALETTE_HUES.length)];

function mkN(cx:number,cy:number,r:number,n:number):N[]{
  return Array.from({length:n},(_,i)=>{const a=Math.PI*2*i/n;return{x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r,vx:0,vy:0,a,r};});
}
function mkE(t:ET,x:number,y:number,r:number,h:number,now:number):E{
  const nc=t==='baby'?8:t==='gravity'?18:NCNT;
  return{id:_i++,t,x,y,vx:0,vy:0,r,h,ns:mkN(x,y,r,nc),al:t==='shy'?0.25:1,tr:[],age:0,born:now,sd:Math.random(),
    mb:t==='mimic'?[]:undefined,gt:t==='dreamer'?0:undefined,gc:t==='dreamer'?4e3+Math.random()*5e3:undefined,
    lt:now,cor:0,pu:Math.random()*Math.PI*2,dissolve:t==='dreamer'?1:undefined};
}
function mkParticle(w:number,h:number):Particle{
  return{
    x:Math.random()*w,y:Math.random()*h,
    vx:(Math.random()-.5)*.15,vy:-Math.random()*.2-.05,
    size:Math.random()*2.5+0.5,alpha:Math.random()*.3+.05,
    hue:randomPaletteHue(),drift:Math.random()*Math.PI*2,
  };
}

export default function TheBlobPage(){
  const cv=useRef<HTMLCanvasElement>(null);
  const es=useRef<E[]>([]);
  const ms=useRef<V>({x:0,y:0});
  const mi=useRef(false);
  const ls=useRef(0);
  const ss=useRef(0);
  const lm=useRef<V>({x:0,y:0});
  const pt=useRef(0);
  const dm=useRef({w:0,h:0});
  const particles=useRef<Particle[]>([]);
  const reducedMotion=useRef(false);
  const dpr=useRef(1);
  const [reducedMotionState, setReducedMotionState] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const { isPlaying: audioPlaying, toggle: toggleAudio, startOnInteraction } = useAmbientAudio(reducedMotionState);
  const audioStartedOnce = useRef(false);

  const spawnF=useCallback((w:number,h:number,now:number)=>{
    const a=es.current;
    if(a.length>=MAX_ENT){const o=a.reduce<E|null>((o,e)=>e.t==='player'?o:(!o||e.born<o.born?e:o),null);if(o){const i=a.indexOf(o);if(i>-1)a.splice(i,1);}}
    const ts:ET[]=['mimic','shy','dreamer','gravity'];
    const t=ts[Math.floor(Math.random()*ts.length)];
    const ed=Math.floor(Math.random()*4);
    let x:number,y:number;
    if(ed===0){x=Math.random()*w;y=-40;}else if(ed===1){x=w+40;y=Math.random()*h;}
    else if(ed===2){x=Math.random()*w;y=h+40;}else{x=-40;y=Math.random()*h;}
    const rm:Record<ET,number>={player:35,mimic:30,shy:24,dreamer:22,gravity:45,baby:12};
    const hm:Record<ET,number>={player:PALETTE.cyan,mimic:PALETTE.cyan,shy:PALETTE.lavender,dreamer:PALETTE.peach,gravity:PALETTE.seafoam,baby:PALETTE.rose};
    a.push(mkE(t,x,y,rm[t],hm[t],now));
  },[]);

  const spawnB=useCallback((a:E,b:E,now:number)=>{
    if(es.current.length>=MAX_ENT)return;
    const bb=mkE('baby',(a.x+b.x)/2,(a.y+b.y)/2,10+Math.random()*5,(a.h+b.h)/2,now);
    bb.ph=[a.h,b.h];bb.vx=(Math.random()-.5)*1;bb.vy=(Math.random()-.5)*1;
    es.current.push(bb);
  },[]);

  useEffect(()=>{
    const c=cv.current;if(!c)return;const ctx=c.getContext('2d')!;

    // Detect prefers-reduced-motion
    const motionMQ=window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion.current=motionMQ.matches;
    setReducedMotionState(motionMQ.matches);
    const onMotionChange=(e:MediaQueryListEvent)=>{
      reducedMotion.current=e.matches;
      setReducedMotionState(e.matches);
      // Adjust particle count on change
      const targetCount=e.matches?REDUCED_PARTICLE_COUNT:PARTICLE_COUNT;
      if(particles.current.length>targetCount)particles.current.length=targetCount;
      else while(particles.current.length<targetCount)particles.current.push(mkParticle(w,h));
    };
    motionMQ.addEventListener('change',onMotionChange);

    // DPR-aware canvas sizing
    dpr.current=Math.min(window.devicePixelRatio||1,3); // cap at 3x for perf
    let w=innerWidth,h=innerHeight;
    c.width=w*dpr.current;c.height=h*dpr.current;
    ctx.scale(dpr.current,dpr.current);
    dm.current={w,h};
    es.current=[mkE('player',w/2,h/2,35,PALETTE.cyan,performance.now())];
    ms.current={x:w/2,y:h/2};lm.current={x:w/2,y:h/2};
    ls.current=performance.now();pt.current=performance.now();
    // Init ambient particles (reduced count if needed)
    const initParticleCount=reducedMotion.current?REDUCED_PARTICLE_COUNT:PARTICLE_COUNT;
    particles.current=Array.from({length:initParticleCount},()=>mkParticle(w,h));

    const onR=()=>{
      w=innerWidth;h=innerHeight;
      dpr.current=Math.min(window.devicePixelRatio||1,3);
      c.width=w*dpr.current;c.height=h*dpr.current;
      ctx.setTransform(dpr.current,0,0,dpr.current,0,0);
    };
    const onM=(e:MouseEvent)=>{ms.current={x:e.clientX,y:e.clientY};mi.current=true;};
    const onT=(e:TouchEvent)=>{if(e.touches[0]){ms.current={x:e.touches[0].clientX,y:e.touches[0].clientY};mi.current=true;}};
    const onC=(ev:Event)=>{
      ev.preventDefault();
      // Start ambient audio on first interaction
      if(!audioStartedOnce.current){audioStartedOnce.current=true;startOnInteraction();}
      const a=es.current,p=a.find(e=>e.t==='player');
      if(p&&p.r>18){const nr=p.r*.7;p.r=nr;p.ns=mkN(p.x,p.y,nr,NCNT);
        const ag=Math.random()*Math.PI*2;
        const s=mkE('player',p.x+Math.cos(ag)*40,p.y+Math.sin(ag)*40,nr,p.h+30,performance.now());
        s.vx=Math.cos(ag)*1.5;s.vy=Math.sin(ag)*1.5;a.push(s);}
    };

    addEventListener('resize',onR);addEventListener('mousemove',onM);
    addEventListener('touchmove',onT,{passive:true});
    c.addEventListener('click',onC);
    const onTS=(e:TouchEvent)=>{onT(e);onC(e);};
    c.addEventListener('touchstart',onTS,{passive:false});

    let raf=0;
    function tick(now:number){
      raf=requestAnimationFrame(tick);
      const rawDt=Math.min((now-pt.current)/1000,0.05);
      const rm=reducedMotion.current;
      const dt=rm?rawDt*REDUCED_MOTION_SPEED:rawDt;
      pt.current=now;
      const a=es.current,m=ms.current,md=d2(m,lm.current);

      if(now-ls.current>SPAWN_MS){spawnF(w,h,now);ls.current=now;}

      // Update ambient particles
      for(const p of particles.current){
        p.x+=p.vx+Math.sin(now*.0005+p.drift)*.1;
        p.y+=p.vy;
        p.alpha=(.15+Math.sin(now*.001+p.drift)*.1)*(.3+p.size/3);
        if(p.y<-10){p.y=h+10;p.x=Math.random()*w;}
        if(p.x<-10)p.x=w+10;if(p.x>w+10)p.x=-10;
      }

      // Update entities
      for(const e of a){
        switch(e.t){
          case'player':{
            if(mi.current){e.vx+=(m.x-e.x)*CE;e.vy+=(m.y-e.y)*CE;}
            e.vx*=.96;e.vy*=.96;
            // Gentle hue drift
            e.h=PALETTE.cyan+Math.sin(now*.0003+e.sd*10)*15;break;}
          case'mimic':{
            // Dance partner — follows with graceful delay
            if(!e.mb)e.mb=[];e.mb.push({x:m.x,y:m.y});const dl=180;
            if(e.mb.length>dl){const t=e.mb[e.mb.length-dl];e.vx+=(t.x-e.x)*.008;e.vy+=(t.y-e.y)*.008;}
            if(e.mb.length>dl+60)e.mb=e.mb.slice(-(dl+60));
            e.vx*=.97;e.vy*=.97;
            const pp=a.find(x=>x.t==='player');
            if(pp)e.h=pp.h+20+Math.sin(now*.0005)*10;
            e.al=.5+Math.sin(now*.001)*.15;break;}
          case'shy':{
            // Ethereal — gently drifts away but is beautiful
            const dx=e.x-m.x,dy=e.y-m.y,dd=Math.hypot(dx,dy)||1;
            if(dd<250){e.vx+=(dx/dd)*.04;e.vy+=(dy/dd)*.04;}
            // Gentle attraction to other entities (not player)
            for(const f of a){if(f.t==='player'||f.t==='shy'||f.id===e.id)continue;
              const fx=f.x-e.x,fy=f.y-e.y,fd=Math.hypot(fx,fy)||1;
              if(fd<300&&fd>80){e.vx+=(fx/fd)*.01;e.vy+=(fy/fd)*.01;}}
            if(md<STILL_TH){if(!ss.current)ss.current=now;
              if(now-ss.current>STILL_MS){const sx=m.x-e.x,sy=m.y-e.y,sd2=Math.hypot(sx,sy)||1;
                e.vx+=(sx/sd2)*.04;e.vy+=(sy/sd2)*.04;e.al=Math.min(e.al+.003,.6);}
            }else{ss.current=0;e.al=Math.max(e.al-.005,.2);}
            e.vx*=.96;e.vy*=.96;
            e.h=PALETTE.lavender+Math.sin(now*.0004+e.sd*5)*12;break;}
          case'dreamer':{
            // Gentle drifting with soft dissolve phases
            e.vx+=(Math.random()-.5)*.08;e.vy+=(Math.random()-.5)*.08;e.vx*=.97;e.vy*=.97;
            if(e.gc!=null){e.gt=(e.gt||0)+dt*1e3;
              if(e.gt>e.gc){
                // Soft dissolve out and reappear
                e.dissolve=0;
                e.gt=0;e.gc=5e3+Math.random()*6e3;e.lt=now;
                // Gently drift to new position instead of teleporting
                const nx=Math.random()*w,ny=Math.random()*h;
                e.vx=(nx-e.x)*.005;e.vy=(ny-e.y)*.005;
              }}
            // Dissolve animation
            if(e.dissolve!=null&&e.dissolve<1){e.dissolve=Math.min(1,e.dissolve+dt*.4);}
            e.al=(e.dissolve??1)*.7;
            e.h=PALETTE.peach+Math.sin(now*.0003+e.sd*8)*15;break;}
          case'gravity':{
            // Gentle warm current
            e.vx*=.98;e.vy*=.98;e.vx+=(Math.random()-.5)*.02;e.vy+=(Math.random()-.5)*.02;
            e.pu=(e.pu||0)+dt*.8;e.h=PALETTE.seafoam+Math.sin(e.pu)*10;
            for(const o of a){if(o.id===e.id)continue;const gx=e.x-o.x,gy=e.y-o.y,gd=Math.hypot(gx,gy)||1;
              if(gd<350){const f=.008*(1-gd/350);o.vx+=(gx/gd)*f;o.vy+=(gy/gd)*f;}}
            break;}
          case'baby':{
            // Gentle blooming drift
            e.vx+=(Math.random()-.5)*.08;e.vy+=(Math.random()-.5)*.08;e.vx*=.97;e.vy*=.97;
            if(e.ph)e.h=(e.ph[0]+e.ph[1])/2+Math.sin(now*.001)*((e.ph[1]-e.ph[0])/2);
            // Slowly grow
            if(e.r<15)e.r+=dt*.3;
            break;}
        }
        e.x+=e.vx;e.y+=e.vy;
        const mg=60;
        if(e.x<-mg)e.x=w+mg;if(e.x>w+mg)e.x=-mg;
        if(e.y<-mg)e.y=h+mg;if(e.y>h+mg)e.y=-mg;
        for(const n of e.ns){
          const tx=e.x+Math.cos(n.a)*n.r,ty=e.y+Math.sin(n.a)*n.r;
          n.vx+=(tx-n.x)*SK;n.vy+=(ty-n.y)*SK;n.vx-=e.vx*.02;n.vy-=e.vy*.02;
          n.vx*=SD;n.vy*=SD;n.x+=n.vx;n.y+=n.vy;}
        e.tr.push({x:e.x,y:e.y});if(e.tr.length>TRAIL_N)e.tr.shift();e.age+=dt;
      }

      // Gentle interactions (no violence)
      for(let i=0;i<a.length;i++){for(let j=i+1;j<a.length;j++){
        const A=a[i],B=a[j],dd=d2(A,B),cr=A.r+B.r;if(dd>=cr*1.2)continue;

        // Player merging (gentle absorption)
        if(A.t==='player'&&B.t==='player'){
          const bg=A.r>=B.r?A:B,sm=A.r<B.r?A:B;bg.r=Math.min(55,Math.sqrt(bg.r**2+sm.r**2));
          bg.ns=mkN(bg.x,bg.y,bg.r,NCNT);const si=a.indexOf(sm);if(si>-1)a.splice(si,1);j--;continue;}

        // Gentle color exchange when close
        if(dd<cr){
          const blend=.002;
          const hA=A.h,hB=B.h;
          A.h+=(hB-hA)*blend;B.h+=(hA-hB)*blend;
        }

        // Mimic — gentle orbit interaction
        if((A.t==='mimic'||B.t==='mimic')&&(A.t==='player'||B.t==='player')){
          const mi2=A.t==='mimic'?A:B,pl=A.t==='player'?A:B;
          // Orbit gently instead of collision
          const ag=Math.atan2(mi2.y-pl.y,mi2.x-pl.x);
          mi2.vx+=Math.cos(ag+Math.PI/2)*.1;mi2.vy+=Math.sin(ag+Math.PI/2)*.1;}

        // Shy — gently fades and drifts away
        if(A.t==='shy'||B.t==='shy'){const sh=A.t==='shy'?A:B,ot=A.t==='shy'?B:A;
          const ag=Math.atan2(sh.y-ot.y,sh.x-ot.x);
          sh.vx+=Math.cos(ag)*.15;sh.vy+=Math.sin(ag)*.15;sh.al=Math.max(.1,sh.al-.02);}

        // Gravity well — gentle redirect
        if(A.t==='gravity'||B.t==='gravity'){const g=A.t==='gravity'?A:B,o=A.t==='gravity'?B:A;
          if(o.t!=='gravity'){const ag=Math.atan2(o.y-g.y,o.x-g.x);
            o.vx+=Math.cos(ag)*.4;o.vy+=Math.sin(ag)*.4;}}

        // Gentle baby budding
        if(A.t!=='baby'&&B.t!=='baby'&&dd<cr*.8&&Math.random()<BABY_P*.02)spawnB(A,B,now);

        // Soft separation
        if(dd>0&&dd<cr*.8){const ol=cr*.8-dd,nx=(B.x-A.x)/dd,ny=(B.y-A.y)/dd;
          A.vx-=nx*ol*.015;A.vy-=ny*ol*.015;B.vx+=nx*ol*.015;B.vy+=ny*ol*.015;}
      }}
      lm.current={x:m.x,y:m.y};

      // ── RENDER ──
      // Deep ocean background with subtle gradient
      const bgGrad=ctx.createLinearGradient(0,0,0,h);
      bgGrad.addColorStop(0,'#060a12');bgGrad.addColorStop(.5,'#080c14');bgGrad.addColorStop(1,'#0a0e16');
      ctx.fillStyle=bgGrad;ctx.fillRect(0,0,w,h);

      // Ambient particles (deep-sea snow / fireflies)
      for(const p of particles.current){
        const pg=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.size*2);
        pg.addColorStop(0,hsl(p.hue,40,70,p.alpha));
        pg.addColorStop(1,hsl(p.hue,40,70,0));
        ctx.beginPath();ctx.fillStyle=pg;ctx.arc(p.x,p.y,p.size*2,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.fillStyle=hsl(p.hue,30,80,p.alpha*.8);ctx.arc(p.x,p.y,p.size*.5,0,Math.PI*2);ctx.fill();
      }

      const ord:Record<ET,number>={gravity:0,baby:1,shy:2,mimic:3,dreamer:4,player:5};
      const sorted=[...a].sort((a,b)=>(ord[a.t]||0)-(ord[b.t]||0));

      // ── Additive blending for bioluminescent glow ──
      ctx.globalCompositeOperation='lighter';

      for(const e of sorted){
        // Reduce effective alpha for additive mode to prevent blowout
        const glowAl=e.al*.65;

        // Trail — soft glowing trails that fade slowly
        for(let i=1;i<e.tr.length;i++){const t=i/e.tr.length;
          const trAlpha=t*.15*glowAl;
          const trGrad=ctx.createRadialGradient(e.tr[i].x,e.tr[i].y,0,e.tr[i].x,e.tr[i].y,e.r*t*.4);
          trGrad.addColorStop(0,hsl(e.h,50,55,trAlpha));trGrad.addColorStop(1,hsl(e.h,50,55,0));
          ctx.beginPath();ctx.fillStyle=trGrad;
          ctx.arc(e.tr[i].x,e.tr[i].y,e.r*t*.4,0,Math.PI*2);ctx.fill();}

        // Bloom ring — large, soft outer glow for bioluminescent bloom
        const bloom=ctx.createRadialGradient(e.x,e.y,e.r*.3,e.x,e.y,e.r*4);
        bloom.addColorStop(0,hsl(e.h,55,50,glowAl*.1));bloom.addColorStop(.4,hsl(e.h,50,45,glowAl*.05));bloom.addColorStop(1,hsl(e.h,50,40,0));
        ctx.beginPath();ctx.fillStyle=bloom;ctx.arc(e.x,e.y,e.r*4,0,Math.PI*2);ctx.fill();

        // Outer glow — soft bioluminescent aura
        const gr=ctx.createRadialGradient(e.x,e.y,e.r*.5,e.x,e.y,e.r*2.5);
        gr.addColorStop(0,hsl(e.h,60,55,glowAl*.15));gr.addColorStop(.5,hsl(e.h,50,50,glowAl*.07));gr.addColorStop(1,hsl(e.h,50,45,0));
        ctx.beginPath();ctx.fillStyle=gr;ctx.arc(e.x,e.y,e.r*2.5,0,Math.PI*2);ctx.fill();

        ctx.save();

        // Body
        if(e.ns.length>2){ctx.beginPath();const ns=e.ns;
          ctx.moveTo((ns[ns.length-1].x+ns[0].x)/2,(ns[ns.length-1].y+ns[0].y)/2);
          for(let i=0;i<ns.length;i++){const c=ns[i],nx=ns[(i+1)%ns.length];ctx.quadraticCurveTo(c.x,c.y,(c.x+nx.x)/2,(c.y+nx.y)/2);}
          ctx.closePath();
          const bg=ctx.createRadialGradient(e.x-e.r*.3,e.y-e.r*.3,0,e.x,e.y,e.r*1.2);
          bg.addColorStop(0,hsl(e.h,45,60,glowAl*.8));bg.addColorStop(.5,hsl(e.h,50,48,glowAl*.7));bg.addColorStop(1,hsl(e.h,40,35,glowAl*.5));
          ctx.fillStyle=bg;ctx.fill();
          // Soft inner highlight
          ctx.beginPath();const hx=e.x-e.r*.2,hy=e.y-e.r*.25;
          const sg=ctx.createRadialGradient(hx,hy,0,hx,hy,e.r*.45);
          sg.addColorStop(0,`rgba(255,255,255,${.14*glowAl})`);sg.addColorStop(1,'rgba(255,255,255,0)');
          ctx.fillStyle=sg;ctx.arc(hx,hy,e.r*.45,0,Math.PI*2);ctx.fill();}

        // Type decorations
        if(e.t==='dreamer'){
          // Soft dissolve glow rings
          const dAlpha=(e.dissolve??1);
          if(dAlpha<.8){
            for(let ring=0;ring<2;ring++){
              const rr=e.r*(1.5+ring*.6)*(1-dAlpha);
              ctx.beginPath();ctx.strokeStyle=hsl(e.h,40,55,.12*(1-dAlpha));ctx.lineWidth=2;
              ctx.arc(e.x,e.y,rr,0,Math.PI*2);ctx.stroke();}
          }
          // Gentle floating sparkles
          for(let k=0;k<3;k++){
            const sa=now*.0008+k*2.1+e.sd*10;
            const sx=e.x+Math.cos(sa)*e.r*1.3;
            const sy=e.y+Math.sin(sa)*e.r*1.3;
            const sp=ctx.createRadialGradient(sx,sy,0,sx,sy,3);
            sp.addColorStop(0,hsl(e.h,40,70,.2*glowAl));sp.addColorStop(1,hsl(e.h,40,70,0));
            ctx.beginPath();ctx.fillStyle=sp;ctx.arc(sx,sy,3,0,Math.PI*2);ctx.fill();}}

        if(e.t==='gravity'){
          const p=e.pu||0;
          for(let ring=0;ring<3;ring++){
            const rr=e.r*(1.3+ring*.35+Math.sin(p+ring)*.08);
            ctx.beginPath();ctx.strokeStyle=hsl(e.h,35,50,.08-ring*.02);ctx.lineWidth=1.5;
            ctx.arc(e.x,e.y,rr,0,Math.PI*2);ctx.stroke();}}

        if(e.t==='shy'){
          // Ethereal sparkle halo
          for(let k=0;k<4;k++){
            const sa=now*.0006+k*1.57+e.sd*5;
            const sd2=e.r*1.5+Math.sin(now*.001+k)*5;
            const sx=e.x+Math.cos(sa)*sd2;
            const sy=e.y+Math.sin(sa)*sd2;
            const sp=ctx.createRadialGradient(sx,sy,0,sx,sy,2);
            sp.addColorStop(0,hsl(e.h,35,70,.15*glowAl));sp.addColorStop(1,hsl(e.h,35,70,0));
            ctx.beginPath();ctx.fillStyle=sp;ctx.arc(sx,sy,2,0,Math.PI*2);ctx.fill();}}

        if(e.t==='baby'){
          // Blooming pulse
          const pulse=Math.sin(now*.003+e.sd*10)*.3+.7;
          const br=e.r*1.5*pulse;
          const bp=ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,br);
          bp.addColorStop(0,hsl(e.h,40,60,.06));bp.addColorStop(1,hsl(e.h,40,60,0));
          ctx.beginPath();ctx.fillStyle=bp;ctx.arc(e.x,e.y,br,0,Math.PI*2);ctx.fill();}

        ctx.restore();
      }

      // ── Reset to normal blending for HUD ──
      ctx.globalCompositeOperation='source-over';

      // HUD — subtle
      ctx.font='11px monospace';ctx.fillStyle='rgba(255,255,255,0.12)';
      ctx.fillText(`entities: ${a.length}`,12,h-32);
      ctx.fillText('click/tap to split',w-130,h-32);
    }
    raf=requestAnimationFrame(tick);
    return()=>{cancelAnimationFrame(raf);removeEventListener('resize',onR);removeEventListener('mousemove',onM);removeEventListener('touchmove',onT);
      c.removeEventListener('click',onC);c.removeEventListener('touchstart',onTS);
      motionMQ.removeEventListener('change',onMotionChange);};
  },[spawnF,spawnB,startOnInteraction]);

  return(
    <div style={{position:'fixed',inset:0,background:'#060a12',overflow:'hidden',userSelect:'none',WebkitUserSelect:'none',zIndex:1}}>
      <style>{`
        .blob-touch{display:none}
        @media(hover:none)and(pointer:coarse){.blob-mouse{display:none}.blob-touch{display:inline}}
      `}</style>
      <canvas ref={cv} style={{display:'block',width:'100%',height:'100%',cursor:'none',touchAction:'manipulation'}}/>
      <div style={{position:'absolute',top:72,left:16,fontFamily:'monospace',fontSize:11,color:'rgba(255,255,255,0.18)',pointerEvents:'none',lineHeight:1.6}}>
        <div style={{color:'rgba(120,200,220,0.4)',fontSize:14,letterSpacing:3,marginBottom:4}}>THE BLOB</div>
        <div className="blob-instructions"><span className="blob-mouse">move cursor · click to split</span><span className="blob-touch">drag to move · tap to split</span></div>
        <div style={{marginTop:8,fontSize:10,color:'rgba(255,255,255,0.12)'}}>
          <span style={{color:'hsl(185,50%,65%)',opacity:.5}}>■</span> mimic&ensp;
          <span style={{color:'hsl(270,40%,70%)',opacity:.3}}>■</span> shy&ensp;
          <span style={{color:'hsl(25,50%,65%)',opacity:.5}}>■</span> dreamer&ensp;
          <span style={{color:'hsl(155,40%,55%)',opacity:.4}}>■</span> gravity
        </div>
      </div>
      {/* Bottom controls row */}
      <div style={{position:'absolute',bottom:16,right:16,display:'flex',gap:8,zIndex:10}}>
        <button
          onClick={(e)=>{e.stopPropagation();setCommentsOpen(!commentsOpen);}}
          aria-label={commentsOpen?'Close comments':'Open comments'}
          style={{
            background:'rgba(255,255,255,0.06)',
            border:'1px solid rgba(255,255,255,0.08)',
            padding:'6px 10px',
            color:'rgba(255,255,255,0.25)',
            fontSize:16,cursor:'pointer',
            backdropFilter:'blur(4px)',WebkitBackdropFilter:'blur(4px)',
            transition:'color 0.4s, background 0.4s',
            lineHeight:1,
          }}
          onMouseEnter={(e)=>{e.currentTarget.style.color='rgba(255,255,255,0.5)';e.currentTarget.style.background='rgba(255,255,255,0.1)';}}
          onMouseLeave={(e)=>{e.currentTarget.style.color='rgba(255,255,255,0.25)';e.currentTarget.style.background='rgba(255,255,255,0.06)';}}
        >💬</button>
        <button
          onClick={(e)=>{e.stopPropagation();toggleAudio();}}
          aria-label={audioPlaying?'Mute ambient audio':'Unmute ambient audio'}
          style={{
            background:'rgba(255,255,255,0.06)',
            border:'1px solid rgba(255,255,255,0.08)',
            padding:'6px 10px',
            color:'rgba(255,255,255,0.25)',
            fontSize:16,cursor:'pointer',
            backdropFilter:'blur(4px)',WebkitBackdropFilter:'blur(4px)',
            transition:'color 0.4s, background 0.4s',
            lineHeight:1,
          }}
          onMouseEnter={(e)=>{e.currentTarget.style.color='rgba(255,255,255,0.5)';e.currentTarget.style.background='rgba(255,255,255,0.1)';}}
          onMouseLeave={(e)=>{e.currentTarget.style.color='rgba(255,255,255,0.25)';e.currentTarget.style.background='rgba(255,255,255,0.06)';}}
        >{audioPlaying?'🔊':'🔇'}</button>
      </div>

      {/* Comments slide-out panel */}
      <div
        style={{
          position:'absolute',
          top:0,bottom:0,right:0,
          width:'min(380px, 90vw)',
          zIndex:20,
          transform:commentsOpen?'translateX(0)':'translateX(100%)',
          transition:'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          background:'rgba(8, 8, 10, 0.8)',
          backdropFilter:'blur(24px) saturate(1.3)',
          WebkitBackdropFilter:'blur(24px) saturate(1.3)',
          borderLeft:'1px solid rgba(255,255,255,0.06)',
          display:'flex',flexDirection:'column',
        }}
        onClick={(e)=>e.stopPropagation()}
      >
        <div style={{
          display:'flex',alignItems:'center',justifyContent:'space-between',
          padding:'16px 20px',borderBottom:'1px solid rgba(255,255,255,0.06)',
        }}>
          <span style={{
            fontFamily:'var(--font-display)',fontSize:16,color:'rgba(255,255,255,0.8)',
          }}>Comments</span>
          <button
            onClick={()=>setCommentsOpen(false)}
            style={{
              background:'none',border:'none',color:'rgba(255,255,255,0.4)',
              fontSize:18,cursor:'pointer',padding:'4px 8px',lineHeight:1,
            }}
            onMouseEnter={(e)=>{e.currentTarget.style.color='rgba(255,255,255,0.8)';}}
            onMouseLeave={(e)=>{e.currentTarget.style.color='rgba(255,255,255,0.4)';}}
            aria-label="Close comments"
          >×</button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'0 20px 20px'}}>
          <Comments slug="the-blob" />
        </div>
      </div>

      {/* Click-away overlay when comments open */}
      {commentsOpen && (
        <div
          onClick={(e)=>{e.stopPropagation();setCommentsOpen(false);}}
          style={{
            position:'absolute',inset:0,zIndex:15,
            background:'rgba(0,0,0,0.3)',
            cursor:'default',
          }}
        />
      )}
    </div>
  );
}
