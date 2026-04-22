// pages/pot/index.ts
import { getAllPots } from '../../utils/builtin-data';
import type { TimerStore } from '../../stores/timer-store';
import type { RoomStore } from '../../stores/room-store';
import type { CustomDataStore } from '../../stores/custom-data-store';

const app = getApp<IAppOption>();

Page({
  data: {
    pots: [] as any[],
    currentPotId: '' as string | null,
    mode: 'solo' as 'solo' | 'room',
  },

  onLoad(query: any) {
    const mode = query?.mode === 'room' ? 'room' : 'solo';
    const store: TimerStore = app.globalData.timerStore;
    const roomStore: RoomStore = app.globalData.roomStore;

    const currentPotId = mode === 'room'
      ? (roomStore.currentRoom?.potId || '')
      : (store.currentPotId || '');

    this.setData({ currentPotId, mode });
    this.loadPots();
  },

  onShow() {
    // 从自定义页返回时刷新锅底列表
    this.loadPots();
  },

  loadPots() {
    const customStore: CustomDataStore = app.globalData.customDataStore;
    const customIds = new Set(customStore ? customStore.getCustomPots().map((p: Pot) => p.id) : []);
    const pots = getAllPots().map(p => ({ ...p, isCustom: customIds.has(p.id) }));
    this.setData({ pots });
  },

  onSelect(e: any) {
    const id = e.currentTarget.dataset.id;
    const { mode } = this.data;

    if (mode === 'room') {
      const roomStore: RoomStore = app.globalData.roomStore;
      roomStore.setPot(id);
    } else {
      const store: TimerStore = app.globalData.timerStore;
      store.setPot(id);
    }

    this.setData({ currentPotId: id });
    wx.showToast({ title: '已设置锅底', icon: 'success', duration: 800 });
    setTimeout(() => wx.navigateBack(), 600);
  },

  /** 长按 — 若为自定义锅底则跳转编辑 */
  onLongPressPot(e: any) {
    const id = e.currentTarget.dataset.id;
    const customStore: CustomDataStore = app.globalData.customDataStore;
    if (customStore && customStore.getPotById(id)) {
      wx.navigateTo({ url: `/pages/custom-pot/index?id=${id}` });
    }
  },

  onAddCustomPot() {
    wx.navigateTo({ url: '/pages/custom-pot/index' });
  },
});
