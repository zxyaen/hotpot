/**
 * 设置 Store - 用户偏好
 */

const STORAGE_KEY = 'setting_store_v1';

type Listener = () => void;

interface Settings {
  nickname: string;       // 昵称
  avatar: string;         // emoji 头像
  soundEnabled: boolean;  // 提醒声音
  vibrateEnabled: boolean;// 震动
  timePreference: 'min' | 'recommended' | 'max'; // 时间偏好
  favoriteIds: string[];  // 收藏食材
  serverHost: string;     // 后端地址（多人模式）
}

const DEFAULT_AVATARS = ['🍲', '🥘', '🍜', '🥟', '🍚', '🍖', '🍤', '🥬', '🍅', '🌶️'];

export class SettingStore {
  settings: Settings = {
    nickname: '火锅达人',
    avatar: '🍲',
    soundEnabled: true,
    vibrateEnabled: true,
    timePreference: 'recommended',
    favoriteIds: [],
    serverHost: '',
  };
  private listeners: Listener[] = [];

  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  update(patch: Partial<Settings>) {
    this.settings = { ...this.settings, ...patch };
    this.save();
    this.notify();
  }

  toggleFavorite(foodId: string) {
    const idx = this.settings.favoriteIds.indexOf(foodId);
    if (idx >= 0) {
      this.settings.favoriteIds.splice(idx, 1);
    } else {
      this.settings.favoriteIds.push(foodId);
    }
    this.save();
    this.notify();
  }

  isFavorite(foodId: string): boolean {
    return this.settings.favoriteIds.includes(foodId);
  }

  getAvatarOptions(): string[] {
    return DEFAULT_AVATARS;
  }

  save() {
    try {
      wx.setStorageSync(STORAGE_KEY, this.settings);
    } catch {}
  }

  loadFromStorage() {
    try {
      const data = wx.getStorageSync(STORAGE_KEY);
      if (data) {
        this.settings = { ...this.settings, ...data };
      }
    } catch {}
  }
}
