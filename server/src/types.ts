/**
 * 类型定义
 */

export interface FoodCookTime {
  min: number;
  recommended: number;
  max: number;
}

export interface Food {
  id: string;
  name: string;
  emoji: string;
  category: string;
  cookTime: FoodCookTime;
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

export interface Member {
  id: string;
  nickname: string;
  avatar: string;
  joinedAt: number;
  lastSeen: number;
  isHost: boolean;
}

export type TimerStatus = 'running' | 'done' | 'cancelled';

export interface Timer {
  id: string;
  foodId: string;
  foodName: string;
  foodEmoji: string;
  ownerId: string;
  ownerNickname: string;
  ownerAvatar: string;
  startAt: number; // 服务器时间戳 (ms)
  duration: number; // 秒
  status: TimerStatus;
}

export type RoomStatus = 'active' | 'dismissed';

export interface Room {
  code: string;
  hostId: string;
  createdAt: number;
  potId: string | null;
  status: RoomStatus;
  members: Map<string, Member>;
  timers: Map<string, Timer>;
}

// WS 消息协议
export interface WsMessage<T = any> {
  type: string;
  payload: T;
  ts: number;
}

export interface JoinPayload {
  code: string;
  nickname: string;
  avatar: string;
  memberId?: string;
}

export interface CreatePayload {
  nickname: string;
  avatar: string;
}

export interface AddTimerPayload {
  foodId: string;
  foodName: string;
  foodEmoji: string;
  duration: number;
}

export interface UpdateTimerPayload {
  timerId: string;
  status: TimerStatus;
}

export interface RemoveTimerPayload {
  timerId: string;
}

export interface SetPotPayload {
  potId: string;
}
