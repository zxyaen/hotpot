/**
 * 用户自定义食材 & 锅底 Store
 * 数据存于微信 localStorage，优先级高于远端数据库
 */

const FOODS_KEY = 'custom_foods_v1';
const POTS_KEY = 'custom_pots_v1';

export class CustomDataStore {
  private _foods: Food[] = [];
  private _pots: Pot[] = [];

  constructor() {
    this.loadFromStorage();
  }

  // ─── 食材 ───────────────────────────────────────────────

  getCustomFoods(): Food[] {
    return this._foods;
  }

  /** 新增或更新自定义食材（以 id 为唯一键） */
  saveFood(food: Food) {
    const idx = this._foods.findIndex(f => f.id === food.id);
    if (idx >= 0) {
      this._foods[idx] = food;
    } else {
      this._foods.push(food);
    }
    this._saveFoods();
  }

  deleteFood(id: string) {
    this._foods = this._foods.filter(f => f.id !== id);
    this._saveFoods();
  }

  getFoodById(id: string): Food | undefined {
    return this._foods.find(f => f.id === id);
  }

  // ─── 锅底 ───────────────────────────────────────────────

  getCustomPots(): Pot[] {
    return this._pots;
  }

  /** 新增或更新自定义锅底 */
  savePot(pot: Pot) {
    const idx = this._pots.findIndex(p => p.id === pot.id);
    if (idx >= 0) {
      this._pots[idx] = pot;
    } else {
      this._pots.push(pot);
    }
    this._savePots();
  }

  deletePot(id: string) {
    this._pots = this._pots.filter(p => p.id !== id);
    this._savePots();
  }

  getPotById(id: string): Pot | undefined {
    return this._pots.find(p => p.id === id);
  }

  // ─── 持久化 ─────────────────────────────────────────────

  private _saveFoods() {
    try {
      wx.setStorageSync(FOODS_KEY, this._foods);
    } catch {}
  }

  private _savePots() {
    try {
      wx.setStorageSync(POTS_KEY, this._pots);
    } catch {}
  }

  loadFromStorage() {
    try {
      const foods = wx.getStorageSync(FOODS_KEY);
      if (Array.isArray(foods)) this._foods = foods;
    } catch {}
    try {
      const pots = wx.getStorageSync(POTS_KEY);
      if (Array.isArray(pots)) this._pots = pots;
    } catch {}
  }
}
