/**
 * 计时器 Store (H5版)
 * 用 EventEmitter 模式实现，供 React Context 使用
 */
import { TimerItem, HistoryRecord } from '../types';
import { uuid } from '../utils/helpers';
import { getFoodById, getPotById, adjustTimeByPot } from '../utils/builtinData';

const STORAGE_KEY = 'hotpot_timer_store_v1';
const HISTORY_KEY = 'hotpot_timer_history_v1';
const MAX_TIMERS = 8;

type Listener = () => void;
type TimerEndHandler = (timer: TimerItem) => void;

export class TimerStore {
  timers: TimerItem[] = [];
  currentPotId: string | null = null;
  history: HistoryRecord[] = [];
  private listeners: Listener[] = [];
  private endHandlers: TimerEndHandler[] = [];
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private alertedIds = new Set<string>();

  constructor() {
    this.loadFromStorage();
    this.startTick();
  }

  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  onTimerEnd(handler: TimerEndHandler) {
    this.endHandlers.push(handler);
    return () => {
      this.endHandlers = this.endHandlers.filter(h => h !== handler);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  setPot(potId: string | null) {
    this.currentPotId = potId;
    this.saveToStorage();
    this.notify();
  }

  // 返回 null 时表示超出上限（调用方负责提示）
  addTimer(foodId: string, timePreference: 'min' | 'recommended' | 'max' = 'recommended'): TimerItem | null {
    if (this.runningCount >= MAX_TIMERS) {
      return null; // 不再用 alert()，由调用方处理
    }
    const food = getFoodById(foodId);
    if (!food) return null;

    let baseTime: number;
    if (timePreference === 'min') baseTime = food.cookTime.min;
    else if (timePreference === 'max') baseTime = food.cookTime.max;
    else baseTime = food.cookTime.recommended;

    const duration = adjustTimeByPot(baseTime, this.currentPotId);

    const timer: TimerItem = {
      id: uuid(),
      foodId: food.id,
      foodName: food.name,
      foodEmoji: food.emoji,
      startAt: Date.now(),
      duration,
      status: 'running',
    };

    this.timers.unshift(timer);
    this.saveToStorage();
    this.notify();
    return timer;
  }

  cancelTimer(id: string) {
    const t = this.timers.find(x => x.id === id);
    if (!t || t.status !== 'running') return;
    t.status = 'cancelled';
    this.saveToStorage();
    this.notify();
  }

  removeTimer(id: string) {
    this.timers = this.timers.filter(t => t.id !== id);
    this.alertedIds.delete(id);
    this.saveToStorage();
    this.notify();
  }

  completeTimer(id: string) {
    const t = this.timers.find(x => x.id === id);
    if (!t) return;
    t.status = 'done';
    this.saveToStorage();
    this.notify();
  }

  clearFinished() {
    this.timers = this.timers.filter(t => t.status === 'running');
    this.saveToStorage();
    this.notify();
  }

  clearAll() {
    this.saveToHistory();
    this.timers = [];
    this.alertedIds.clear();
    this.saveToStorage();
    this.notify();
  }

  get runningCount(): number {
    return this.timers.filter(t => t.status === 'running').length;
  }

  getRemaining(timer: TimerItem): number {
    if (timer.status !== 'running') return 0;
    const elapsed = Math.floor((Date.now() - timer.startAt) / 1000);
    return Math.max(0, timer.duration - elapsed);
  }

  private startTick() {
    this.tickTimer = setInterval(() => {
      let changed = false;
      for (const t of this.timers) {
        if (t.status !== 'running') continue;
        const remaining = this.getRemaining(t);
        if (remaining <= 0 && !this.alertedIds.has(t.id)) {
          this.alertedIds.add(t.id);
          this.endHandlers.forEach(h => h(t));
          changed = true;
        }
      }
      if (changed || this.timers.some(t => t.status === 'running')) {
        this.notify();
      }
    }, 1000);
  }

  destroy() {
    if (this.tickTimer) clearInterval(this.tickTimer);
  }

  private saveToHistory() {
    if (this.timers.length === 0) return;
    const firstStartAt = Math.min(...this.timers.map(t => t.startAt));
    const pot = this.currentPotId ? getPotById(this.currentPotId) : null;
    const record: HistoryRecord = {
      id: uuid(),
      date: Date.now(),
      potId: this.currentPotId || '',
      potName: pot ? pot.name : '未选择锅底',
      foodCount: this.timers.length,
      durationMin: Math.round((Date.now() - firstStartAt) / 60000),
      foods: this.timers.map(t => ({ foodName: t.foodName, foodEmoji: t.foodEmoji })),
    };
    this.history.unshift(record);
    this.history = this.history.slice(0, 50);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history)); } catch {}
  }

  saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        timers: this.timers,
        currentPotId: this.currentPotId,
      }));
    } catch {}
  }

  loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        this.timers = data.timers || [];
        this.currentPotId = data.currentPotId || null;
        for (const t of this.timers) {
          if (t.status === 'running' && this.getRemaining(t) <= 0) {
            this.alertedIds.add(t.id);
          }
        }
      }
      const histRaw = localStorage.getItem(HISTORY_KEY);
      if (histRaw) this.history = JSON.parse(histRaw);
    } catch {}
  }
}
