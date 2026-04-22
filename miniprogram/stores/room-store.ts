/**
 * 房间 Store - 多人同步（M3 完整实现）
 * 负责 WebSocket 连接管理 + 房间状态同步
 */

import { WS_BASE } from '../utils/config';

const WS_URL_KEY = 'ws_server_url';
// 默认连接本机（开发阶段），生产环境在 utils/config.ts 中修改
const DEFAULT_WS_URL = WS_BASE;

type Listener = () => void;

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
  startAt: number;       // 服务端校准后的时间戳
  duration: number;      // 秒
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

type WsReadyState = 'disconnected' | 'connecting' | 'connected' | 'error';

export class RoomStore {
  // 连接状态
  wsState: WsReadyState = 'disconnected';

  // 当前房间信息
  currentRoom: RoomState | null = null;
  you: RoomMember | null = null;

  // 服务端时间偏差（用于校准本地时间）
  private serverTimeOffset = 0;

  private socket: any = null;
  private listeners: Listener[] = [];
  private pingTimer: number = 0;
  private reconnectTimer: number = 0;
  private reconnectCount = 0;
  private maxReconnect = 5;
  private isManualDisconnect = false;

  // 计时器到时回调
  private timerEndHandlers: Array<(timer: RoomTimer) => void> = [];
  private alertedIds = new Set<string>();
  private tickTimer: number = 0;

  constructor() {
    this.startTick();
  }

