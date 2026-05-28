export const CARD_STATUSES = ["Todo", "Ready", "In Progress", "Done"] as const;
export type CardStatus = (typeof CARD_STATUSES)[number];

export const CARD_PERIODS = ["이번 주", "3개월", "언젠가"] as const;
export type CardPeriod = (typeof CARD_PERIODS)[number];

export const THEMES = ["공부","커리어","여행","가사","사무","운동","돈","영상/유튜브","외모/옷","일본어","인간관계","기타"] as const;
export type Theme = (typeof THEMES)[number];

export const COMPASS_NOTE_TYPES = ["이번 달 의식", "좋은 말", "원칙", "태도"] as const;
export type CompassNoteType = (typeof COMPASS_NOTE_TYPES)[number];

export type StaleLevel = "normal"|"warning"|"strong";
export function staleLevel(lastProgressMemoAt?: string | number | Date | null, now = new Date()): StaleLevel {
  if (!lastProgressMemoAt) return "strong";
  const date = lastProgressMemoAt instanceof Date ? lastProgressMemoAt : new Date(lastProgressMemoAt);
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays >= 14) return "strong";
  if (diffDays >= 7) return "warning";
  return "normal";
}
