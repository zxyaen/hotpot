// pages/home/index.ts
import { formatCountdown, formatDuration } from '../../utils/helpers';
import { getPotById } from '../../utils/builtin-data';
import type { TimerStore } from '../../stores/timer-store';

const app = getApp<IAppOption>();

Page({
  data: {
    timers: [] as any[],
    currentPot: null as Pot | null,
    runningCount: 0,
    showAlertModal: false,
    alertTimer: null as TimerItem | null,
  },

  unsubscribe: null as null | (() => void),

  onLoad() {
    const store: TimerStore = app.globalData.timerStore;
    // 到时提醒回调
    store.onTimerEnd((timer) => {
      this.setData({
        showAlertModal: true,
        alertTimer: timer,
      });
    });

    this.unsubscribe = store.subscribe(() => this.refresh());
    this.refresh();
  },

  onShow() {
    this.refresh();
  },

  onUnload() {
    if (this.unsubscribe) this.unsubscribe();
  },

  refresh() {
    const store: TimerStore = app.globalData.timerStore;
    const pot = store.currentPotId ? getPotById(store.currentPotId) : null;

    const timersView = store.timers.map((t) => {
      const remaining = store.getRemaining(t);
      const total = t.duration;
      const elapsed = total - remaining;
      const progress = Math.min(100, Math.round((elapsed / total) * 100));
      const isOver = remaining <= 0 && t.status === 'running';

      return {
        ...t,
        remaining,
        remainingText: formatCountdown(remaining),
        progressPercent: progress,
        totalText: formatDuration(total),
        isOver,
        // 状态标签
        statusText:
          t.status === 'done' ? '已完成' :
          t.status === 'cancelled' ? '已取消' :
          isOver ? '⚠ 到时了' : '涮煮中',
        statusClass:
          t.status === 'done' ? 'status-done' :
          t.status === 'cancelled' ? 'status-cancelled' :
          isOver ? 'status-over' : 'status-running',
      };
    });

    this.setData({
      timers: timersView,
      currentPot: pot,
      runningCount: store.runningCount,
    });
  },

  onSelectPot() {
    wx.navigateTo({ url: '/pages/pot/index' });
  },

  onAddFood() {
    wx.navigateTo({ url: '/pages/foods/index' });
  },

  onCancelTimer(e: any) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '取消计时',
      content: '确定要取消这个计时吗？',
      success: (res) => {
        if (res.confirm) {
          const store: TimerStore = app.globalData.timerStore;
          store.cancelTimer(id);
        }
      },
    });
  },

  onRemoveTimer(e: any) {
    const id = e.currentTarget.dataset.id;
    const store: TimerStore = app.globalData.timerStore;
    store.removeTimer(id);
  },

  onConfirmDone(e: any) {
    const id = e.currentTarget.dataset.id;
    const store: TimerStore = app.globalData.timerStore;
    store.completeTimer(id);
  },

  onClearFinished() {
    const store: TimerStore = app.globalData.timerStore;
    store.clearFinished();
  },

  onClearAll() {
    wx.showModal({
      title: '结束本次涮火锅',
      content: '将保存到历史记录并清空当前列表',
      success: (res) => {
        if (res.confirm) {
          const store: TimerStore = app.globalData.timerStore;
          store.clearAll();
          wx.showToast({ title: '已保存到历史', icon: 'success' });
        }
      },
    });
  },

  onAlertClose() {
    this.setData({ showAlertModal: false, alertTimer: null });
  },

  onAlertConfirm() {
    const timer = this.data.alertTimer;
    if (timer) {
      const store: TimerStore = app.globalData.timerStore;
      store.completeTimer(timer.id);
    }
    this.setData({ showAlertModal: false, alertTimer: null });
  },

  onShareAppMessage() {
    return {
      title: '🔥 来涮火锅啦！加入我的同桌',
      path: '/pages/home/index',
    };
  },
});
