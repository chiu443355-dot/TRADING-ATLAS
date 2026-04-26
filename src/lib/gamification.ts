export interface Badge {
  id: string; name: string; description: string;
  icon: string; rarity: 'common' | 'rare' | 'legendary'; xp: number;
}

export interface UserState {
  xp: number; level: number; streak: number;
  lastActiveDate: string; longestStreak: number;
  completedChapters: number[]; earnedBadges: string[];
  shareCount: number; calcUsed: string[];
}

export const BADGES: Badge[] = [
  { id:'first_step', name:'First Step', description:'Completed Chapter 1', icon:'🌱', rarity:'common', xp:50 },
  { id:'market_reader', name:'Market Reader', description:'Understand market structure', icon:'📈', rarity:'common', xp:75 },
  { id:'calculator_pro', name:'Calculator Pro', description:'Used all 5 calculators', icon:'🧮', rarity:'common', xp:100 },
  { id:'streak_3', name:'3-Day Streak', description:'3 consecutive days of learning', icon:'🔥', rarity:'common', xp:50 },
  { id:'streak_7', name:'Weekly Warrior', description:'7 consecutive days', icon:'🔥', rarity:'rare', xp:150 },
  { id:'streak_30', name:'Monthly Master', description:'30 consecutive days', icon:'💫', rarity:'legendary', xp:500 },
  { id:'quiz_perfect', name:'Perfect Score', description:'100% on any quiz', icon:'⭐', rarity:'rare', xp:200 },
  { id:'smart_money', name:'Smart Money', description:'Completed Chapter 8', icon:'🏦', rarity:'rare', xp:200 },
  { id:'the_complete', name:'WikiWiz Complete', description:'All 16 chapters finished', icon:'🧠', rarity:'legendary', xp:1000 },
  { id:'sharer', name:'Knowledge Sharer', description:'Shared a calculator result', icon:'📤', rarity:'common', xp:25 },
];

const STORAGE_KEY = 'wikwiz_state_v1';
const XP_PER_LEVEL = 1000;

export function defaultState(): UserState {
  return { xp:0, level:1, streak:0, lastActiveDate:'', longestStreak:0,
    completedChapters:[], earnedBadges:[], shareCount:0, calcUsed:[] };
}

export function loadState(): UserState {
  if (typeof localStorage === 'undefined') return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultState(), ...JSON.parse(raw) } : defaultState();
  } catch { return defaultState(); }
}

export function saveState(state: UserState): void {
  if (typeof localStorage !== 'undefined')
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function addXP(state: UserState, amount: number): UserState {
  const newXP = state.xp + amount;
  return { ...state, xp: newXP, level: Math.floor(newXP / XP_PER_LEVEL) + 1 };
}

export function updateStreak(state: UserState): UserState {
  const today = new Date().toISOString().split('T')[0];
  if (state.lastActiveDate === today) return state;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const newStreak = state.lastActiveDate === yesterday ? state.streak + 1 : 1;
  return { ...state, streak: newStreak, longestStreak: Math.max(newStreak, state.longestStreak), lastActiveDate: today };
}

export function unlockBadge(state: UserState, badgeId: string): { state: UserState; badge: Badge | null } {
  if (state.earnedBadges.includes(badgeId)) return { state, badge: null };
  const badge = BADGES.find(b => b.id === badgeId);
  if (!badge) return { state, badge: null };
  const newState = addXP({ ...state, earnedBadges: [...state.earnedBadges, badgeId] }, badge.xp);
  return { state: newState, badge };
}

export function checkStreakBadges(state: UserState): { state: UserState; newBadges: Badge[] } {
  const newBadges: Badge[] = [];
  let cur = state;
  const tryUnlock = (id: string) => {
    const { state: next, badge } = unlockBadge(cur, id);
    if (badge) { cur = next; newBadges.push(badge); }
  };
  if (cur.streak >= 3) tryUnlock('streak_3');
  if (cur.streak >= 7) tryUnlock('streak_7');
  if (cur.streak >= 30) tryUnlock('streak_30');
  return { state: cur, newBadges };
}
