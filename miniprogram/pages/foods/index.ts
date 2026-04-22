// pages/foods/index.ts
import { getAllFoods, getCategories, adjustTimeByPot } from '../../utils/builtin-data';
import { formatDuration } from '../../utils/helpers';
import type { TimerStore } from '../../stores/timer-store';
import type { SettingStore } from '../../stores/setting-store';
import type { CustomDataStore } from '../../stores/custom-data-store';

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
    const categories = ['全部', '⭐ 收藏', ...getCategories(), '自定义'];
    this.setData({ categories });
    this.filter();
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
    const customStore: CustomDataStore = app.globalData.customDataStore;
    const potId = timerStore ? timerStore.currentPotId : null;

    this.allFoods = getAllFoods();
    const customIds = new Set(customStore ? customStore.getCustomFoods().map((f: Food) => f.id) : []);

    let list = this.allFoods;

    if (this.data.currentCategory === '⭐ 收藏') {
      list = settingStore ? list.filter(f => settingStore.isFavorite(f.id)) : [];
    } else if (this.data.currentCategory === '自定义') {
      list = list.filter(f => customIds.has(f.id));
    } else if (this.data.currentCategory !== '全部') {
      list = list.filter(f => f.category === this.data.currentCategory);
    }

    const search = this.data.searchText.trim();
    if (search) {
      list = list.filter(f => f.name.includes(search));
    }

    list = [...list].sort((a, b) => b.popularity - a.popularity);

    const timePreference = settingStore ? settingStore.settings.timePreference : 'recommended';
    const foods = list.map(f => {
      let baseTime: number;
      if (timePreference === 'min') baseTime = f.cookTime.min;
      else if (timePreference === 'max') baseTime = f.cookTime.max;
      else baseTime = f.cookTime.recommended;
      const adjusted = adjustTimeByPot(baseTime, potId);
      return {
        ...f,
        recommendedText: formatDuration(adjusted),
        isFavorite: settingStore ? settingStore.isFavorite(f.id) : false,
        isCustom: customIds.has(f.id),
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

  /** 长按食材卡片 — 若是自定义食材则跳转编辑 */
  onLongPressFood(e: any) {
    const id = e.currentTarget.dataset.id;
    const customStore: CustomDataStore = app.globalData.customDataStore;
    if (customStore && customStore.getFoodById(id)) {
      wx.navigateTo({ url: `/pages/custom-food/index?id=${id}` });
    }
  },

  onToggleFav(e: any) {
    const id = e.currentTarget.dataset.id;
    const settingStore: SettingStore = app.globalData.settingStore;
    settingStore.toggleFavorite(id);
    this.filter();
  },

  onAddCustomFood() {
    wx.navigateTo({ url: '/pages/custom-food/index' });
  },

  onBack() {
    wx.switchTab({ url: '/pages/home/index' });
  },

  onRemoteDataLoaded() {
    this.filter();
  },
});
