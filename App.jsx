import { useState, useEffect, useRef } from "react";
import * as Tone from "tone";

const COLS=9,ROWS=10;
const PN={K:{han:"漢",cho:"楚"},G:{han:"士",cho:"士"},E:{han:"象",cho:"象"},H:{han:"馬",cho:"馬"},R:{han:"車",cho:"車"},C:{han:"包",cho:"包"},P:{han:"兵",cho:"卒"}};
const FORMS=[
  {name:"마상마상",layout:["H","E","H","E"],sub:"馬象—馬象"},
  {name:"상마상마",layout:["E","H","E","H"],sub:"象馬—象馬"},
  {name:"마상상마",layout:["H","E","E","H"],sub:"馬象—象馬"},
  {name:"상마마상",layout:["E","H","H","E"],sub:"象馬—馬象"},
];
const DIFF=[
  {name:"초급",label:"🌱",color:"#4caf50",desc:"입문자용",depth:0},
  {name:"중급",label:"⚔️",color:"#ff9800",desc:"기본 전략",depth:1},
  {name:"상급",label:"🔥",color:"#f44336",desc:"강한 AI",depth:2},
  {name:"최강",label:"💀",color:"#9c27b0",desc:"극한 도전",depth:3},
];

// Sound
let audioOn=false;
const sa=async()=>{if(!audioOn){await Tone.start();audioOn=true;}};
const mkW=()=>{const f=new Tone.Filter({frequency:3500,type:"bandpass",Q:2}).toDestination();const n=new Tone.NoiseSynth({noise:{type:"brown"},envelope:{attack:.001,decay:.06,sustain:0,release:.03}}).connect(f);n.volume.value=-4;const c=new Tone.Synth({oscillator:{type:"sine"},envelope:{attack:.001,decay:.04,sustain:0,release:.02}}).toDestination();c.volume.value=-8;return{n,c};};
const sMove=()=>{sa();const{n,c}=mkW();const t=Tone.now();n.triggerAttackRelease("32n",t);c.triggerAttackRelease("G4","64n",t);};
const sCap=()=>{sa();const{n,c}=mkW();const t=Tone.now();n.volume.value=0;n.triggerAttackRelease("16n",t);c.triggerAttackRelease("E4","32n",t);const{n:n2}=mkW();n2.volume.value=-10;n2.triggerAttackRelease("64n",t+.05);};
const sSel=()=>{sa();const f=new Tone.Filter({frequency:5000,type:"bandpass",Q:3}).toDestination();const n=new Tone.NoiseSynth({noise:{type:"brown"},envelope:{attack:.001,decay:.025,sustain:0,release:.01}}).connect(f);n.volume.value=-12;n.triggerAttackRelease("64n");};
const sChk=()=>{sa();const{n,c}=mkW();const t=Tone.now();n.volume.value=2;n.triggerAttackRelease("16n",t);c.triggerAttackRelease("C4","32n",t);const w=new Tone.Synth({oscillator:{type:"triangle"},envelope:{attack:.01,decay:.12,sustain:0,release:.05}}).toDestination();w.volume.value=-10;w.triggerAttackRelease("A5","16n",t+.1);w.triggerAttackRelease("E5","16n",t+.22);};
const sWin=()=>{sa();const s=new Tone.Synth({oscillator:{type:"triangle"},envelope:{attack:.01,decay:.2,sustain:.05,release:.15}}).toDestination();s.volume.value=-8;const t=Tone.now();["C5","E5","G5","C6"].forEach((x,i)=>s.triggerAttackRelease(x,"8n",t+i*.18));};
const sLose=()=>{sa();const s=new Tone.Synth({oscillator:{type:"triangle"},envelope:{attack:.01,decay:.3,sustain:0,release:.2}}).toDestination();s.volume.value=-8;const t=Tone.now();["C5","A4","F4","D4"].forEach((x,i)=>s.triggerAttackRelease(x,"8n",t+i*.2));};
const sInv=()=>{sa();const f=new Tone.Filter({frequency:800,type:"lowpass"}).toDestination();const n=new Tone.NoiseSynth({noise:{type:"brown"},envelope:{attack:.001,decay:.04,sustain:0,release:.02}}).connect(f);n.volume.value=-10;n.triggerAttackRelease("64n");};

const mkB=(cL,hL)=>{
  const b=Array.from({length:ROWS},()=>Array(COLS).fill(null));
  b[9][0]={type:"R",team:"cho"};b[9][1]={type:cL[0],team:"cho"};b[9][2]={type:cL[1],team:"cho"};
  b[9][3]={type:"G",team:"cho"};b[9][5]={type:"G",team:"cho"};
  b[9][6]={type:cL[2],team:"cho"};b[9][7]={type:cL[3],team:"cho"};b[9][8]={type:"R",team:"cho"};
  b[8][4]={type:"K",team:"cho"};b[7][1]={type:"C",team:"cho"};b[7][7]={type:"C",team:"cho"};
  for(let i=0;i<5;i++)b[6][i*2]={type:"P",team:"cho"};
  b[0][0]={type:"R",team:"han"};b[0][1]={type:hL[0],team:"han"};b[0][2]={type:hL[1],team:"han"};
  b[0][3]={type:"G",team:"han"};b[0][5]={type:"G",team:"han"};
  b[0][6]={type:hL[2],team:"han"};b[0][7]={type:hL[3],team:"han"};b[0][8]={type:"R",team:"han"};
  b[1][4]={type:"K",team:"han"};b[2][1]={type:"C",team:"han"};b[2][7]={type:"C",team:"han"};
  for(let i=0;i<5;i++)b[3][i*2]={type:"P",team:"han"};
  return b;
};
const cB=b=>b.map(r=>r.map(c=>c?{...c}:null));
const inP=(r,c,t)=>{if(c<3||c>5)return false;return t==="han"?(r>=0&&r<=2):(r>=7&&r<=9);};
const isPC=(r,c)=>(r===1&&c===4)||(r===8&&c===4);
const isPCo=(r,c)=>[[0,3],[0,5],[2,3],[2,5],[7,3],[7,5],[9,3],[9,5]].some(([a,b])=>a===r&&b===c);
const gPD=(r,c)=>{const m=[];if(isPC(r,c))m.push([-1,-1],[-1,1],[1,-1],[1,1]);else if(isPCo(r,c)){m.push([r<5?1-r:8-r,4-c]);}return m;};

