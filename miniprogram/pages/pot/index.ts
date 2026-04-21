// pages/pot/index.ts
import { getAllPots } from '../../utils/builtin-data';
import type { TimerStore } from '../../stores/timer-store';

const app = getApp<IAppOption>();

Page({
  data: {
    pots: [] as Pot[],
    currentPotId: '' as string | null,
  },

  onLoad() {
    const store: TimerStore = app.globalData.timerStore;
    this.setData({
      pots: getAllPots(),
      currentPotId: store.currentPotId || '',
    });
  },

  onSelect(e: any) {
    const id = e.currentTarget.dataset.id;
    const store: TimerStore = app.globalData.timerStore;
    store.setPot(id);
    this.setData({ currentPotId: id });
    wx.vibrateShort({ type: 'light', fail: () => {} });
    wx.showToast({ title: '已设置锅底', icon: 'success', duration: 800 });
    setTimeout(() => wx.navigateBack(), 600);
  },
});
