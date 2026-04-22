// 全局类型定义

export interface Food {
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

export interface Pot {
  id: string;
  name: string;
  emoji: string;
  color: string;
  boilTemp: number;
  timeFactor: number;
  description: string;
}

export interface TimerItem {
  id: string;
  foodId: string;
  foodName: string;
  foodEmoji: string;
  startAt: number;
  duration: number;
  status: 'running' | 'done' | 'cancelled';
}

export interface HistoryRecord {
  id: string;
  date: number;
  potId: string;
  potName: string;
  foodCount: number;
  durationMin: number;
  foods: Array<{ foodName: string; foodEmoji: string }>;
}

export interface RoomMember {
  id: string;
  nickname: string;
  avatar: string;
  isHost: boolean;
  online: boolean;
  joinAt: number;
}

export interface RoomTimer {
  id: string;
  foodId: string;
  foodName: string;
  foodEmoji: string;
  startAt: number;
  duration: number;
  status: 'running' | 'done' | 'cancelled';
  ownerId: string;
  ownerNickname: string;
  ownerAvatar: string;
}

export interface RoomState {
  code: string;
  potId: string;
  members: RoomMember[];
  timers: RoomTimer[];
}

export type Tab = 'home' | 'foods' | 'room' | 'history' | 'settings';
export type WsState = 'disconnected' | 'connecting' | 'connected' | 'error';