const gVM=(bd,ro,co)=>{
  const p=bd[ro][co];if(!p)return[];
  const{type:ty,team:tm}=p,mv=[],op=tm==="han"?"cho":"han",fw=tm==="han"?1:-1;
  const iB=(r,c)=>r>=0&&r<ROWS&&c>=0&&c<COLS;
  const nF=(r,c)=>iB(r,c)&&(!bd[r][c]||bd[r][c].team===op);
  if(ty==="K"||ty==="G"){for(const[dr,dc]of[[0,1],[0,-1],[1,0],[-1,0],...gPD(ro,co)]){const nr=ro+dr,nc=co+dc;if(inP(nr,nc,tm)&&nF(nr,nc))mv.push([nr,nc]);}}
  if(ty==="R"){for(const[dr,dc]of[[0,1],[0,-1],[1,0],[-1,0]]){let r=ro+dr,c=co+dc;while(iB(r,c)){if(bd[r][c]){if(bd[r][c].team===op)mv.push([r,c]);break;}mv.push([r,c]);r+=dr;c+=dc;}}if(isPC(ro,co)||isPCo(ro,co)){for(const[dr,dc]of gPD(ro,co)){let r=ro+dr,c=co+dc;if(iB(r,c)&&nF(r,c)){mv.push([r,c]);if(!bd[r][c]&&isPC(ro,co)){const r2=r+dr,c2=c+dc;if(iB(r2,c2)&&nF(r2,c2))mv.push([r2,c2]);}}}}}
  if(ty==="C"){for(const[dr,dc]of[[0,1],[0,-1],[1,0],[-1,0]]){let r=ro+dr,c=co+dc,j=false;while(iB(r,c)){if(bd[r][c]){if(!j){if(bd[r][c].type!=="C")j=true;}else{if(bd[r][c].type!=="C"&&bd[r][c].team===op)mv.push([r,c]);break;}}else if(j)mv.push([r,c]);r+=dr;c+=dc;}}}
  if(ty==="H"){for(const{step:s,end:e}of[{step:[-1,0],end:[[-2,-1],[-2,1]]},{step:[1,0],end:[[2,-1],[2,1]]},{step:[0,-1],end:[[-1,-2],[1,-2]]},{step:[0,1],end:[[-1,2],[1,2]]}]){const mr=ro+s[0],mc=co+s[1];if(!iB(mr,mc)||bd[mr][mc])continue;for(const[dr,dc]of e){const nr=ro+dr,nc=co+dc;if(nF(nr,nc))mv.push([nr,nc]);}}}
  if(ty==="E"){for(const{s1,s2,end:en}of[{s1:[-1,0],s2:[-2,-1],end:[-3,-2]},{s1:[-1,0],s2:[-2,1],end:[-3,2]},{s1:[1,0],s2:[2,-1],end:[3,-2]},{s1:[1,0],s2:[2,1],end:[3,2]},{s1:[0,-1],s2:[-1,-2],end:[-2,-3]},{s1:[0,-1],s2:[1,-2],end:[2,-3]},{s1:[0,1],s2:[-1,2],end:[-2,3]},{s1:[0,1],s2:[1,2],end:[2,3]}]){const r1=ro+s1[0],c1=co+s1[1];if(!iB(r1,c1)||bd[r1][c1])continue;const r2=ro+s2[0],c2=co+s2[1];if(!iB(r2,c2)||bd[r2][c2])continue;const nr=ro+en[0],nc=co+en[1];if(nF(nr,nc))mv.push([nr,nc]);}}
  if(ty==="P"){for(const[dr,dc]of[[0,-1],[0,1],[fw,0]]){const nr=ro+dr,nc=co+dc;if(nF(nr,nc))mv.push([nr,nc]);}if(inP(ro,co,op)){for(const[dr,dc]of gPD(ro,co)){const nr=ro+dr,nc=co+dc;if(iB(nr,nc)&&nF(nr,nc)&&(dr===fw||dr===0))mv.push([nr,nc]);}}}
  return mv;
};
const iIC=(bd,tm)=>{let kp=null;for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(bd[r][c]?.type==="K"&&bd[r][c].team===tm)kp=[r,c];if(!kp)return true;const op=tm==="han"?"cho":"han";for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(bd[r][c]?.team===op&&gVM(bd,r,c).some(([a,b])=>a===kp[0]&&b===kp[1]))return true;return false;};
const gLM=(bd,ro,co)=>{const p=bd[ro][co];if(!p)return[];return gVM(bd,ro,co).filter(([nr,nc])=>{const nb=cB(bd);nb[nr][nc]=nb[ro][co];nb[ro][co]=null;return!iIC(nb,p.team);});};
const isCM=(bd,tm)=>{for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(bd[r][c]?.team===tm&&gLM(bd,r,c).length>0)return false;return true;};

const PV={P:2,G:3,E:3,H:5,C:7,R:13,K:100};
const PST_CHO={
  P:[[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[.5,.5,.5,.5,.5,.5,.5,.5,.5],[1,1,1.2,1.2,1.5,1.2,1.2,1,1],[2,2,2,2,2,2,2,2,2],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0]],
  R:[[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,.3,0,0,0,0,0,.3,0],[0,0,0,.2,.5,.2,0,0,0],[.1,0,0,0,0,0,0,0,.1]],
  H:[[0,0,0,0,0,0,0,0,0],[0,.2,.2,.2,.2,.2,.2,.2,0],[0,.2,.4,.4,.4,.4,.4,.2,0],[0,.2,.4,.5,.5,.5,.4,.2,0],[0,.2,.4,.5,.5,.5,.4,.2,0],[0,.2,.4,.5,.5,.5,.4,.2,0],[0,.2,.4,.4,.4,.4,.4,.2,0],[0,.2,.2,.2,.2,.2,.2,.2,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0]],
};

