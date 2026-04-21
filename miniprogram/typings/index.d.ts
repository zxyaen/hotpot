/**
 * 全局类型定义
 */

interface IAppOption {
  globalData: {
    timerStore: any;
    settingStore: any;
    roomStore: any;
    foods?: any[];
    pots?: any[];
    categories?: string[];
  };
  onLaunch(): void;
  onShow(): void;
  onHide(): void;
}

interface Food {
  id: string;
  name: string;
  emoji: string;
  category: string;
  cookTime: {
    min: number;
    recommended: number;
    max: number;
  };
  tips: string;
  popularity: number;
}

interface Pot {
  id: string;
  name: string;
  emoji: string;
  color: string;
  boilTemp: number;
  timeFactor: number;
  description: string;
}

type TimerStatus = 'running' | 'done' | 'cancelled';

interface TimerItem {
  id: string;
  foodId: string;
  foodName: string;
  foodEmoji: string;
  startAt: number;  // 客户端时间戳 ms
  duration: number; // 秒
  status: TimerStatus;
  // 多人模式下的字段
  ownerId?: string;
  ownerNickname?: string;
  ownerAvatar?: string;
}

interface HistoryRecord {
  id: string;
  date: number;
  potId: string;
  potName: string;
  foodCount: number;
  durationMin: number;
  foods: Array<{ foodName: string; foodEmoji: string }>;
}
