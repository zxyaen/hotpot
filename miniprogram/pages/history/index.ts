// pages/history/index.ts
import { formatDate } from '../../utils/helpers';
import type { TimerStore } from '../../stores/timer-store';

const app = getApp<IAppOption>();

Page({
  data: {
    records: [] as any[],
  },

  onShow() {
    const store: TimerStore = app.globalData.timerStore;
    const records = store.history.map(r => ({
      ...r,
      dateText: formatDate(r.date),
      foodsText: r.foods.slice(0, 6).map(f => f.foodEmoji).join(' '),
    }));
    this.setData({ records });
  },

  onClearHistory() {
    wx.showModal({
      title: '确认清空历史',
      content: '清空后无法恢复',
      confirmColor: '#E74C3C',
      success: (res) => {
        if (res.confirm) {
          const store: TimerStore = app.globalData.timerStore;
          store.history = [];
          try { wx.removeStorageSync('timer_history_v1'); } catch {}
          this.setData({ records: [] });
        }
      }
    });
  },
});