const evalBoard=(bd)=>{
  let sc=0;
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    const p=bd[r][c];if(!p)continue;
    const v=PV[p.type],pst=PST_CHO[p.type];
    let pos=0;if(pst){pos=p.team==="han"?pst[r][c]:pst[9-r][c];}
    if(p.team==="han")sc+=v+pos;else sc-=v+pos;
  }
  if(iIC(bd,"cho"))sc+=3;if(iIC(bd,"han"))sc-=3;
  return sc;
};

const getAI=(bd,depth)=>{
  if(depth<=0){
    let best=null,bs=-Infinity;
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(bd[r][c]?.team==="han"){
      for(const[nr,nc]of gLM(bd,r,c)){
        let s=Math.random()*.3;if(bd[nr][nc])s+=PV[bd[nr][nc].type]*10;
        const nb=cB(bd);nb[nr][nc]=nb[r][c];nb[r][c]=null;
        if(iIC(nb,"cho"))s+=5;s+=(4.5-Math.abs(nc-4))*.2;
        if(s>bs){bs=s;best={fr:r,fc:c,tr:nr,tc:nc};}
      }
    }
    return best;
  }
  const minimax=(bd2,d,alpha,beta,isMax)=>{
    if(d===0)return evalBoard(bd2);
    const tm=isMax?"han":"cho";
    if(isCM(bd2,tm))return isMax?-999:999;
    let moves=[];
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(bd2[r][c]?.team===tm){
      for(const[nr,nc]of gLM(bd2,r,c))moves.push([r,c,nr,nc,bd2[nr][nc]?PV[bd2[nr][nc].type]:0]);
    }
    moves.sort((a,b)=>b[4]-a[4]);
    if(isMax){
      let val=-Infinity;
      for(const[fr,fc,tr,tc]of moves){const nb=cB(bd2);nb[tr][tc]=nb[fr][fc];nb[fr][fc]=null;val=Math.max(val,minimax(nb,d-1,alpha,beta,false));alpha=Math.max(alpha,val);if(beta<=alpha)break;}
      return val;
    }else{
      let val=Infinity;
      for(const[fr,fc,tr,tc]of moves){const nb=cB(bd2);nb[tr][tc]=nb[fr][fc];nb[fr][fc]=null;val=Math.min(val,minimax(nb,d-1,alpha,beta,true));beta=Math.min(beta,val);if(beta<=alpha)break;}
      return val;
    }
  };
  let best=null,bs=-Infinity,moves=[];
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(bd[r][c]?.team==="han"){
    for(const[nr,nc]of gLM(bd,r,c))moves.push([r,c,nr,nc,bd[nr][nc]?PV[bd[nr][nc].type]:0]);
  }
  moves.sort((a,b)=>b[4]-a[4]);
  for(const[fr,fc,tr,tc]of moves){
    const nb=cB(bd);nb[tr][tc]=nb[fr][fc];nb[fr][fc]=null;
    const s=minimax(nb,depth,-Infinity,Infinity,false)+Math.random()*.1;
    if(s>bs){bs=s;best={fr,fc,tr,tc};}
  }
  return best;
};

const Arrow=({fr,fc,tr,tc,cellSize:cs,piece:p})=>{
  const col=p.team==="cho"?"rgba(198,40,40,0.6)":"rgba(21,101,192,0.6)";
  const gl=p.team==="cho"?"rgba(198,40,40,0.3)":"rgba(21,101,192,0.3)";
  const x1=fc*cs+cs/2,y1=fr*cs+cs/2,x2=tc*cs+cs/2,y2=tr*cs+cs/2;
  const dx=x2-x1,dy=y2-y1,ln=Math.sqrt(dx*dx+dy*dy),ux=dx/ln,uy=dy/ln;
  const pd=cs*.35,sx=x1+ux*pd,sy=y1+uy*pd,ex=x2-ux*pd,ey=y2-uy*pd;
  const aS=cs*.22;
  const a1x=ex-ux*aS-uy*aS*.6,a1y=ey-uy*aS+ux*aS*.6,a2x=ex-ux*aS+uy*aS*.6,a2y=ey-uy*aS-ux*aS*.6;
  return(<svg style={{position:"absolute",top:0,left:0,width:cs*COLS,height:cs*ROWS,pointerEvents:"none",zIndex:45}}>
    <defs><filter id="ag"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={gl} strokeWidth={cs*.18} strokeLinecap="round"/>
    <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={col} strokeWidth={cs*.08} strokeLinecap="round" filter="url(#ag)"/>
    <polygon points={`${ex},${ey} ${a1x},${a1y} ${a2x},${a2y}`} fill={col} filter="url(#ag)"/>
    <circle cx={sx} cy={sy} r={cs*.06} fill={col}/>
  </svg>);
};

const Piece=({piece:p,cellSize:cs,isSel,isTarget,style:ex={}})=>{
  const col=p.team==="cho"?"#c62828":"#1565c0";
  return(<div style={{width:cs*.86,height:cs*.86,borderRadius:"50%",
    background:isSel?"radial-gradient(circle,#fff8e1,#ffe082)":"radial-gradient(circle,#fff8e1,#e8d5b7)",
    border:`2.5px solid ${col}`,
    boxShadow:isSel?"0 0 16px rgba(255,224,130,0.9),inset 0 1px 3px rgba(255,255,255,0.6)":isTarget?"0 0 12px rgba(244,67,54,0.6)":"0 3px 8px rgba(0,0,0,0.35),inset 0 1px 3px rgba(255,255,255,0.4)",
    display:"flex",alignItems:"center",justifyContent:"center",fontSize:cs*.4,fontWeight:900,color:col,
    transition:"transform .3s cubic-bezier(.34,1.56,.64,1),box-shadow .2s",
    transform:isSel?"scale(1.12)":"scale(1)",...ex}}>
    {PN[p.type][p.team]}
  </div>);
};

