import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { CARD_PERIODS, CARD_STATUSES, THEMES, staleLevel } from "@lifeops/shared";

type Card = { id: string; title: string; period: string; theme: string; status: string; createdAt: number; lastProgressMemoAt?: number | null };
type Note = { id: string; type: string; body: string; enabled: boolean };

async function apiJson<T>(p: string, o?: RequestInit): Promise<T> {
  const res = await fetch(`/api${p}`, { credentials: "include", headers: { "Content-Type": "application/json" }, ...o });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function App() {
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState("");
  const [cards, setCards] = useState<Card[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [rand, setRand] = useState<Note | null>(null);

  const load = () => Promise.all([apiJson<Card[]>("/cards").then(setCards), apiJson<Note[]>("/compass-notes").then(setNotes)]);

  useEffect(() => {
    apiJson("/auth/me").then(() => { setAuthed(true); load(); }).catch(() => undefined);
  }, []);

  useEffect(() => {
    const enabled = notes.filter((n) => n.enabled);
    if (!enabled.length) return;
    setRand(enabled[Math.floor(Math.random() * enabled.length)]);
    const id = setInterval(() => setRand(enabled[Math.floor(Math.random() * enabled.length)]), 5000);
    return () => clearInterval(id);
  }, [notes]);

  if (!authed) return <div><h1>LifeOps Login</h1><input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} /><button onClick={() => apiJson("/auth/login", { method: "POST", body: JSON.stringify({ password: pwd }) }).then(() => { setAuthed(true); load(); })}>Login</button></div>;

  return <div>
    <h2>Compass</h2>
    <div>Rotating Note: {rand ? `${rand.type}: ${rand.body}` : "no enabled notes"}</div>

    <h2>This Week Kanban</h2>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
      {CARD_STATUSES.map((status) => <KanbanColumn key={status} status={status} cards={cards.filter((c) => c.period === "이번 주" && c.status === status)} onDropCard={(id) => apiJson(`/cards/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }).then(load)} />)}
    </div>

    <h3>Quick Add</h3>
    <QuickAdd onDone={load} />
  </div>;
}

function KanbanColumn({ status, cards, onDropCard }: { status: string; cards: Card[]; onDropCard: (id: string) => void }) {
  return <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain"); if (id) onDropCard(id); }} style={{ minHeight: 220, border: "1px solid #ddd", padding: 8 }}>
    <h3>{status}</h3>
    {cards.map((c) => {
      const level = staleLevel(c.lastProgressMemoAt ?? c.createdAt);
      return <div key={c.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", c.id)} style={{ border: "1px solid #999", margin: 4, padding: 4, boxShadow: level === "strong" ? "0 0 0 3px red" : level === "warning" ? "0 0 0 2px orange" : "none" }}>{c.title} ({c.theme})</div>;
    })}
  </div>;
}

function QuickAdd({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [period, setPeriod] = useState<(typeof CARD_PERIODS)[number]>("이번 주");
  const [theme, setTheme] = useState(THEMES[0]);
  return <div><input placeholder="title" value={title} onChange={(e) => setTitle(e.target.value)} /><select value={period} onChange={(e) => setPeriod(e.target.value as (typeof CARD_PERIODS)[number])}>{CARD_PERIODS.map((p) => <option key={p}>{p}</option>)}</select><select value={theme} onChange={(e) => setTheme(e.target.value)}>{THEMES.map((t) => <option key={t}>{t}</option>)}</select><button onClick={() => apiJson("/cards", { method: "POST", body: JSON.stringify({ title, period, theme }) }).then(onDone)}>Add</button></div>;
}

createRoot(document.getElementById("root")!).render(<App />);
