import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CARD_STATUSES, COMPASS_NOTE_TYPES, THEMES, staleLevel } from '@lifeops/shared';

type Card = {id:string;title:string;period:string;theme:string;status:string;lastProgressMemoAt?:number|null};
const api = (p:string,o?:RequestInit)=>fetch(`/api${p}`,{credentials:'include',headers:{'Content-Type':'application/json'},...o}).then(r=>r.ok?r.json():Promise.reject(r));
function App(){const [authed,setAuthed]=useState(false); const [pwd,setPwd]=useState(''); const [cards,setCards]=useState<Card[]>([]); const [notes,setNotes]=useState<any[]>([]); const [rand,setRand]=useState<any>(null);
const load=()=>Promise.all([api('/cards').then(setCards),api('/compass-notes').then(setNotes)]);
useEffect(()=>{api('/auth/me').then(()=>{setAuthed(true);load();}).catch(()=>{});},[]);
useEffect(()=>{const id=setInterval(()=>{if(notes.length) setRand(notes[Math.floor(Math.random()*notes.length)]);},5000); return ()=>clearInterval(id);},[notes]);
if(!authed) return <div><h1>LifeOps Login</h1><input type='password' value={pwd} onChange={e=>setPwd(e.target.value)}/><button onClick={()=>api('/auth/login',{method:'POST',body:JSON.stringify({password:pwd})}).then(()=>{setAuthed(true);load();})}>Login</button></div>;
return <div><h2>Compass</h2><div>Rotating Note: {rand?`${rand.type}: ${rand.body}`:'no notes'}</div>
<h2>This Week Kanban</h2><div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>{CARD_STATUSES.map(s=><div key={s}><h3>{s}</h3>{cards.filter(c=>c.status===s).map(c=>{const level=staleLevel(c.lastProgressMemoAt?new Date(c.lastProgressMemoAt).toISOString():null); return <div key={c.id} style={{border:'1px solid #999',margin:4,padding:4,boxShadow:level==='strong'?'0 0 0 3px red':level==='warning'?'0 0 0 2px orange':'none'}}>{c.title} ({c.theme}) <select value={c.status} onChange={e=>api(`/cards/${c.id}`,{method:'PATCH',body:JSON.stringify({status:e.target.value})}).then(load)}>{CARD_STATUSES.map(v=><option key={v}>{v}</option>)}</select></div>})}</div>)}</div>
<h3>Quick Add</h3><QuickAdd onDone={load}/></div>}
function QuickAdd({onDone}:{onDone:()=>void}){const [title,setTitle]=useState(''); const [period,setPeriod]=useState('이번 주'); const [theme,setTheme]=useState(THEMES[0]); return <div><input placeholder='title' value={title} onChange={e=>setTitle(e.target.value)}/><input placeholder='period' value={period} onChange={e=>setPeriod(e.target.value)}/><select value={theme} onChange={e=>setTheme(e.target.value)}>{THEMES.map(t=><option key={t}>{t}</option>)}</select><button onClick={()=>api('/cards',{method:'POST',body:JSON.stringify({title,period,theme})}).then(onDone)}>Add</button></div>}
createRoot(document.getElementById('root')!).render(<App/>);
