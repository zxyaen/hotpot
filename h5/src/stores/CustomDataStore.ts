/**
 * 用户自定义食材 & 锅底 Store
 * 数据存于 localStorage，优先级高于内置数据
 */
import { Food, Pot } from '../types';

const FOODS_KEY = 'custom_foods_v1';
const POTS_KEY  = 'custom_pots_v1';

type Listener = () => void;

export class CustomDataStore {
  private _foods: Food[] = [];
  private _pots: Pot[]   = [];
  private _listeners: Listener[] = [];

  constructor() {
    this._load();
  }

  // ─── 食材 ───────────────────────────────────────────────────────

  getCustomFoods(): Food[] {
    return this._foods;
  }

  saveFood(food: Food) {
    const idx = this._foods.findIndex(f => f.id === food.id);
    if (idx >= 0) {
      this._foods[idx] = food;
    } else {
      this._foods.push(food);
    }
    this._saveFoods();
    this._notify();
  }

  deleteFood(id: string) {
    this._foods = this._foods.filter(f => f.id !== id);
    this._saveFoods();
    this._notify();
  }

  getFoodById(id: string): Food | undefined {
    return this._foods.find(f => f.id === id);
  }

  // ─── 锅底 ───────────────────────────────────────────────────────

  getCustomPots(): Pot[] {
    return this._pots;
  }

  savePot(pot: Pot) {
    const idx = this._pots.findIndex(p => p.id === pot.id);
    if (idx >= 0) {
      this._pots[idx] = pot;
    } else {
      this._pots.push(pot);
    }
    this._savePots();
    this._notify();
  }

  deletePot(id: string) {
    this._pots = this._pots.filter(p => p.id !== id);
    this._savePots();
    this._notify();
  }

  getPotById(id: string): Pot | undefined {
    return this._pots.find(p => p.id === id);
  }

  // ─── 订阅 ────────────────────────────────────────────────────────

  subscribe(fn: Listener): () => void {
    this._listeners.push(fn);
    return () => { this._listeners = this._listeners.filter(l => l !== fn); };
  }

  private _notify() {
    this._listeners.forEach(fn => fn());
  }

  // ─── 持久化 ──────────────────────────────────────────────────────

  private _saveFoods() {
    try { localStorage.setItem(FOODS_KEY, JSON.stringify(this._foods)); } catch {}
  }

  private _savePots() {
    try { localStorage.setItem(POTS_KEY, JSON.stringify(this._pots)); } catch {}
  }

  private _load() {
    try {
      const f = localStorage.getItem(FOODS_KEY);
      if (f) this._foods = JSON.parse(f);
    } catch {}
    try {
      const p = localStorage.getItem(POTS_KEY);
      if (p) this._pots = JSON.parse(p);
    } catch {}
  }
}