const MiniB=({layout:l,team:t,sz=26})=>{
  const col=t==="cho"?"#c62828":"#1565c0";
  return(<div style={{display:"flex",gap:6,justifyContent:"center",alignItems:"center"}}>
    <div style={{display:"flex",gap:4}}>{l.slice(0,2).map((x,i)=>(<div key={i} style={{width:sz,height:sz,borderRadius:"50%",background:"radial-gradient(circle,#fff8e1,#e8d5b7)",border:`2px solid ${col}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:sz*.45,fontWeight:800,color:col,boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}>{x==="H"?"馬":"象"}</div>))}</div>
    <div style={{color:"#5a6577",fontSize:12}}>—</div>
    <div style={{display:"flex",gap:4}}>{l.slice(2,4).map((x,i)=>(<div key={i} style={{width:sz,height:sz,borderRadius:"50%",background:"radial-gradient(circle,#fff8e1,#e8d5b7)",border:`2px solid ${col}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:sz*.45,fontWeight:800,color:col,boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}>{x==="H"?"馬":"象"}</div>))}</div>
  </div>);
};

const CSS=`
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeInScale{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes dotPulse{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.3);opacity:1}}
@keyframes captureExplode{0%{transform:scale(.5);opacity:1}100%{transform:scale(3);opacity:0}}
@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-3px)}40%{transform:translateX(3px)}60%{transform:translateX(-2px)}80%{transform:translateX(2px)}}
@keyframes slideIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
@keyframes arrowFadeIn{from{opacity:0}to{opacity:1}}
.bh:hover{filter:brightness(1.15);transform:scale(1.03)!important}.bh:active{transform:scale(.97)!important}
.fc{transition:all .2s;cursor:pointer}.fc:hover{transform:translateY(-3px)!important;box-shadow:0 8px 24px rgba(0,0,0,0.3)!important}
`;
const BG="linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)";

// Storage helpers - uses window.storage for Claude.ai, change to localStorage for standalone app
const loadRec=async()=>{try{const r=await window.storage.get("janggi-records");return r?JSON.parse(r.value):{wins:0,losses:0,streak:0,bestStreak:0,round:1,difficulty:0,history:[]};}catch{return{wins:0,losses:0,streak:0,bestStreak:0,round:1,difficulty:0,history:[]};}};
const saveRec=async(d)=>{try{await window.storage.set("janggi-records",JSON.stringify(d));}catch(e){console.error(e);}};

export default function Janggi(){
  const[board,setBoard]=useState(null);
  const[sel,setSel]=useState(null);
  const[vm,setVm]=useState([]);
  const[turn,setTurn]=useState("cho");
  const[hist,setHist]=useState([]);
  const[go,setGo]=useState(null);
  const[moveCount,setMC]=useState(0);
  const[posHistory,setPH]=useState([]);
  const[chk,setChk]=useState(false);
  const[timer,setTimer]=useState(90);
  const[lm,setLm]=useState(null);
  const[anim,setAnim]=useState(null);
  const[ce,setCe]=useState(null);
  const[cf,setCf]=useState(false);
  const[arrow,setArrow]=useState(null);
  const[phase,setPhase]=useState("menu");
  const[diff,setDiff]=useState(0);
  const[choF,setChoF]=useState(null);
  const[rec,setRec]=useState({wins:0,losses:0,streak:0,bestStreak:0,round:1,difficulty:0,history:[]});
  const[loading,setLoading]=useState(true);
  const tRef=useRef(null);
  const animTimerRef=useRef(null);
  const cs=typeof window!=="undefined"?Math.min(Math.floor((Math.min(window.innerWidth,500)-40)/COLS),52):48;

  useEffect(()=>{loadRec().then(r=>{setRec(r);setLoading(false);});},[]);

  useEffect(()=>{
    if(phase!=="playing"||go)return;
    setTimer(diff>=2?60:90);
    if(tRef.current)clearInterval(tRef.current);
    tRef.current=setInterval(()=>{setTimer(t=>{if(t<=1){clearInterval(tRef.current);setTurn(p=>p==="cho"?"han":"cho");return diff>=2?60:90;}return t-1;});},1000);
    return()=>clearInterval(tRef.current);
  },[turn,phase,go,diff]);

  useEffect(()=>{
    if(phase==="playing"&&turn==="han"&&!go&&!anim&&board){
      const to=setTimeout(()=>{const mv=getAI(board,DIFF[diff].depth);if(mv)execMove(mv.fr,mv.fc,mv.tr,mv.tc);},500);
      return()=>clearTimeout(to);
    }
  },[turn,go,anim,board,phase,diff]);

  const boardKey=(bd)=>{let s="";for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const p=bd[r][c];s+=p?p.team[0]+p.type:"__";}return s;};

  const checkDraw=(bd,nx)=>{
    if(isCM(bd,nx)&&!iIC(bd,nx))return"stalemate";
    let cnt=0;for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(bd[r][c]&&bd[r][c].type!=="K")cnt++;
    if(cnt===0)return"material";
    if(moveCount>=200)return"movelimit";
    return null;
  };

  const checkRepetition=(key)=>{return posHistory.filter(k=>k===key).length>=3;};

  const startGame=(cLayout)=>{
    const hL=FORMS[Math.floor(Math.random()*4)].layout;
    setBoard(mkB(cLayout,hL));setPhase("playing");setTurn("cho");setHist([]);
    setGo(null);setChk(false);setLm(null);setSel(null);setVm([]);setArrow(null);setMC(0);setPH([]);
  };

  const execMove=(fr,fc,tr,tc)=>{
    const piece=board[fr][fc],cap=board[tr][tc];
    const nb=cB(board);nb[tr][tc]=nb[fr][fc];nb[fr][fc]=null;
    setHist(h=>[...h,{board:cB(board),turn,lm}]);
    setBoard(nb);setLm({fr,fc,tr,tc});setSel(null);setVm([]);

    setAnim({fr,fc,tr,tc,piece:{...piece},cap});
    setArrow({fr,fc,tr,tc,piece:{...piece}});
    if(animTimerRef.current)clearTimeout(animTimerRef.current);
    animTimerRef.current=setTimeout(()=>{setAnim(null);},3200);
    setTimeout(()=>setArrow(null),3500);
    setTimeout(()=>{if(cap)sCap();else sMove();},80);
    if(cap){setCe({r:tr,c:tc});setTimeout(()=>setCe(null),800);}

    const nx=turn==="cho"?"han":"cho";
    setTurn(nx);setMC(mc=>mc+1);
    const key=boardKey(nb);
    setPH(ph=>[...ph,key]);
    const ic=iIC(nb,nx);setChk(ic);
    if(ic){sChk();setCf(true);setTimeout(()=>setCf(false),600);}

    if(isCM(nb,nx)){
      if(ic){
        const won=turn==="cho";
        setGo(won?"win":"lose");
        if(won)sWin();else sLose();
        setRec(prev=>{
          const nr={...prev};
          if(won){nr.wins++;nr.streak++;if(nr.streak>nr.bestStreak)nr.bestStreak=nr.streak;nr.round=Math.min(nr.round+1,100);}
          else{nr.losses++;nr.streak=0;}
          nr.history=[{round:prev.round,diff,result:won?"승":"패",date:new Date().toLocaleDateString("ko-KR")},...nr.history].slice(0,50);
          saveRec(nr);return nr;
        });
        return;
      }
      setGo("draw");
      setRec(prev=>{const nr={...prev};nr.history=[{round:prev.round,diff,result:"무",date:new Date().toLocaleDateString("ko-KR")},...nr.history].slice(0,50);saveRec(nr);return nr;});
      return;
    }
    const dr=checkDraw(nb,nx);
    if(dr){
      setGo("draw");
      setRec(prev=>{const nr={...prev};nr.history=[{round:prev.round,diff,result:"무",date:new Date().toLocaleDateString("ko-KR")},...nr.history].slice(0,50);saveRec(nr);return nr;});
      return;
    }
    if(checkRepetition(key)){
      setGo("draw");
      setRec(prev=>{const nr={...prev};nr.history=[{round:prev.round,diff,result:"무",date:new Date().toLocaleDateString("ko-KR")},...nr.history].slice(0,50);saveRec(nr);return nr;});
      return;
    }
  };

  const handleCell=(r,c)=>{
    if(go||turn==="han")return;
    sa();
    if(anim){setAnim(null);setArrow(null);if(animTimerRef.current)clearTimeout(animTimerRef.current);}
    if(sel){if(vm.some(([a,b])=>a===r&&b===c)){execMove(sel[0],sel[1],r,c);return;}}
    if(board[r][c]?.team==="cho"){const m=gLM(board,r,c);if(m.length===0){sInv();return;}setSel([r,c]);setVm(m);sSel();}
    else{setSel(null);setVm([]);}
  };

  const undo=()=>{
    if(hist.length===0||anim)return;
    const p=hist[hist.length-1];
    setBoard(p.board);setTurn(p.turn);setLm(p.lm);
    setHist(h=>h.slice(0,-1));setSel(null);setVm([]);setArrow(null);
    setChk(iIC(p.board,p.turn));setGo(null);sMove();
  };

  const resetAll=()=>{if(tRef.current)clearInterval(tRef.current);setBoard(null);setSel(null);setVm([]);setTurn("cho");setHist([]);setGo(null);setChk(false);setLm(null);setAnim(null);setChoF(null);setPhase("menu");setArrow(null);setMC(0);setPH([]);};
  const goForm=()=>{if(tRef.current)clearInterval(tRef.current);setBoard(null);setChoF(null);setPhase("formation");setGo(null);setArrow(null);setMC(0);setPH([]);};
  const resetRecords=async()=>{const fresh={wins:0,losses:0,streak:0,bestStreak:0,round:1,difficulty:0,history:[]};setRec(fresh);await saveRec(fresh);};

  if(loading)return(<div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:BG,color:"#8892a4",fontFamily:"'Segoe UI',sans-serif"}}>로딩 중...</div>);

  // MENU
  if(phase==="menu"){
    const pct=((rec.round-1)/100*100).toFixed(0);
    return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:BG,fontFamily:"'Segoe UI',sans-serif",padding:20}}>
      <style>{CSS}</style>
      <div style={{textAlign:"center",marginBottom:32,animation:"fadeIn .6s ease-out"}}>
        <div style={{fontSize:64,marginBottom:8,animation:"float 3s ease-in-out infinite"}}>♜</div>
        <h1 style={{fontSize:32,color:"#e8d5b7",margin:0,fontWeight:700,letterSpacing:4}}>한국 장기</h1>
        <p style={{color:"#8892a4",fontSize:13,marginTop:6}}>100판 도전 모드</p>
      </div>
      <div style={{width:280,marginBottom:24,animation:"fadeIn .6s ease-out .1s both"}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#a8b4c8",marginBottom:4}}>
          <span>라운드 {rec.round}/100</span><span>{pct}%</span>
        </div>
        <div style={{height:8,borderRadius:4,background:"rgba(255,255,255,0.1)",overflow:"hidden"}}>
          <div style={{height:"100%",borderRadius:4,background:"linear-gradient(90deg,#d4a574,#e8d5b7)",width:`${pct}%`,transition:"width .5s"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#6b7a8d",marginTop:4}}>
          <span>🏆 {rec.wins}승</span><span>💀 {rec.losses}패</span><span>🔥 연승 {rec.streak} (최고 {rec.bestStreak})</span>
        </div>
      </div>
      <button className="bh" onClick={()=>setPhase("diff")} style={{width:260,padding:"16px 0",marginBottom:12,fontSize:18,fontWeight:600,color:"#1a1a2e",background:"linear-gradient(135deg,#e8d5b7,#d4a574)",border:"none",borderRadius:12,cursor:"pointer",boxShadow:"0 4px 15px rgba(212,165,116,0.3)",transition:"all .2s",animation:"fadeIn .6s ease-out .2s both"}}>
        🎮 도전 시작 (라운드 {rec.round})
      </button>
      <button className="bh" onClick={()=>setPhase("records")} style={{width:260,padding:"14px 0",marginBottom:12,fontSize:16,fontWeight:600,color:"#e8d5b7",background:"transparent",border:"2px solid rgba(232,213,183,0.3)",borderRadius:12,cursor:"pointer",transition:"all .2s",animation:"fadeIn .6s ease-out .3s both"}}>
        📊 전적 기록
      </button>
    </div>);
  }

  // DIFFICULTY
  if(phase==="diff"){
    return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:BG,fontFamily:"'Segoe UI',sans-serif",padding:20}}>
      <style>{CSS}</style>
      <div style={{textAlign:"center",marginBottom:28,animation:"fadeIn .4s ease-out"}}>
        <h2 style={{color:"#e8d5b7",fontSize:22,margin:"0 0 4px"}}>난이도 선택</h2>
        <p style={{color:"#8892a4",fontSize:13}}>라운드 {rec.round} — 난이도를 선택하세요</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,maxWidth:340,width:"100%"}}>
        {DIFF.map((d,i)=>(
          <div key={i} className="fc" onClick={()=>{setDiff(i);sa();sMove();setPhase("formation");}}
            style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${d.color}33`,borderRadius:12,padding:"20px 12px",textAlign:"center",animation:`fadeIn .4s ease-out ${i*.08}s both`}}>
            <div style={{fontSize:32,marginBottom:6}}>{d.label}</div>
            <div style={{fontSize:16,fontWeight:700,color:d.color}}>{d.name}</div>
            <div style={{fontSize:11,color:"#8892a4",marginTop:4}}>{d.desc}</div>
          </div>
        ))}
      </div>
      <button className="bh" onClick={resetAll} style={{marginTop:24,padding:"8px 20px",fontSize:13,color:"#8892a4",background:"transparent",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,cursor:"pointer",transition:"all .2s"}}>← 돌아가기</button>
    </div>);
  }

  // FORMATION
  if(phase==="formation"){
    return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:BG,fontFamily:"'Segoe UI',sans-serif",padding:20}}>
      <style>{CSS}</style>
      <div style={{textAlign:"center",marginBottom:28,animation:"fadeIn .4s ease-out"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,marginBottom:12,padding:"4px 12px",borderRadius:20,background:`${DIFF[diff].color}22`,border:`1px solid ${DIFF[diff].color}44`}}>
          <span>{DIFF[diff].label}</span><span style={{color:DIFF[diff].color,fontSize:13,fontWeight:700}}>{DIFF[diff].name}</span>
        </div>
        <h2 style={{color:"#e8d5b7",fontSize:20,margin:"0 0 4px"}}>초(楚) 마상 배치 선택</h2>
        <p style={{color:"#8892a4",fontSize:13}}>마(馬)와 상(象)의 위치를 선택하세요</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,maxWidth:360,width:"100%"}}>
        {FORMS.map((f,i)=>(
          <div key={i} className="fc" onClick={()=>{sMove();startGame(f.layout);}}
            style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:12,padding:"16px 12px",textAlign:"center",animation:`fadeIn .4s ease-out ${i*.08}s both`}}>
            <div style={{fontSize:15,fontWeight:700,color:"#e8d5b7",marginBottom:8}}>{f.name}</div>
            <MiniB layout={f.layout} team="cho" sz={26}/>
            <div style={{fontSize:11,color:"#8892a4",marginTop:8}}>{f.sub}</div>
          </div>
        ))}
      </div>
      <button className="bh" onClick={()=>setPhase("diff")} style={{marginTop:24,padding:"8px 20px",fontSize:13,color:"#8892a4",background:"transparent",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,cursor:"pointer",transition:"all .2s"}}>← 돌아가기</button>
    </div>);
  }

  // RECORDS
  if(phase==="records"){
    const wr=rec.wins+rec.losses>0?((rec.wins/(rec.wins+rec.losses))*100).toFixed(1):"0";
    return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",minHeight:"100vh",background:BG,fontFamily:"'Segoe UI',sans-serif",padding:20}}>
      <style>{CSS}</style>
      <h2 style={{color:"#e8d5b7",fontSize:22,margin:"20px 0 20px",animation:"fadeIn .4s ease-out"}}>📊 전적 기록</h2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,maxWidth:360,width:"100%",marginBottom:20,animation:"fadeIn .4s ease-out .1s both"}}>
        {[{l:"승리",v:rec.wins,c:"#4caf50"},{l:"패배",v:rec.losses,c:"#f44336"},{l:"승률",v:wr+"%",c:"#ff9800"}].map((x,i)=>(
          <div key={i} style={{background:"rgba(255,255,255,0.06)",borderRadius:10,padding:"14px 8px",textAlign:"center"}}>
            <div style={{fontSize:24,fontWeight:700,color:x.c}}>{x.v}</div>
            <div style={{fontSize:11,color:"#8892a4",marginTop:2}}>{x.l}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,maxWidth:360,width:"100%",marginBottom:20,animation:"fadeIn .4s ease-out .15s both"}}>
        <div style={{background:"rgba(255,255,255,0.06)",borderRadius:10,padding:"14px 8px",textAlign:"center"}}>
          <div style={{fontSize:20,fontWeight:700,color:"#e8d5b7"}}>🔥 {rec.streak}</div>
          <div style={{fontSize:11,color:"#8892a4",marginTop:2}}>현재 연승</div>
        </div>
        <div style={{background:"rgba(255,255,255,0.06)",borderRadius:10,padding:"14px 8px",textAlign:"center"}}>
          <div style={{fontSize:20,fontWeight:700,color:"#e8d5b7"}}>⭐ {rec.bestStreak}</div>
          <div style={{fontSize:11,color:"#8892a4",marginTop:2}}>최고 연승</div>
        </div>
      </div>
      <div style={{maxWidth:360,width:"100%",animation:"fadeIn .4s ease-out .2s both"}}>
        <div style={{fontSize:14,fontWeight:600,color:"#a8b4c8",marginBottom:8}}>최근 기록</div>
        {rec.history.length===0?<div style={{color:"#5a6577",fontSize:13,textAlign:"center",padding:20}}>기록이 없습니다</div>:
          <div style={{maxHeight:250,overflowY:"auto",borderRadius:8,background:"rgba(255,255,255,0.03)"}}>
            {rec.history.map((h,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:12,fontWeight:700,color:h.result==="승"?"#4caf50":h.result==="패"?"#f44336":"#ff9800"}}>{h.result}</span>
                  <span style={{fontSize:12,color:"#a8b4c8"}}>R{h.round}</span>
                  <span style={{fontSize:11,color:"#6b7a8d"}}>{DIFF[h.diff]?.label} {DIFF[h.diff]?.name}</span>
                </div>
                <span style={{fontSize:11,color:"#5a6577"}}>{h.date}</span>
              </div>
            ))}
          </div>
        }
      </div>
      <div style={{display:"flex",gap:10,marginTop:24}}>
        <button className="bh" onClick={resetAll} style={{padding:"10px 24px",fontSize:14,fontWeight:600,color:"#e8d5b7",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:10,cursor:"pointer",transition:"all .2s"}}>← 메뉴</button>
        <button className="bh" onClick={()=>{if(confirm("모든 기록을 삭제하시겠습니까?"))resetRecords();}} style={{padding:"10px 24px",fontSize:14,fontWeight:600,color:"#f44336",background:"rgba(244,67,54,0.08)",border:"1px solid rgba(244,67,54,0.2)",borderRadius:10,cursor:"pointer",transition:"all .2s"}}>🗑 초기화</button>
      </div>
    </div>);
  }

  if(!board)return null;

  // GAME
  return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",minHeight:"100vh",background:BG,fontFamily:"'Segoe UI',sans-serif",padding:"10px 0",userSelect:"none"}}>
    <style>{CSS}</style>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:cs*COLS+20,marginBottom:6}}>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <span style={{fontSize:11,color:"#6b7a8d"}}>R{rec.round}</span>
        <span style={{fontSize:11,padding:"2px 6px",borderRadius:10,background:`${DIFF[diff].color}22`,color:DIFF[diff].color}}>{DIFF[diff].label}{DIFF[diff].name}</span>
      </div>
      <div style={{display:"flex",gap:5}}>
        <button className="bh" onClick={undo} style={{padding:"5px 8px",fontSize:11,color:"#e8d5b7",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:6,cursor:"pointer"}}>↩</button>
        <button className="bh" onClick={goForm} style={{padding:"5px 8px",fontSize:11,color:"#e8d5b7",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:6,cursor:"pointer"}}>🔄</button>
        <button className="bh" onClick={resetAll} style={{padding:"5px 8px",fontSize:11,color:"#e8d5b7",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:6,cursor:"pointer"}}>🏠</button>
      </div>
    </div>

    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:cs*COLS+20,padding:"5px 10px",marginBottom:3,borderRadius:8,background:turn==="han"?"rgba(66,133,244,0.15)":"transparent",border:turn==="han"?"1px solid rgba(66,133,244,0.3)":"1px solid transparent",transition:"all .3s"}}>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <div style={{width:26,height:26,borderRadius:"50%",background:"#4285f4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",fontWeight:700}}>漢</div>
        <span style={{color:"#a8b4c8",fontSize:13,fontWeight:600}}>한 (漢) 🤖</span>
      </div>
      {turn==="han"&&!go&&<div style={{color:"#8892a4",fontSize:13,animation:"pulse 1s infinite"}}>생각 중...</div>}
    </div>

    <div style={{position:"relative",background:"linear-gradient(145deg,#d4a56a,#c49555)",borderRadius:10,padding:10,boxShadow:"0 8px 32px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.2)",animation:cf?"shake .4s ease-in-out":"none"}}>
      <svg width={cs*(COLS-1)+cs} height={cs*(ROWS-1)+cs} style={{position:"absolute",top:10,left:10,pointerEvents:"none"}}>
        {Array.from({length:ROWS},(_,r)=><line key={`h${r}`} x1={cs/2} y1={r*cs+cs/2} x2={cs*(COLS-1)+cs/2} y2={r*cs+cs/2} stroke="#8B6914" strokeWidth={1}/>)}
        {Array.from({length:COLS},(_,c)=><line key={`v${c}`} x1={c*cs+cs/2} y1={cs/2} x2={c*cs+cs/2} y2={cs*(ROWS-1)+cs/2} stroke="#8B6914" strokeWidth={1}/>)}
        <line x1={3*cs+cs/2} y1={cs/2} x2={5*cs+cs/2} y2={2*cs+cs/2} stroke="#8B6914" strokeWidth={1}/>
        <line x1={5*cs+cs/2} y1={cs/2} x2={3*cs+cs/2} y2={2*cs+cs/2} stroke="#8B6914" strokeWidth={1}/>
        <line x1={3*cs+cs/2} y1={7*cs+cs/2} x2={5*cs+cs/2} y2={9*cs+cs/2} stroke="#8B6914" strokeWidth={1}/>
        <line x1={5*cs+cs/2} y1={7*cs+cs/2} x2={3*cs+cs/2} y2={9*cs+cs/2} stroke="#8B6914" strokeWidth={1}/>
      </svg>
      <div style={{position:"relative",width:cs*COLS,height:cs*ROWS}}>
        {Array.from({length:ROWS},(_,r)=>Array.from({length:COLS},(_,c)=>{
          const p=board[r][c],iS=sel&&sel[0]===r&&sel[1]===c;
          const iV=vm.some(([a,b])=>a===r&&b===c);
          const iL=lm&&((lm.fr===r&&lm.fc===c)||(lm.tr===r&&lm.tc===c));
          const iAF=anim&&anim.fr===r&&anim.fc===c;
          const iCE=ce&&ce.r===r&&ce.c===c;
          return(<div key={`${r}-${c}`} onClick={()=>handleCell(r,c)} style={{position:"absolute",left:c*cs,top:r*cs,width:cs,height:cs,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",zIndex:iS?10:p?2:1}}>
            {iL&&<div style={{position:"absolute",width:cs*.7,height:cs*.7,borderRadius:"50%",background:"rgba(255,215,0,0.15)"}}/>}
            {iCE&&<div style={{position:"absolute",width:cs*.5,height:cs*.5,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,100,50,0.8),transparent)",animation:"captureExplode .4s ease-out forwards",pointerEvents:"none"}}/>}
            {iV&&!p&&<div style={{width:cs*.22,height:cs*.22,borderRadius:"50%",background:"rgba(76,175,80,0.7)",boxShadow:"0 0 8px rgba(76,175,80,0.5)",animation:"dotPulse 1.5s ease-in-out infinite"}}/>}
            {iV&&p&&<div style={{position:"absolute",width:cs*.9,height:cs*.9,borderRadius:"50%",border:"2.5px solid rgba(244,67,54,0.7)",animation:"pulse 1s infinite",pointerEvents:"none",zIndex:5}}/>}
            {p&&!iAF&&<Piece piece={p} cellSize={cs} isSel={iS} isTarget={iV}/>}
          </div>);
        }))}
        {arrow&&<Arrow fr={arrow.fr} fc={arrow.fc} tr={arrow.tr} tc={arrow.tc} cellSize={cs} piece={arrow.piece}/>}
        {anim&&(<div style={{position:"absolute",left:anim.tc*cs+(cs-cs*.86)/2,top:anim.tr*cs+(cs-cs*.86)/2,width:cs*.86,height:cs*.86,zIndex:50,pointerEvents:"none",transition:"left 3s cubic-bezier(.25,.46,.45,.94),top 3s cubic-bezier(.25,.46,.45,.94)"}}>
          <Piece piece={anim.piece} cellSize={cs} isSel={false} isTarget={false} style={{boxShadow:"0 6px 20px rgba(0,0,0,0.5)"}}/>
        </div>)}
      </div>
    </div>

    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:cs*COLS+20,padding:"5px 10px",marginTop:3,borderRadius:8,background:turn==="cho"?"rgba(198,40,40,0.15)":"transparent",border:turn==="cho"?"1px solid rgba(198,40,40,0.3)":"1px solid transparent",transition:"all .3s"}}>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <div style={{width:26,height:26,borderRadius:"50%",background:"#c62828",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",fontWeight:700}}>楚</div>
        <span style={{color:"#a8b4c8",fontSize:13,fontWeight:600}}>초 (楚) 나</span>
      </div>
      {turn==="cho"&&!go&&<div style={{color:timer<=10?"#ff6b6b":"#a8b4c8",fontSize:18,fontWeight:700,fontVariantNumeric:"tabular-nums",animation:timer<=10?"pulse 1s infinite":"none"}}>{timer}s</div>}
    </div>

    {chk&&!go&&(<div style={{marginTop:6,padding:"6px 16px",borderRadius:8,background:"rgba(255,107,107,0.15)",border:"1px solid rgba(255,107,107,0.3)",color:"#ff6b6b",fontWeight:700,fontSize:14,animation:"slideIn .3s ease-out"}}>⚠️ 장군!</div>)}

    {go&&(<div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.8)",zIndex:100}}>
      <div style={{background:"linear-gradient(135deg,#1a1a2e,#16213e)",borderRadius:16,padding:"36px 32px",textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,0.5)",border:"1px solid rgba(255,255,255,0.1)",animation:"fadeInScale .4s ease-out",maxWidth:320,width:"90%"}}>
        <div style={{fontSize:52,marginBottom:8}}>{go==="win"?"🏆":go==="lose"?"😢":"🤝"}</div>
        <h2 style={{color:go==="win"?"#4caf50":go==="lose"?"#f44336":"#ff9800",fontSize:22,margin:"0 0 4px"}}>{go==="win"?"승리!":go==="lose"?"패배...":"무승부"}</h2>
        <p style={{color:"#8892a4",fontSize:13,margin:"0 0 4px"}}>라운드 {go==="win"?rec.round-1:rec.round} · {DIFF[diff].label} {DIFF[diff].name}</p>
        {go==="draw"&&<p style={{color:"#8892a4",fontSize:12,margin:"0 0 8px"}}>반복수, 기물 부족, 또는 교착 상태</p>}
        {go==="win"&&rec.streak>1&&<p style={{color:"#ff9800",fontSize:13,margin:"0 0 12px"}}>🔥 {rec.streak}연승!</p>}
        <div style={{display:"flex",gap:8,marginTop:16,justifyContent:"center",flexWrap:"wrap"}}>
          <button className="bh" onClick={()=>{setPhase("diff");setBoard(null);setGo(null);}} style={{padding:"10px 22px",fontSize:15,fontWeight:600,color:"#1a1a2e",background:"linear-gradient(135deg,#e8d5b7,#d4a574)",border:"none",borderRadius:10,cursor:"pointer",transition:"all .2s"}}>다음 도전</button>
          <button className="bh" onClick={resetAll} style={{padding:"10px 22px",fontSize:15,fontWeight:600,color:"#e8d5b7",background:"transparent",border:"2px solid #e8d5b7",borderRadius:10,cursor:"pointer",transition:"all .2s"}}>🏠 메뉴</button>
        </div>
      </div>
    </div>)}
  </div>);
}
