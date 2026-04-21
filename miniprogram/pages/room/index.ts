// pages/room/index.ts
import { formatCountdown } from '../../utils/helpers';
import { getPotById, adjustTimeByPot } from '../../utils/builtin-data';
import { WS_BASE } from '../../utils/config';
import type { RoomStore, RoomTimer, RoomMember } from '../../stores/room-store';

const app = getApp<IAppOption>();

type RoomView = 'lobby' | 'room';

Page({
  data: {
    view: 'lobby' as RoomView,       // lobby=大厅, room=在房间中
    // ── 大厅 ──
    nickname: '',
    avatar: '🍲',
    joinCode: '',                     // 加入时输入的房间码
    wsUrl: WS_BASE,                  // 服务器地址（从 utils/config.ts 读取）
    showSettings: false,             // 显示服务器地址设置

    // ── 连接状态 ──
    wsState: 'disconnected' as string,
    connecting: false,

    // ── 房间 ──
    roomCode: '',
    isHost: false,
    potName: '',
    potEmoji: '',
    members: [] as RoomMember[],
    timers: [] as any[],
    runningCount: 0,

    // ── 食材选择弹窗 ──
    showFoodModal: false,
    foods: [] as Food[],
    categories: [] as string[],
    selectedCategory: '全部',

    // ── 到时提醒 ──
    showAlertModal: false,
    alertTimer: null as RoomTimer | null,

    AVATARS: ['🍲', '🔥', '🥩', '🦐', '🥬', '🍄', '🫕', '🤤'],
  },

  unsubscribe: null as null | (() => void),

  onLoad() {
    // 读取昵称缓存
    try {
      const saved = wx.getStorageSync('room_nickname');
      if (saved) this.setData({ nickname: saved, avatar: wx.getStorageSync('room_avatar') || '🍲' });
    } catch {}

    // 读取 wsUrl
    try {
      const url = wx.getStorageSync('ws_server_url');
      if (url) this.setData({ wsUrl: url });
    } catch {}

    // 读取食材数据
    const foodData = app.globalData.foods || [];
    const cats = ['全部', ...(app.globalData.categories || [])];
    this.setData({ foods: foodData, categories: cats });

    // 订阅 RoomStore
    const store: RoomStore = app.globalData.roomStore;
    store.onTimerEnd((timer) => {
      this.setData({ showAlertModal: true, alertTimer: timer as any });
    });
    this.unsubscribe = store.subscribe(() => this.refresh());

    // 如果已在房间（从其他页面返回）
    if (store.isInRoom) {
      this.setData({ view: 'room' });
      this.refresh();
    }
  },

  onUnload() {
    if (this.unsubscribe) this.unsubscribe();
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const store: RoomStore = app.globalData.roomStore;

    this.setData({ wsState: store.wsState });

    if (!store.isInRoom) {
      this.setData({ view: 'lobby' });
      return;
    }

    this.setData({ view: 'room' });

    const room = store.currentRoom!;
    const pot = room.potId ? getPotById(room.potId) : null;

    const timersView = store.roomTimers.map((t) => {
      const remaining = store.getRemaining(t);
      const total = t.duration;
      const elapsed = total - remaining;
      const progress = Math.min(100, Math.round((elapsed / total) * 100));
      const isOwn = t.ownerId === store.you?.id;
      const isOver = remaining <= 0 && t.status === 'running';

      return {
        ...t,
        remaining,
        remainingText: formatCountdown(remaining),
        progressPercent: progress,
        isOwn,
        isOver,
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
      roomCode: room.code,
      isHost: store.isHost,
      potName: pot?.name || '未选择',
      potEmoji: pot?.emoji || '🍲',
      members: store.members,
      timers: timersView,
      runningCount: store.roomTimers.filter(t => t.status === 'running').length,
    });
  },

  // ─── 大厅操作 ────────────────────────────────────────────

  onNicknameInput(e: any) {
    this.setData({ nickname: e.detail.value });
  },

  onJoinCodeInput(e: any) {
    this.setData({ joinCode: e.detail.value.toUpperCase() });
  },

  onWsUrlInput(e: any) {
    this.setData({ wsUrl: e.detail.value });
  },

  onSelectAvatar(e: any) {
    this.setData({ avatar: e.currentTarget.dataset.emoji });
  },

  onToggleSettings() {
    this.setData({ showSettings: !this.data.showSettings });
  },

  onSaveSettings() {
    const store: RoomStore = app.globalData.roomStore;
    store.setWsUrl(this.data.wsUrl);
    this.setData({ showSettings: false });
    wx.showToast({ title: '已保存', icon: 'success' });
  },

  async onCreateRoom() {
    const { nickname, avatar } = this.data;
    if (!nickname.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }
    this.setData({ connecting: true });
    this.saveProfile();
    try {
      const store: RoomStore = app.globalData.roomStore;
      await store.createRoom(nickname.trim(), avatar);
      // 等待 room:state 消息
    } catch (e: any) {
      wx.showToast({ title: e.message || '创建失败', icon: 'none' });
    } finally {
      this.setData({ connecting: false });
    }
  },

  async onJoinRoom() {
    const { nickname, avatar, joinCode } = this.data;
    if (!nickname.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }
    if (joinCode.length < 4) {
      wx.showToast({ title: '请输入房间码', icon: 'none' });
      return;
    }
    this.setData({ connecting: true });
    this.saveProfile();
    try {
      const store: RoomStore = app.globalData.roomStore;
      await store.joinRoom(joinCode.trim(), nickname.trim(), avatar);
    } catch (e: any) {
      wx.showToast({ title: e.message || '加入失败', icon: 'none' });
    } finally {
      this.setData({ connecting: false });
    }
  },

  saveProfile() {
    try {
      wx.setStorageSync('room_nickname', this.data.nickname);
      wx.setStorageSync('room_avatar', this.data.avatar);
    } catch {}
  },

  // ─── 房间操作 ────────────────────────────────────────────

  onCopyCode() {
    wx.setClipboardData({
      data: this.data.roomCode,
      success: () => wx.showToast({ title: '房间码已复制', icon: 'success' }),
    });
  },

  onShareRoom() {
    wx.showShareMenu({ withShareTicket: false });
  },

  onSelectPot() {
    if (!this.data.isHost) {
      wx.showToast({ title: '只有房主可以选择锅底', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/pot/index?mode=room' });
  },

  onAddFood() {
    this.setData({ showFoodModal: true });
  },

  onCloseFoodModal() {
    this.setData({ showFoodModal: false });
  },

  onSelectFoodCategory(e: any) {
    this.setData({ selectedCategory: e.currentTarget.dataset.cat });
  },

  get filteredFoods() {
    const { foods, selectedCategory } = this.data;
    if (selectedCategory === '全部') return foods;
    return foods.filter((f: Food) => f.category === selectedCategory);
  },

  onAddFoodTimer(e: any) {
    const foodId = e.currentTarget.dataset.id;
    const store: RoomStore = app.globalData.roomStore;
    const food = (app.globalData.foods || []).find((f: Food) => f.id === foodId);
    if (!food) return;

    const potId = store.currentRoom?.potId || null;
    const duration = adjustTimeByPot(food.cookTime.recommended, potId);

    store.addTimer(food.id, food.name, food.emoji, duration);
    this.setData({ showFoodModal: false });
    wx.showToast({ title: `${food.emoji} 已开始计时`, icon: 'none' });
  },

  onCancelTimer(e: any) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '取消计时',
      content: '确认取消这个计时？',
      success: (res) => {
        if (res.confirm) {
          const store: RoomStore = app.globalData.roomStore;
          store.updateTimer(id, 'cancelled');
        }
      },
    });
  },

  onRemoveTimer(e: any) {
    const id = e.currentTarget.dataset.id;
    const store: RoomStore = app.globalData.roomStore;
    store.removeTimer(id);
  },

  onCompleteTimer(e: any) {
    const id = e.currentTarget.dataset.id;
    const store: RoomStore = app.globalData.roomStore;
    store.updateTimer(id, 'done');
  },

  onLeaveRoom() {
    wx.showModal({
      title: '离开房间',
      content: '确认离开当前房间？',
      success: (res) => {
        if (res.confirm) {
          const store: RoomStore = app.globalData.roomStore;
          store.leaveRoom();
          this.setData({ view: 'lobby' });
        }
      },
    });
  },

  // ─── 到时提醒 ────────────────────────────────────────────
  onAlertClose() {
    this.setData({ showAlertModal: false, alertTimer: null });
  },

  onAlertConfirm() {
    const timer = this.data.alertTimer;
    if (timer) {
      const store: RoomStore = app.globalData.roomStore;
      store.updateTimer(timer.id, 'done');
    }
    this.setData({ showAlertModal: false, alertTimer: null });
  },

  onShareAppMessage() {
    return {
      title: `🔥 加入我的火锅同桌，房间码：${this.data.roomCode}`,
      path: `/pages/room/index`,
    };
  },
});
