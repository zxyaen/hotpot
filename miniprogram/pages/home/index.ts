// pages/home/index.ts
import { formatCountdown, formatDuration } from '../../utils/helpers';
import { getPotById } from '../../utils/builtin-data';
import type { TimerStore } from '../../stores/timer-store';

const app = getApp<IAppOption>();

Page({
  data: {
    timers: [] as any[],
    runningTimers: [] as any[],
    currentPot: null as Pot | null,
    runningCount: 0,
    showAlertModal: false,
    alertTimer: null as TimerItem | null,
    // 批量模式
    batchMode: false,
    selectedIds: [] as string[],
  },

  unsubscribe: null as null | (() => void),

  onLoad() {
    const store: TimerStore = app.globalData.timerStore;
    if (!store) return;
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
    if (!store) return;
    const pot = store.currentPotId ? getPotById(store.currentPotId) : null;
    const selectedIds = this.data.selectedIds;

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
        isSelected: selectedIds.includes(t.id),
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

    const runningTimers = timersView.filter(t => t.status === 'running' && !t.isOver);

    this.setData({
      timers: timersView,
      runningTimers,
      currentPot: pot,
      runningCount: store.runningCount,
    });
  },

  /** 仅刷新选中状态（不重新计算所有计时器，避免倒计时闪烁） */
  refreshSelected() {
    const selectedIds = this.data.selectedIds;
    const timers = this.data.timers.map((t: any) => ({
      ...t,
      isSelected: selectedIds.includes(t.id),
    }));
    this.setData({ timers });
  },

  onSelectPot() {
    wx.navigateTo({ url: '/pages/pot/index' });
  },

  onAddFood() {
    wx.switchTab({ url: '/pages/foods/index' });
  },

  // 卡片点击：批量模式下切换选中，普通模式不处理
  onCardTap(e: any) {
    if (!this.data.batchMode) return;
    const id = e.currentTarget.dataset.id;
    const status = e.currentTarget.dataset.status;
    const isOver = e.currentTarget.dataset.isover;
    if (status !== 'running' || isOver) return;

    const selected = [...this.data.selectedIds];
    const idx = selected.indexOf(id);
    if (idx >= 0) {
      selected.splice(idx, 1);
    } else {
      selected.push(id);
    }
    this.setData({ selectedIds: selected });
    this.refreshSelected();
  },

  // 进入批量模式
  onEnterBatch() {
    this.setData({ batchMode: true, selectedIds: [] });
    this.refreshSelected();
  },

  // 退出批量模式
  onExitBatch() {
    this.setData({ batchMode: false, selectedIds: [] });
    this.refreshSelected();
  },

  // 全选 / 取消全选
  onSelectAll() {
    const runningIds = this.data.runningTimers.map((t: any) => t.id);
    const allSelected = this.data.selectedIds.length === runningIds.length;
    this.setData({ selectedIds: allSelected ? [] : runningIds });
    this.refreshSelected();
  },

  // 批量取消
  onBatchCancel() {
    const ids = this.data.selectedIds;
    if (ids.length === 0) return;
    wx.showModal({
      title: '批量取消计时',
      content: `确定取消 ${ids.length} 个正在计时的食材？`,
      success: (res) => {
        if (res.confirm) {
          const store: TimerStore = app.globalData.timerStore;
          ids.forEach(id => store.cancelTimer(id));
          this.setData({ batchMode: false, selectedIds: [] });
          wx.showToast({ title: `已取消 ${ids.length} 个`, icon: 'none' });
        }
      },
    });
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
          this.setData({ batchMode: false, selectedIds: [] });
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
