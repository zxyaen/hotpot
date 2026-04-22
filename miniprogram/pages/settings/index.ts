// pages/settings/index.ts
import type { SettingStore } from '../../stores/setting-store';

const app = getApp<IAppOption>();

Page({
  data: {
    nickname: '',
    avatar: '',
    soundEnabled: true,
    vibrateEnabled: true,
    timePreference: 'recommended',
    avatars: [] as string[],
    serverHost: '',
  },

  onLoad() {
    this.refresh();
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const store: SettingStore = app.globalData.settingStore;
    this.setData({
      nickname: store.settings.nickname,
      avatar: store.settings.avatar,
      soundEnabled: store.settings.soundEnabled,
      vibrateEnabled: store.settings.vibrateEnabled,
      timePreference: store.settings.timePreference,
      serverHost: store.settings.serverHost,
      avatars: store.getAvatarOptions(),
    });
  },

  onNicknameInput(e: any) {
    const store: SettingStore = app.globalData.settingStore;
    store.update({ nickname: e.detail.value });
  },

  onSelectAvatar(e: any) {
    const avatar = e.currentTarget.dataset.avatar;
    const store: SettingStore = app.globalData.settingStore;
    store.update({ avatar });
    this.setData({ avatar });
  },

  onToggleSound(e: any) {
    const store: SettingStore = app.globalData.settingStore;
    store.update({ soundEnabled: e.detail.value });
  },

  onToggleVibrate(e: any) {
    const store: SettingStore = app.globalData.settingStore;
    store.update({ vibrateEnabled: e.detail.value });
  },

  onTimePrefChange(e: any) {
    const pref = e.currentTarget.dataset.pref as 'min' | 'recommended' | 'max';
    const store: SettingStore = app.globalData.settingStore;
    store.update({ timePreference: pref });
    this.setData({ timePreference: pref });
  },

  onServerHostInput(e: any) {
    const store: SettingStore = app.globalData.settingStore;
    store.update({ serverHost: e.detail.value });
  },

  onGoToRoom() {
    wx.navigateTo({ url: '/pages/room/index' });
  },

  onAbout() {
    wx.showModal({
      title: '关于',
      content: '熟了吗？v0.2.0\n让每一涮都恰到好处 🔥',
      showCancel: false,
    });
  },
});
