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
    this.allFoods = getAllFoods();
    this.setData({ categories });
    this.filter();
  },

  onShow() {
    this.filter();
  },

  filter() {
    const settingStore: SettingStore = app.globalData.settingStore;
    const timerStore: TimerStore = app.globalData.timerStore;
    const potId = timerStore.currentPotId;

    let list = this.allFoods;

    // 分类过滤
    if (this.data.currentCategory === '⭐ 收藏') {
      list = list.filter(f => settingStore.isFavorite(f.id));
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
    const foods = list.map(f => {
      const adjusted = adjustTimeByPot(f.cookTime.recommended, potId);
      return {
        ...f,
        recommendedText: formatDuration(adjusted),
        isFavorite: settingStore.isFavorite(f.id),
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
    const food = this.allFoods.find(f => f.id === id);
    if (!food) return;

    const timer = timerStore.addTimer(id);
    if (timer) {
      wx.vibrateShort({ type: 'light', fail: () => {} });
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
});
