'use client';
import { useEffect, useRef, useCallback } from 'react';

// ── Constants & Types ──
const MAX_ENT = 20, SPAWN_MS = 10000, BABY_P = 0.05, TRAIL_N = 35, NCNT = 14;
const SK = 0.08, SD = 0.85, CE = 0.06, STILL_MS = 3000, STILL_TH = 2;

interface V { x: number; y: number }
interface N { x: number; y: number; vx: number; vy: number; a: number; r: number }
type ET = 'player'|'predator'|'mimic'|'shy'|'glitch'|'gravity'|'baby';
interface E {
  id:number;t:ET;x:number;y:number;vx:number;vy:number;r:number;
  ns:N[];h:number;al:number;tr:V[];age:number;born:number;sd:number;
  mb?:V[];gt?:number;gc?:number;lt?:number;cor:number;ph?:[number,number];
  pu?:number;
}

let _i=0;
const d2=(a:V,b:V)=>Math.hypot(a.x-b.x,a.y-b.y);
const hsl=(h:number,s:number,l:number,a=1)=>`hsla(${((h%360)+360)%360},${s}%,${l}%,${a})`;
function mkN(cx:number,cy:number,r:number,n:number):N[]{
  return Array.from({length:n},(_,i)=>{const a=Math.PI*2*i/n;return{x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r,vx:0,vy:0,a,r};});
}
function mkE(t:ET,x:number,y:number,r:number,h:number,now:number):E{
  const nc=t==='baby'?8:t==='gravity'?18:NCNT;
  return{id:_i++,t,x,y,vx:0,vy:0,r,h,ns:mkN(x,y,r,nc),al:t==='shy'?0.15:1,tr:[],age:0,born:now,sd:Math.random(),
    mb:t==='mimic'?[]:undefined,gt:t==='glitch'?0:undefined,gc:t==='glitch'?2e3+Math.random()*3e3:undefined,
    lt:now,cor:0,pu:Math.random()*Math.PI*2};
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

  const spawnF=useCallback((w:number,h:number,now:number)=>{
    const a=es.current;
    if(a.length>=MAX_ENT){const o=a.reduce<E|null>((o,e)=>e.t==='player'?o:(!o||e.born<o.born?e:o),null);if(o){const i=a.indexOf(o);if(i>-1)a.splice(i,1);}}
    const ts:ET[]=['predator','mimic','shy','glitch','gravity'];
    const t=ts[Math.floor(Math.random()*ts.length)];
    const ed=Math.floor(Math.random()*4);
    let x:number,y:number;
    if(ed===0){x=Math.random()*w;y=-40;}else if(ed===1){x=w+40;y=Math.random()*h;}
    else if(ed===2){x=Math.random()*w;y=h+40;}else{x=-40;y=Math.random()*h;}
    const rm:Record<ET,number>={player:35,predator:28,mimic:30,shy:22,glitch:20,gravity:50,baby:12};
    const hm:Record<ET,number>={player:180,predator:15,mimic:180,shy:200,glitch:0,gravity:270,baby:120};
    a.push(mkE(t,x,y,rm[t],hm[t],now));
  },[]);

  const spawnB=useCallback((a:E,b:E,now:number)=>{
    if(es.current.length>=MAX_ENT)return;
    const bb=mkE('baby',(a.x+b.x)/2,(a.y+b.y)/2,10+Math.random()*5,(a.h+b.h)/2,now);
    bb.ph=[a.h,b.h];bb.vx=(Math.random()-.5)*3;bb.vy=(Math.random()-.5)*3;
    es.current.push(bb);
  },[]);

  useEffect(()=>{
    const c=cv.current;if(!c)return;const ctx=c.getContext('2d')!;
    let w=innerWidth,h=innerHeight;c.width=w;c.height=h;dm.current={w,h};
    es.current=[mkE('player',w/2,h/2,35,180,performance.now())];
    ms.current={x:w/2,y:h/2};lm.current={x:w/2,y:h/2};
    ls.current=performance.now();pt.current=performance.now();

    const onR=()=>{w=innerWidth;h=innerHeight;c.width=w;c.height=h;};
    const onM=(e:MouseEvent)=>{ms.current={x:e.clientX,y:e.clientY};mi.current=true;};
    const onT=(e:TouchEvent)=>{if(e.touches[0]){ms.current={x:e.touches[0].clientX,y:e.touches[0].clientY};mi.current=true;}};
    const onC=(ev:Event)=>{
      ev.preventDefault();
      const a=es.current,p=a.find(e=>e.t==='player');
      if(p&&p.r>18){const nr=p.r*.7;p.r=nr;p.ns=mkN(p.x,p.y,nr,NCNT);
        const ag=Math.random()*Math.PI*2;
        const s=mkE('player',p.x+Math.cos(ag)*40,p.y+Math.sin(ag)*40,nr,p.h+30,performance.now());
        s.vx=Math.cos(ag)*4;s.vy=Math.sin(ag)*4;a.push(s);}
    };

    addEventListener('resize',onR);addEventListener('mousemove',onM);
    addEventListener('touchmove',onT,{passive:true});
    c.addEventListener('click',onC);
    c.addEventListener('touchstart',(e)=>{onT(e);onC(e);},{passive:false});

    let raf=0;
    function tick(now:number){
      raf=requestAnimationFrame(tick);
      const dt=Math.min((now-pt.current)/1000,0.05);pt.current=now;
      const a=es.current,m=ms.current,md=d2(m,lm.current);

      if(now-ls.current>SPAWN_MS){spawnF(w,h,now);ls.current=now;}

      // Update
      for(const e of a){
        switch(e.t){
          case'player':{
            if(mi.current){e.vx+=(m.x-e.x)*CE;e.vy+=(m.y-e.y)*CE;}
            e.vx*=.88;e.vy*=.88;e.h+=Math.hypot(e.vx,e.vy)*.3+.2;break;}
          case'predator':{
            const ps=a.filter(x=>x.t==='player');
            if(ps.length){const t=ps.reduce((c,p)=>d2(p,e)<d2(c,e)?p:c);
              const dx=t.x-e.x,dy=t.y-e.y,dd=Math.hypot(dx,dy)||1;
              const dk=Math.sin(now*.003+e.sd*100)>.5?3.5:1;
              e.vx+=(dx/dd)*.15*dk;e.vy+=(dy/dd)*.15*dk;}
            e.vx*=.92;e.vy*=.92;e.h=15+Math.sin(now*.005)*10;e.al=.8+Math.sin(now*.008)*.2;break;}
          case'mimic':{
            if(!e.mb)e.mb=[];e.mb.push({x:m.x,y:m.y});const dl=120;
            if(e.mb.length>dl){const t=e.mb[e.mb.length-dl];e.vx+=(t.x-e.x)*.04;e.vy+=(t.y-e.y)*.04;}
            if(e.mb.length>dl+60)e.mb=e.mb.slice(-(dl+60));
            e.vx*=.9;e.vy*=.9;const pp=a.find(x=>x.t==='player');if(pp)e.h=pp.h;e.al=.6;break;}
          case'shy':{
            const dx=e.x-m.x,dy=e.y-m.y,dd=Math.hypot(dx,dy)||1;
            if(dd<200){e.vx+=(dx/dd)*.3;e.vy+=(dy/dd)*.3;}
            for(const f of a){if(f.t==='player'||f.t==='shy'||f.id===e.id)continue;
              const fx=f.x-e.x,fy=f.y-e.y,fd=Math.hypot(fx,fy)||1;
              if(fd<300){e.vx+=(fx/fd)*.03;e.vy+=(fy/fd)*.03;}}
            if(md<STILL_TH){if(!ss.current)ss.current=now;
              if(now-ss.current>STILL_MS){const sx=m.x-e.x,sy=m.y-e.y,sd=Math.hypot(sx,sy)||1;
                e.vx+=(sx/sd)*.08;e.vy+=(sy/sd)*.08;e.al=Math.min(e.al+.005,.7);}
            }else{ss.current=0;e.al=Math.max(e.al-.01,.15);}
            e.vx*=.93;e.vy*=.93;break;}
          case'glitch':{
            e.vx+=(Math.random()-.5)*.5;e.vy+=(Math.random()-.5)*.5;e.vx*=.95;e.vy*=.95;
            if(e.gc!=null){e.gt=(e.gt||0)+dt*1e3;
              if(e.gt>e.gc){e.x=Math.random()*w;e.y=Math.random()*h;e.ns=mkN(e.x,e.y,e.r,NCNT);
                e.gt=0;e.gc=2e3+Math.random()*3e3;e.lt=now;}}
            e.h=Math.random()>.5?0:120;break;}
          case'gravity':{
            e.vx*=.97;e.vy*=.97;e.vx+=(Math.random()-.5)*.05;e.vy+=(Math.random()-.5)*.05;
            e.pu=(e.pu||0)+dt*1.5;e.h=270+Math.sin(e.pu)*15;
            for(const o of a){if(o.id===e.id)continue;const gx=e.x-o.x,gy=e.y-o.y,gd=Math.hypot(gx,gy)||1;
              if(gd<400){const f=.02*(1-gd/400);o.vx+=(gx/gd)*f;o.vy+=(gy/gd)*f;}}
            break;}
          case'baby':{
            e.vx+=(Math.random()-.5)*.2;e.vy+=(Math.random()-.5)*.2;e.vx*=.96;e.vy*=.96;
            if(e.ph)e.h=(e.ph[0]+e.ph[1])/2+Math.sin(now*.002)*((e.ph[1]-e.ph[0])/2);break;}
        }
        e.x+=e.vx;e.y+=e.vy;
        const mg=60;
        if(e.x<-mg)e.x=w+mg;if(e.x>w+mg)e.x=-mg;
        if(e.y<-mg)e.y=h+mg;if(e.y>h+mg)e.y=-mg;
        for(const n of e.ns){
          const tx=e.x+Math.cos(n.a)*n.r,ty=e.y+Math.sin(n.a)*n.r;
          n.vx+=(tx-n.x)*SK;n.vy+=(ty-n.y)*SK;n.vx-=e.vx*.03;n.vy-=e.vy*.03;
          n.vx*=SD;n.vy*=SD;n.x+=n.vx;n.y+=n.vy;}
        if(e.cor>0)e.cor=Math.max(0,e.cor-dt*.5);
        e.tr.push({x:e.x,y:e.y});if(e.tr.length>TRAIL_N)e.tr.shift();e.age+=dt;
      }

      // Collisions
      for(let i=0;i<a.length;i++){for(let j=i+1;j<a.length;j++){
        const A=a[i],B=a[j],dd=d2(A,B),cr=A.r+B.r;if(dd>=cr*.8)continue;
        if(A.t==='player'&&B.t==='player'){
          const bg=A.r>=B.r?A:B,sm=A.r<B.r?A:B;bg.r=Math.min(55,Math.sqrt(bg.r**2+sm.r**2));
          bg.ns=mkN(bg.x,bg.y,bg.r,NCNT);const si=a.indexOf(sm);if(si>-1)a.splice(si,1);j--;continue;}
        if((A.t==='predator'&&B.t==='player')||(A.t==='player'&&B.t==='predator')){
          const pd=A.t==='predator'?A:B,pr=A.t==='player'?A:B;
          if(pr.r>15){pr.r-=2;pd.r=Math.min(45,pd.r+1);pr.ns=mkN(pr.x,pr.y,pr.r,NCNT);pd.ns=mkN(pd.x,pd.y,pd.r,pd.ns.length);
            const ag=Math.atan2(pr.y-pd.y,pr.x-pd.x);pr.vx+=Math.cos(ag)*5;pr.vy+=Math.sin(ag)*5;}}
        if((A.t==='mimic'&&B.t==='player')||(A.t==='player'&&B.t==='mimic')){
          const pl=A.t==='player'?A:B,mi2=A.t==='mimic'?A:B;
          const ag=Math.atan2(pl.y-mi2.y,pl.x-mi2.x);
          pl.vx+=Math.cos(ag)*8;pl.vy+=Math.sin(ag)*8;pl.h+=60;mi2.vx-=Math.cos(ag)*4;mi2.vy-=Math.sin(ag)*4;}
        if(A.t==='shy'||B.t==='shy'){const sh=A.t==='shy'?A:B;
          sh.x=Math.random()*w;sh.y=Math.random()*h;sh.ns=mkN(sh.x,sh.y,sh.r,NCNT);sh.al=.05;sh.vx=0;sh.vy=0;}
        if(A.t==='glitch'||B.t==='glitch'){(A.t==='glitch'?B:A).cor=3;}
        if(A.t==='gravity'||B.t==='gravity'){const g=A.t==='gravity'?A:B,o=A.t==='gravity'?B:A;
          if(o.t!=='gravity'){const ag=Math.atan2(o.y-g.y,o.x-g.x);o.vx=Math.cos(ag)*12;o.vy=Math.sin(ag)*12;}}
        if(A.t!=='baby'&&B.t!=='baby'&&Math.random()<BABY_P*.05)spawnB(A,B,now);
        if(dd>0){const ol=cr*.8-dd,nx=(B.x-A.x)/dd,ny=(B.y-A.y)/dd;
          A.vx-=nx*ol*.1;A.vy-=ny*ol*.1;B.vx+=nx*ol*.1;B.vy+=ny*ol*.1;}
      }}
      lm.current={x:m.x,y:m.y};

      // ── RENDER ──
      ctx.fillStyle='#0a0a0a';ctx.fillRect(0,0,w,h);
      const ord:Record<ET,number>={gravity:0,baby:1,shy:2,mimic:3,glitch:4,predator:5,player:6};
      const sorted=[...a].sort((a,b)=>(ord[a.t]||0)-(ord[b.t]||0));

      for(const e of sorted){
        const cc=e.cor>0,ci=cc?Math.min(e.cor,1):0;
        // Trail
        for(let i=1;i<e.tr.length;i++){const t=i/e.tr.length;
          ctx.beginPath();ctx.fillStyle=hsl(e.h,80,50,t*.25*e.al);
          ctx.arc(e.tr[i].x,e.tr[i].y,e.r*t*.3,0,Math.PI*2);ctx.fill();}
        // Glow
        const gr=ctx.createRadialGradient(e.x,e.y,e.r*.3,e.x,e.y,e.r*2.5);
        gr.addColorStop(0,hsl(e.h,100,60,e.al*.15));gr.addColorStop(1,hsl(e.h,100,50,0));
        ctx.beginPath();ctx.fillStyle=gr;ctx.arc(e.x,e.y,e.r*2.5,0,Math.PI*2);ctx.fill();
        ctx.save();
        if(cc)ctx.translate((Math.random()-.5)*8*ci,(Math.random()-.5)*8*ci);
        // Body
        if(e.ns.length>2){ctx.beginPath();const ns=e.ns;
          ctx.moveTo((ns[ns.length-1].x+ns[0].x)/2,(ns[ns.length-1].y+ns[0].y)/2);
          for(let i=0;i<ns.length;i++){const c=ns[i],nx=ns[(i+1)%ns.length];ctx.quadraticCurveTo(c.x,c.y,(c.x+nx.x)/2,(c.y+nx.y)/2);}
          ctx.closePath();
          const bh=cc?e.h+(Math.random()-.5)*180*ci:e.h;
          const bg=ctx.createRadialGradient(e.x-e.r*.3,e.y-e.r*.3,0,e.x,e.y,e.r*1.2);
          bg.addColorStop(0,hsl(bh,cc?50:70,55,e.al));bg.addColorStop(.6,hsl(bh,cc?60:80,40,e.al));bg.addColorStop(1,hsl(bh,90,25,e.al*.8));
          ctx.fillStyle=bg;ctx.fill();
          // Specular
          ctx.beginPath();const hx=e.x-e.r*.25,hy=e.y-e.r*.25;
          const sg=ctx.createRadialGradient(hx,hy,0,hx,hy,e.r*.5);
          sg.addColorStop(0,`rgba(255,255,255,${.25*e.al})`);sg.addColorStop(1,'rgba(255,255,255,0)');
          ctx.fillStyle=sg;ctx.arc(hx,hy,e.r*.5,0,Math.PI*2);ctx.fill();}
        // Type decorations
        if(e.t==='predator'){ctx.strokeStyle=hsl(e.h,100,60,e.al*.6);ctx.lineWidth=2;
          for(let i=0;i<e.ns.length;i++){const n=e.ns[i];const sp=e.r*.4*(.5+Math.sin(now*.01+i)*.5);
            ctx.beginPath();ctx.moveTo(n.x,n.y);ctx.lineTo(n.x+Math.cos(n.a)*sp,n.y+Math.sin(n.a)*sp);ctx.stroke();}}
        if(e.t==='glitch'){const rtp=e.lt&&(now-e.lt)<500;
          if(rtp){ctx.globalAlpha=.4;
            ctx.fillStyle='rgba(255,0,0,.3)';ctx.fillRect(e.x-e.r-5,e.y-e.r,e.r*2,e.r*2);
            ctx.fillStyle='rgba(0,255,0,.3)';ctx.fillRect(e.x-e.r+5,e.y-e.r,e.r*2,e.r*2);
            ctx.fillStyle='rgba(0,0,255,.3)';ctx.fillRect(e.x-e.r,e.y-e.r+3,e.r*2,e.r*2);
            ctx.globalAlpha=1;}
          for(let k=0;k<8;k++){ctx.fillStyle=`rgba(${Math.random()>.5?255:0},${Math.random()>.5?255:0},${Math.random()>.5?255:0},.6)`;
            ctx.fillRect(e.x+(Math.random()-.5)*e.r*2,e.y+(Math.random()-.5)*e.r*2,2,2);}}
        if(e.t==='gravity'){const p=e.pu||0;
          for(let ring=0;ring<3;ring++){const rr=e.r*(1.3+ring*.4+Math.sin(p+ring)*.1);
            ctx.beginPath();ctx.strokeStyle=hsl(270,60,40,.15-ring*.04);ctx.lineWidth=1.5;
            ctx.arc(e.x,e.y,rr,0,Math.PI*2);ctx.stroke();}}
        ctx.restore();
      }
      // Scanlines
      ctx.fillStyle='rgba(0,0,0,0.03)';
      for(let y=0;y<h;y+=3)ctx.fillRect(0,y,w,1);
      // HUD
      ctx.font='11px monospace';ctx.fillStyle='rgba(255,255,255,0.2)';
      ctx.fillText(`entities: ${a.length}`,12,h-12);
      ctx.fillText('click/tap to split',w-130,h-12);
    }
    raf=requestAnimationFrame(tick);
    return()=>{cancelAnimationFrame(raf);removeEventListener('resize',onR);removeEventListener('mousemove',onM);removeEventListener('touchmove',onT);
      c.removeEventListener('click',onC);};
  },[spawnF,spawnB]);

  return(
    <div style={{position:'fixed',inset:0,background:'#0a0a0a',overflow:'hidden'}}>
      <canvas ref={cv} style={{display:'block',width:'100%',height:'100%',cursor:'none'}}/>
      <div style={{position:'absolute',top:16,left:16,fontFamily:'monospace',fontSize:11,color:'rgba(255,255,255,0.25)',pointerEvents:'none',lineHeight:1.6}}>
        <div style={{color:'rgba(0,255,255,0.5)',fontSize:14,letterSpacing:2,marginBottom:4}}>THE BLOB</div>
        <div>move cursor · click to split</div>
        <div style={{marginTop:8,fontSize:10,color:'rgba(255,255,255,0.15)'}}>
          <span style={{color:'#ff3300'}}>■</span> predator&ensp;
          <span style={{color:'#00ffff',opacity:.6}}>■</span> mimic&ensp;
          <span style={{color:'#88ccff',opacity:.3}}>■</span> shy&ensp;
          <span style={{color:'#fff'}}>■</span> glitch&ensp;
          <span style={{color:'#6b00cc'}}>■</span> gravity
        </div>
      </div>
    </div>
  );
}
