// app.ts
import { TimerStore } from './stores/timer-store';
import { SettingStore } from './stores/setting-store';
import { RoomStore } from './stores/room-store';
import { CustomDataStore } from './stores/custom-data-store';
import { initBuiltinData, updateFoods, updatePots, setCustomDataStore } from './utils/builtin-data';
import { API_BASE } from './utils/config';

App<IAppOption>({
  globalData: {
    timerStore: null,
    settingStore: null,
    roomStore: null,
    customDataStore: null,
  },
  onLaunch() {
    // 先用内置数据初始化（保证即使网络失败也能用）
    initBuiltinData();

    // 初始化全局 Store
    this.globalData.settingStore = new SettingStore();
    this.globalData.timerStore = new TimerStore();
    this.globalData.roomStore = new RoomStore();
    this.globalData.customDataStore = new CustomDataStore();

    // 注入自定义数据 store，使 builtin-data 合并时自定义优先
    setCustomDataStore(this.globalData.customDataStore);

    // 加载存储中的历史数据
    this.globalData.settingStore.loadFromStorage();
    this.globalData.timerStore.loadFromStorage();

    // 从后端拉取最新食材和锅底数据
    this.fetchRemoteData();

    console.log('🔥 火锅计时助手启动');
  },

  fetchRemoteData() {
    let foodsLoaded = false;
    let potsLoaded = false;

    const notifyPagesIfReady = () => {
      if (foodsLoaded && potsLoaded) {
        // 两个数据都加载完毕，通知各页面刷新
        const pages = getCurrentPages();
        pages.forEach((page: any) => {
          if (typeof page.onRemoteDataLoaded === 'function') {
            page.onRemoteDataLoaded();
          }
        });
        console.log('🔄 远端数据全部加载完成，通知页面刷新');
      }
    };

    // 拉取食材
    wx.request({
      url: `${API_BASE}/api/foods`,
      success: (res: any) => {
        if (res.statusCode === 200 && res.data && res.data.foods && res.data.foods.length > 0) {
          updateFoods(res.data.foods);
          console.log(`✅ 远端食材加载完成: ${res.data.total} 条`);
        }
        foodsLoaded = true;
        notifyPagesIfReady();
      },
      fail: () => {
        console.warn('⚠️ 食材数据拉取失败，使用内置数据');
        foodsLoaded = true;
        notifyPagesIfReady();
      },
    });
    // 拉取锅底
    wx.request({
      url: `${API_BASE}/api/pots`,
      success: (res: any) => {
        if (res.statusCode === 200 && res.data && res.data.pots && res.data.pots.length > 0) {
          updatePots(res.data.pots);
          console.log(`✅ 远端锅底加载完成: ${res.data.total} 条`);
        }
        potsLoaded = true;
        notifyPagesIfReady();
      },
      fail: () => {
        console.warn('⚠️ 锅底数据拉取失败，使用内置数据');
        potsLoaded = true;
        notifyPagesIfReady();
      },
    });
  },

  onShow() {
    if (this.globalData.timerStore) {
      this.globalData.timerStore.refreshOnForeground();
    }
  },
  onHide() {
    if (this.globalData.timerStore) {
      this.globalData.timerStore.saveToStorage();
    }
  },
});
