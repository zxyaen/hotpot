// pages/foods/index.ts
import { getAllFoods, getCategories, adjustTimeByPot } from '../../utils/builtin-data';
import { formatDuration } from '../../utils/helpers';
import type { TimerStore } from '../../stores/timer-store';
import type { SettingStore } from '../../stores/setting-store';

const app = getApp<IAppOption>();

Page({
  data: {
    categories: [] as string[],
    currentCategory: '全部',
    foods: [] as any[],
    showFavOnly: false,
    searchText: '',
  },

  allFoods: [] as Food[],

  onLoad() {
    const categories = ['全部', '⭐ 收藏', ...getCategories()];
    this.setData({ categories });
    this.filter();
    // 远端数据是异步拉取的，延迟多次刷新确保数据到位
    setTimeout(() => this.filter(), 500);
    setTimeout(() => this.filter(), 1500);
    setTimeout(() => this.filter(), 3000);
  },

  onShow() {
    this.filter();
  },

  filter() {
    const settingStore: SettingStore = app.globalData.settingStore;
    const timerStore: TimerStore = app.globalData.timerStore;
    const potId = timerStore ? timerStore.currentPotId : null;

    // 每次filter都重新获取最新数据（兼容远端异步更新）
    this.allFoods = getAllFoods();
    let list = this.allFoods;

    // 分类过滤
    if (this.data.currentCategory === '⭐ 收藏') {
      list = settingStore ? list.filter(f => settingStore.isFavorite(f.id)) : [];
    } else if (this.data.currentCategory !== '全部') {
      list = list.filter(f => f.category === this.data.currentCategory);
    }

    // 搜索过滤
    const search = this.data.searchText.trim();
    if (search) {
      list = list.filter(f => f.name.includes(search));
    }

    // 按热度排序
    list = [...list].sort((a, b) => b.popularity - a.popularity);

    // 视图层数据
    const timePreference = settingStore ? settingStore.settings.timePreference : 'recommended';
    const foods = list.map(f => {
      // 根据时间偏好选择基础时间
      let baseTime: number;
      if (timePreference === 'min') baseTime = f.cookTime.min;
      else if (timePreference === 'max') baseTime = f.cookTime.max;
      else baseTime = f.cookTime.recommended;
      const adjusted = adjustTimeByPot(baseTime, potId);
      return {
        ...f,
        recommendedText: formatDuration(adjusted),
        isFavorite: settingStore ? settingStore.isFavorite(f.id) : false,
      };
    });

    this.setData({ foods });
  },

  onTapCategory(e: any) {
    this.setData({ currentCategory: e.currentTarget.dataset.cat });
    this.filter();
  },

  onSearch(e: any) {
    this.setData({ searchText: e.detail.value });
    this.filter();
  },

  onTapFood(e: any) {
    const id = e.currentTarget.dataset.id;
    const timerStore: TimerStore = app.globalData.timerStore;
    const settingStore: SettingStore = app.globalData.settingStore;
    const food = this.allFoods.find(f => f.id === id);
    if (!food) return;

    const timePreference = settingStore ? settingStore.settings.timePreference : 'recommended';
    const timer = timerStore.addTimer(id, timePreference);
    if (timer) {
      wx.showToast({
        title: `${food.emoji} ${food.name} 开始计时`,
        icon: 'none',
        duration: 1500,
      });
    }
  },

  onToggleFav(e: any) {
    const id = e.currentTarget.dataset.id;
    const settingStore: SettingStore = app.globalData.settingStore;
    settingStore.toggleFavorite(id);
    this.filter();
  },

  onBack() {
    wx.switchTab({ url: '/pages/home/index' });
  },

  /** 远端数据加载完成时触发（由 app.ts fetchRemoteData 回调） */
  onRemoteDataLoaded() {
    this.filter();
  },
});
