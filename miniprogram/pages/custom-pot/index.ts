// pages/custom-pot/index.ts
import type { CustomDataStore } from '../../stores/custom-data-store';

const app = getApp<IAppOption>();

const EMOJI_OPTIONS = ['🍲','🥘','🔥','🌶️','🍅','🍄','🥬','🧅','🫕','☯️','🌊','🌿','🍋','🫚','🧂','⭐','💛','❤️'];
const COLOR_OPTIONS = [
  '#FFF5E6','#FF6347','#C0392B','#8B0000','#D4A574',
  '#F5DEB3','#228B22','#4169E1','#FF8C00','#9B59B6',
  '#1ABC9C','#F39C12','#E74C3C','#2C3E50','#95A5A6',
];

Page({
  data: {
    isEdit: false,
    editId: '',
    form: {
      name: '',
      emoji: '🍲',
      color: '#FFF5E6',
      boilTemp: 100,
      timeFactor: 1.0,
      description: '',
    },
    emojiOptions: EMOJI_OPTIONS,
    colorOptions: COLOR_OPTIONS,
    showEmojiPicker: false,
    showColorPicker: false,
    timeFactorDisplay: '1.0',  // 显示用
    customEmoji: '',
  },

  onLoad(query: any) {
    if (query && query.id) {
      const store: CustomDataStore = app.globalData.customDataStore;
      const pot = store.getPotById(query.id);
      if (pot) {
        this.setData({
          isEdit: true,
          editId: query.id,
          form: {
            name: pot.name,
            emoji: pot.emoji,
            color: pot.color,
            boilTemp: pot.boilTemp,
            timeFactor: pot.timeFactor,
            description: pot.description || '',
          },
          timeFactorDisplay: pot.timeFactor.toFixed(2),
        });
      }
    }
  },

  onInputName(e: any) { this.setData({ 'form.name': e.detail.value }); },
  onInputDescription(e: any) { this.setData({ 'form.description': e.detail.value }); },
  onInputTemp(e: any) { this.setData({ 'form.boilTemp': parseInt(e.detail.value) || 100 }); },

  onInputTimeFactor(e: any) {
    const val = parseFloat(e.detail.value);
    if (!isNaN(val)) {
      this.setData({ 'form.timeFactor': val, timeFactorDisplay: e.detail.value });
    }
  },

  onSelectEmoji(e: any) {
    this.setData({ 'form.emoji': e.currentTarget.dataset.emoji, showEmojiPicker: false });
  },
  onToggleEmojiPicker() {
    this.setData({ showEmojiPicker: !this.data.showEmojiPicker, showColorPicker: false });
  },
  onInputCustomEmoji(e: any) { this.setData({ customEmoji: e.detail.value }); },
  onConfirmCustomEmoji() {
    const v = this.data.customEmoji.trim();
    if (v) this.setData({ 'form.emoji': v, customEmoji: '', showEmojiPicker: false });
  },

  onSelectColor(e: any) {
    this.setData({ 'form.color': e.currentTarget.dataset.color, showColorPicker: false });
  },
  onToggleColorPicker() {
    this.setData({ showColorPicker: !this.data.showColorPicker, showEmojiPicker: false });
  },

  onSave() {
    const { form, isEdit, editId } = this.data;
    if (!form.name.trim()) {
      wx.showToast({ title: '请填写锅底名称', icon: 'none' });
      return;
    }
    const tf = parseFloat(String(form.timeFactor));
    if (isNaN(tf) || tf <= 0 || tf > 3) {
      wx.showToast({ title: '时间系数需在 0.1 ~ 3.0 之间', icon: 'none' });
      return;
    }

    const store: CustomDataStore = app.globalData.customDataStore;
    const id = isEdit ? editId : `cpot_${Date.now()}`;
    const pot: Pot = {
      id,
      name: form.name.trim(),
      emoji: form.emoji,
      color: form.color,
      boilTemp: form.boilTemp,
      timeFactor: tf,
      description: form.description.trim(),
    };

    store.savePot(pot);
    wx.showToast({ title: isEdit ? '保存成功' : '添加成功', icon: 'success', duration: 1000 });
    setTimeout(() => wx.navigateBack(), 800);
  },

  onDelete() {
    if (!this.data.isEdit) return;
    wx.showModal({
      title: '确认删除',
      content: `删除「${this.data.form.name}」锅底？`,
      confirmColor: '#C0392B',
      success: (res) => {
        if (res.confirm) {
          const store: CustomDataStore = app.globalData.customDataStore;
          store.deletePot(this.data.editId);
          wx.showToast({ title: '已删除', icon: 'success', duration: 800 });
          setTimeout(() => wx.navigateBack(), 600);
        }
      },
    });
  },
});
