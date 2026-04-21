// app.ts
import { TimerStore } from './stores/timer-store';
import { SettingStore } from './stores/setting-store';
import { RoomStore } from './stores/room-store';
import { initBuiltinData } from './utils/builtin-data';

App<IAppOption>({
  globalData: {
    timerStore: null,
    settingStore: null,
    roomStore: null,
  },
  onLaunch() {
    // 初始化内置数据（食材库 + 锅底库）
    initBuiltinData();

    // 初始化全局 Store
    this.globalData.settingStore = new SettingStore();
    this.globalData.timerStore = new TimerStore();
    this.globalData.roomStore = new RoomStore();

    // 加载存储中的历史数据
    this.globalData.settingStore.loadFromStorage();
    this.globalData.timerStore.loadFromStorage();

    console.log('🔥 火锅计时助手启动');
  },
  onShow() {
    // 小程序回前台时，重新校对计时器
    if (this.globalData.timerStore) {
      this.globalData.timerStore.refreshOnForeground();
    }
  },
  onHide() {
    // 小程序进入后台时，持久化状态
    if (this.globalData.timerStore) {
      this.globalData.timerStore.saveToStorage();
    }
  },
});
