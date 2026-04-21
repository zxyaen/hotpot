// pages/pot/index.ts
import { getAllPots } from '../../utils/builtin-data';
import type { TimerStore } from '../../stores/timer-store';
import type { RoomStore } from '../../stores/room-store';

const app = getApp<IAppOption>();

Page({
  data: {
    pots: [] as Pot[],
    currentPotId: '' as string | null,
    mode: 'solo' as 'solo' | 'room', // solo=单机, room=多人同步
  },

  onLoad(query: any) {
    const mode = query?.mode === 'room' ? 'room' : 'solo';
    const store: TimerStore = app.globalData.timerStore;
    const roomStore: RoomStore = app.globalData.roomStore;

    const currentPotId = mode === 'room'
      ? (roomStore.currentRoom?.potId || '')
      : (store.currentPotId || '');

    this.setData({
      pots: getAllPots(),
      currentPotId,
      mode,
    });
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
    wx.vibrateShort({ type: 'light', fail: () => {} });
    wx.showToast({ title: '已设置锅底', icon: 'success', duration: 800 });
    setTimeout(() => wx.navigateBack(), 600);
  },
});
