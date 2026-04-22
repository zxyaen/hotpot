// pages/custom-food/index.ts
import type { CustomDataStore } from '../../stores/custom-data-store';

const app = getApp<IAppOption>();

// 常用 emoji 供快速选择
const EMOJI_OPTIONS = [
  '🥩','🐑','🐄','🦐','🐟','🦑','🦀','🥬','🍄','🥔','🌽','🍜',
  '🥟','🍖','🍗','🥚','🧄','🧅','🥦','🫑','🍆','🍅','🥕','🧆',
  '⚪','🟤','🟠','🟥','🟨','🟫','🌿','🍠','🫀','🦆','🧠','🥒',
];

const CATEGORIES = ['牛肉类','羊肉类','海鲜类','内脏类','丸滑类','豆制品','主食类','蔬菜类','菌菇类','自定义'];

Page({
  data: {
    isEdit: false,         // true=编辑模式，false=新增模式
    editId: '',            // 编辑时的食材 id
    form: {
      name: '',
      emoji: '🥩',
      category: '自定义',
      cookTimeMin: 60,        // 秒
      cookTimeRec: 120,
      cookTimeMax: 180,
      tips: '',
      popularity: 80,
    },
    emojiOptions: EMOJI_OPTIONS,
    categoryOptions: CATEGORIES,
    showEmojiPicker: false,
    customEmoji: '',       // 手动输入的 emoji
  },

  onLoad(query: any) {
    if (query && query.id) {
      // 编辑模式：加载已有数据
      const store: CustomDataStore = app.globalData.customDataStore;
      const food = store.getFoodById(query.id);
      if (food) {
        this.setData({
          isEdit: true,
          editId: query.id,
          form: {
            name: food.name,
            emoji: food.emoji,
            category: food.category,
            cookTimeMin: food.cookTime.min,
            cookTimeRec: food.cookTime.recommended,
            cookTimeMax: food.cookTime.max,
            tips: food.tips || '',
            popularity: food.popularity || 80,
          },
        });
      }
    }
  },

  onInputName(e: any) {
    this.setData({ 'form.name': e.detail.value });
  },
  onInputTips(e: any) {
    this.setData({ 'form.tips': e.detail.value });
  },
  onInputTimeMin(e: any) {
    this.setData({ 'form.cookTimeMin': parseInt(e.detail.value) || 0 });
  },
  onInputTimeRec(e: any) {
    this.setData({ 'form.cookTimeRec': parseInt(e.detail.value) || 0 });
  },
  onInputTimeMax(e: any) {
    this.setData({ 'form.cookTimeMax': parseInt(e.detail.value) || 0 });
  },

  onSelectCategory(e: any) {
    this.setData({ 'form.category': CATEGORIES[e.detail.value] });
  },

  onSelectEmoji(e: any) {
    this.setData({ 'form.emoji': e.currentTarget.dataset.emoji, showEmojiPicker: false });
  },

  onInputCustomEmoji(e: any) {
    this.setData({ customEmoji: e.detail.value });
  },

  onConfirmCustomEmoji() {
    const v = this.data.customEmoji.trim();
    if (v) {
      this.setData({ 'form.emoji': v, customEmoji: '', showEmojiPicker: false });
    }
  },

  onToggleEmojiPicker() {
    this.setData({ showEmojiPicker: !this.data.showEmojiPicker });
  },

  onSave() {
    const { form, isEdit, editId } = this.data;
    if (!form.name.trim()) {
      wx.showToast({ title: '请填写食材名称', icon: 'none' });
      return;
    }
    if (form.cookTimeMin <= 0 || form.cookTimeRec <= 0 || form.cookTimeMax <= 0) {
      wx.showToast({ title: '涮煮时间需大于0', icon: 'none' });
      return;
    }

    const store: CustomDataStore = app.globalData.customDataStore;
    const id = isEdit ? editId : `custom_${Date.now()}`;
    const food: Food = {
      id,
      name: form.name.trim(),
      emoji: form.emoji,
      category: form.category,
      cookTime: {
        min: form.cookTimeMin,
        recommended: form.cookTimeRec,
        max: form.cookTimeMax,
      },
      tips: form.tips.trim(),
      popularity: form.popularity,
    };

    store.saveFood(food);
    wx.showToast({ title: isEdit ? '修改成功' : '添加成功', icon: 'success', duration: 1000 });
    setTimeout(() => wx.navigateBack(), 800);
  },

  onDelete() {
    if (!this.data.isEdit) return;
    wx.showModal({
      title: '确认删除',
      content: `删除「${this.data.form.name}」？`,
      confirmColor: '#C0392B',
      success: (res) => {
        if (res.confirm) {
          const store: CustomDataStore = app.globalData.customDataStore;
          store.deleteFood(this.data.editId);
          wx.showToast({ title: '已删除', icon: 'success', duration: 800 });
          setTimeout(() => wx.navigateBack(), 600);
        }
      },
    });
  },
});
