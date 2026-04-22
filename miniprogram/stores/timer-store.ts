/**
 * 计时器 Store - 核心业务逻辑
 * 使用发布订阅模式（不引入 MobX，简化依赖）
 */

import { uuid, playAlert } from '../utils/helpers';
import { getFoodById, getPotById, adjustTimeByPot } from '../utils/builtin-data';

const STORAGE_KEY = 'timer_store_v1';
const HISTORY_KEY = 'timer_history_v1';
const MAX_TIMERS = 8; // 最多同时计时

type Listener = () => void;

interface TimerEndHandler {
  (timer: TimerItem): void;
}

export class TimerStore {
  timers: TimerItem[] = [];
  currentPotId: string | null = null;
  history: HistoryRecord[] = [];
  private listeners: Listener[] = [];
  private endHandlers: TimerEndHandler[] = [];
  private tickTimer: number = 0;
  // 已触发到时事件的计时器 id 集合，避免重复提醒
  private alertedIds = new Set<string>();

  constructor() {
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
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  /**
   * 设置锅底
   */
  setPot(potId: string | null) {
    this.currentPotId = potId;
    this.saveToStorage();
    this.notify();
  }

  /**
   * 添加计时（会根据锅底和时间偏好自动调整时间）
   */
  addTimer(foodId: string, timePreference: 'min' | 'recommended' | 'max' = 'recommended', customDuration?: number): TimerItem | null {
    if (this.runningCount >= MAX_TIMERS) {
      wx.showToast({ title: '同时最多计时8个', icon: 'none' });
      return null;
    }
    const food = getFoodById(foodId);
    if (!food) return null;

    // 根据时间偏好选择基础时间
    let baseTime: number;
    if (customDuration !== undefined) {
      baseTime = customDuration;
    } else {
      if (timePreference === 'min') baseTime = food.cookTime.min;
      else if (timePreference === 'max') baseTime = food.cookTime.max;
      else baseTime = food.cookTime.recommended;
    }

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

    // 开启屏幕常亮
    wx.setKeepScreenOn({ keepScreenOn: true, fail: () => {} });

    return timer;
  }

  /**
   * 取消计时
   */
  cancelTimer(id: string) {
    const t = this.timers.find(x => x.id === id);
    if (!t) return;
    t.status = 'cancelled';
    this.saveToStorage();
    this.notify();
    this.checkKeepScreenOn();
  }

  /**
   * 删除计时（从列表移除）
   */
  removeTimer(id: string) {
    this.timers = this.timers.filter(t => t.id !== id);
    this.alertedIds.delete(id);
    this.saveToStorage();
    this.notify();
    this.checkKeepScreenOn();
  }

  /**
   * 完成计时（到时或手动确认）
   */
  completeTimer(id: string) {
    const t = this.timers.find(x => x.id === id);
    if (!t) return;
    t.status = 'done';
    this.saveToStorage();
    this.notify();
    this.checkKeepScreenOn();
  }

  /**
   * 清空已完成/已取消的
   */
  clearFinished() {
    this.timers = this.timers.filter(t => t.status === 'running');
    this.saveToStorage();
    this.notify();
  }

  /**
   * 清空所有
   */
  clearAll() {
    // 保存到历史
    this.saveToHistory();
    this.timers = [];
    this.alertedIds.clear();
    this.saveToStorage();
    this.notify();
    wx.setKeepScreenOn({ keepScreenOn: false, fail: () => {} });
  }

  /**
   * 运行中的数量
   */
  get runningCount(): number {
    return this.timers.filter(t => t.status === 'running').length;
  }

  /**
   * 获取计时器剩余秒数（> 0 表示还在倒计时）
   */
  getRemaining(timer: TimerItem): number {
    if (timer.status !== 'running') return 0;
    const elapsed = Math.floor((Date.now() - timer.startAt) / 1000);
    return Math.max(0, timer.duration - elapsed);
  }

  /**
   * 心跳 tick - 每秒检查
   */
  private startTick() {
    this.tickTimer = setInterval(() => {
      let changed = false;
      for (const t of this.timers) {
        if (t.status !== 'running') continue;
        const remaining = this.getRemaining(t);
        if (remaining <= 0 && !this.alertedIds.has(t.id)) {
          this.alertedIds.add(t.id);
          this.triggerAlert(t);
          changed = true;
        }
      }
      if (changed || this.timers.some(t => t.status === 'running')) {
        this.notify();
      }
    }, 1000) as unknown as number;
  }

  private triggerAlert(timer: TimerItem) {
    playAlert();
    this.endHandlers.forEach(h => h(timer));
  }

  /**
   * 从后台回到前台时刷新（重新计算是否有已到时）
   */
  refreshOnForeground() {
    for (const t of this.timers) {
      if (t.status !== 'running') continue;
      const remaining = this.getRemaining(t);
      if (remaining <= 0 && !this.alertedIds.has(t.id)) {
        this.alertedIds.add(t.id);
        this.triggerAlert(t);
      }
    }
    this.notify();
  }

  private checkKeepScreenOn() {
    if (this.runningCount === 0) {
      wx.setKeepScreenOn({ keepScreenOn: false, fail: () => {} });
    }
  }

  /**
   * 保存历史记录
   */
  private saveToHistory() {
    const doneList = this.timers.filter(t => t.status === 'done' || (t.status === 'running' && this.getRemaining(t) <= 0));
    if (doneList.length === 0) return;

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
    // 最多保留 50 条
    this.history = this.history.slice(0, 50);
    try {
      wx.setStorageSync(HISTORY_KEY, this.history);
    } catch {}
  }

  /**
   * 持久化
   */
  saveToStorage() {
    try {
      wx.setStorageSync(STORAGE_KEY, {
        timers: this.timers,
        currentPotId: this.currentPotId,
      });
    } catch {}
  }

  loadFromStorage() {
    try {
      const data = wx.getStorageSync(STORAGE_KEY);
      if (data) {
        this.timers = data.timers || [];
        this.currentPotId = data.currentPotId || null;
        // 恢复时标记已过期的为已触发（避免重新震动）
        for (const t of this.timers) {
          if (t.status === 'running' && this.getRemaining(t) <= 0) {
            this.alertedIds.add(t.id);
          }
        }
      }
      const history = wx.getStorageSync(HISTORY_KEY);
      if (history) this.history = history;
    } catch {}
  }
}