  // ─── 订阅 ───────────────────────────────────────────────
  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  onTimerEnd(handler: (timer: RoomTimer) => void) {
    this.timerEndHandlers.push(handler);
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  // ─── 计算属性 ────────────────────────────────────────────
  get isInRoom(): boolean {
    return !!this.currentRoom;
  }

  get isHost(): boolean {
    return !!this.you?.isHost;
  }

  get members(): RoomMember[] {
    return this.currentRoom?.members ?? [];
  }

  get roomTimers(): RoomTimer[] {
    return this.currentRoom?.timers ?? [];
  }

  getRemaining(timer: RoomTimer): number {
    // 使用服务端校准后的时间
    const now = Date.now() + this.serverTimeOffset;
    const elapsed = Math.floor((now - timer.startAt) / 1000);
    return Math.max(0, timer.duration - elapsed);
  }

  // ─── WebSocket 连接 ──────────────────────────────────────
  private getWsUrl(): string {
    try {
      const saved = wx.getStorageSync(WS_URL_KEY);
      if (saved) return saved;
    } catch {}
    return DEFAULT_WS_URL;
  }

  setWsUrl(url: string) {
    try {
      wx.setStorageSync(WS_URL_KEY, url);
    } catch {}
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket && this.wsState === 'connected') {
        resolve();
        return;
      }

      this.isManualDisconnect = false;
      this.wsState = 'connecting';
      this.notify();

      const url = this.getWsUrl();
      const socket = wx.connectSocket({
        url,
        fail: (err) => {
          this.wsState = 'error';
          this.notify();
          reject(new Error(err.errMsg || '连接失败'));
        },
      });

      this.socket = socket;

      socket.onOpen(() => {
        console.log('[WS] Connected');
        this.wsState = 'connected';
        this.reconnectCount = 0;
        this.startPing();
        this.notify();
        resolve();
      });

      socket.onMessage((res) => {
        try {
          const msg = JSON.parse(res.data as string);
          this.handleMessage(msg);
        } catch (e) {
          console.error('[WS] Parse error', e);
        }
      });

      socket.onClose(() => {
        console.log('[WS] Closed');
        this.stopPing();
        this.wsState = 'disconnected';
        this.socket = null;
        this.notify();

        if (!this.isManualDisconnect && this.isInRoom) {
          this.tryReconnect();
        }
      });

      socket.onError((err) => {
        console.error('[WS] Error', err);
        this.wsState = 'error';
        this.notify();
      });
    });
  }

  disconnect() {
    this.isManualDisconnect = true;
    clearTimeout(this.reconnectTimer);
    this.stopPing();
    if (this.socket) {
      try { this.socket.close({}); } catch {}
      this.socket = null;
    }
    this.wsState = 'disconnected';
    this.notify();
  }

  private tryReconnect() {
    if (this.reconnectCount >= this.maxReconnect) {
      console.warn('[WS] Max reconnect reached');
      wx.showToast({ title: '同步连接已断开', icon: 'none' });
      return;
    }
    const delay = Math.min(1000 * Math.pow(2, this.reconnectCount), 30000);
    this.reconnectCount++;
    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectCount})`);

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
        // 重连成功后重新加入房间
        if (this.currentRoom && this.you) {
          this.sendJoin(this.currentRoom.code, this.you.nickname, this.you.avatar, this.you.id);
        }
      } catch {
        this.tryReconnect();
      }
    }, delay) as unknown as number;
  }

  private send(type: string, payload: any) {
    if (!this.socket || this.wsState !== 'connected') return;
    try {
      this.socket.send({ data: JSON.stringify({ type, payload, ts: Date.now() }) });
    } catch (e) {
      console.error('[WS] Send error', e);
    }
  }

  // ─── 心跳 ────────────────────────────────────────────────
  private startPing() {
    this.pingTimer = setInterval(() => {
      this.send('ping', {});
    }, 20 * 1000) as unknown as number;
  }

  private stopPing() {
    clearInterval(this.pingTimer);
  }

  // ─── 消息处理 ────────────────────────────────────────────
  private handleMessage(msg: { type: string; payload: any; ts?: number }) {
    const { type, payload } = msg;

    switch (type) {
      case 'welcome': {
        // 校准服务端时间
        if (msg.ts) {
          this.serverTimeOffset = msg.ts - Date.now();
        }
        break;
      }

      case 'pong': {
        if (payload?.serverTime) {
          this.serverTimeOffset = payload.serverTime - Date.now();
        }
        break;
      }

      case 'room:state': {
        // 全量同步房间状态（加入/重连时）
        this.you = payload.you;
        this.currentRoom = {
          code: payload.code,
          potId: payload.potId || '',
          members: this.mapMembers(payload.members),
          timers: this.mapTimers(payload.timers),
        };
        this.notify();
        break;
      }

      case 'room:member-join': {
        if (!this.currentRoom) return;
        const member = this.mapMember(payload.member);
        const exists = this.currentRoom.members.findIndex(m => m.id === member.id);
        if (exists >= 0) {
          this.currentRoom.members[exists] = member;
        } else {
          this.currentRoom.members.push(member);
        }
        this.notify();
        wx.showToast({ title: `${member.nickname} 加入了`, icon: 'none' });
        break;
      }

      case 'room:member-leave': {
        if (!this.currentRoom) return;
        const { memberId } = payload;
        const m = this.currentRoom.members.find(m => m.id === memberId);
        this.currentRoom.members = this.currentRoom.members.filter(m => m.id !== memberId);
        this.notify();
        if (m) wx.showToast({ title: `${m.nickname} 离开了`, icon: 'none' });
        break;
      }

      case 'room:pot-changed': {
        if (!this.currentRoom) return;
        this.currentRoom.potId = payload.potId;
        this.notify();
        break;
      }

      case 'timer:added': {
        if (!this.currentRoom) return;
        const timer = this.mapTimer(payload.timer);
        // 去重
        const exists = this.currentRoom.timers.findIndex(t => t.id === timer.id);
        if (exists < 0) {
          this.currentRoom.timers.unshift(timer);
        }
        this.notify();
        break;
      }

      case 'timer:updated': {
        if (!this.currentRoom) return;
        const timer = this.mapTimer(payload.timer);
        const idx = this.currentRoom.timers.findIndex(t => t.id === timer.id);
        if (idx >= 0) {
          this.currentRoom.timers[idx] = timer;
        }
        this.notify();
        break;
      }

      case 'timer:removed': {
        if (!this.currentRoom) return;
        this.currentRoom.timers = this.currentRoom.timers.filter(t => t.id !== payload.timerId);
        this.alertedIds.delete(payload.timerId);
        this.notify();
        break;
      }

      case 'error': {
        wx.showToast({ title: payload.msg || '发生错误', icon: 'none' });
        break;
      }
    }
  }

  // ─── 业务操作 ────────────────────────────────────────────

  /** 创建房间 */
  async createRoom(nickname: string, avatar: string) {
    await this.connect();
    this.send('room:create', { nickname, avatar });
  }

  /** 加入房间 */
  async joinRoom(code: string, nickname: string, avatar: string) {
    await this.connect();
    this.sendJoin(code, nickname, avatar);
  }

  private sendJoin(code: string, nickname: string, avatar: string, memberId?: string) {
    this.send('room:join', { code: code.toUpperCase(), nickname, avatar, memberId });
  }

  /** 离开房间 */
  leaveRoom() {
    if (this.isInRoom) {
      this.send('room:leave', {});
    }
    this.currentRoom = null;
    this.you = null;
    this.alertedIds.clear();
    this.disconnect();
    this.notify();
  }

  /** 设置锅底（仅房主） */
  setPot(potId: string) {
    this.send('room:set-pot', { potId });
  }

  /** 添加食材计时 */
  addTimer(foodId: string, foodName: string, foodEmoji: string, duration: number) {
    this.send('timer:add', { foodId, foodName, foodEmoji, duration, startAt: Date.now() + this.serverTimeOffset });
  }

  /** 标记计时完成/取消 */
  updateTimer(timerId: string, status: 'done' | 'cancelled') {
    this.send('timer:update', { timerId, status });
  }

  /** 移除计时 */
  removeTimer(timerId: string) {
    this.send('timer:remove', { timerId });
  }

  // ─── 数据映射 ────────────────────────────────────────────
  private mapMember(raw: any): RoomMember {
    return {
      id: raw.id,
      nickname: raw.nickname,
      avatar: raw.avatar || '🧑',
      isHost: raw.isHost ?? false,
      online: raw.online ?? true,
      joinAt: raw.joinAt ?? Date.now(),
    };
  }

  private mapMembers(raw: any): RoomMember[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map(m => this.mapMember(m));
    // map 格式 { id: member }
    return Object.values(raw).map((m: any) => this.mapMember(m));
  }

  private mapTimer(raw: any): RoomTimer {
    return {
      id: raw.id,
      foodId: raw.foodId,
      foodName: raw.foodName,
      foodEmoji: raw.foodEmoji,
      startAt: raw.startAt,
      duration: raw.duration,
      status: raw.status,
      ownerId: raw.ownerId,
      ownerNickname: raw.ownerNickname || '',
      ownerAvatar: raw.ownerAvatar || '🧑',
    };
  }

  private mapTimers(raw: any): RoomTimer[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map(t => this.mapTimer(t));
    return Object.values(raw).map((t: any) => this.mapTimer(t));
  }

  // ─── 计时 tick ───────────────────────────────────────────
  private startTick() {
    this.tickTimer = setInterval(() => {
      if (!this.currentRoom) return;
      let hasRunning = false;
      for (const t of this.currentRoom.timers) {
        if (t.status !== 'running') continue;
        hasRunning = true;
        const remaining = this.getRemaining(t);
        if (remaining <= 0 && !this.alertedIds.has(t.id)) {
          this.alertedIds.add(t.id);
          this.triggerAlert(t);
        }
      }
      if (hasRunning) this.notify();
    }, 1000) as unknown as number;
  }

  private triggerAlert(timer: RoomTimer) {
    // 播放提示音
    try {
      const audio = wx.createInnerAudioContext();
      audio.src = '/assets/alert.mp3';
      audio.play();
    } catch {}
    this.timerEndHandlers.forEach(h => h(timer));
  }
}
