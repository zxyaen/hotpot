/**
 * 房间 Store (H5版)
 * WebSocket 连接 + 多人同步
 */
import { RoomState, RoomMember, RoomTimer, WsState } from '../types';
import { WS_BASE } from '../utils/config';

const WS_URL_KEY = 'hotpot_ws_url';
type Listener = () => void;

export class RoomStore {
  wsState: WsState = 'disconnected';
  currentRoom: RoomState | null = null;
  you: RoomMember | null = null;
  private serverTimeOffset = 0;
  private socket: WebSocket | null = null;
  private listeners: Listener[] = [];
  private timerEndHandlers: Array<(timer: RoomTimer) => void> = [];
  private alertedIds = new Set<string>();
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectCount = 0;
  private maxReconnect = 5;
  private isManualDisconnect = false;

  constructor() {
    this.startTick();
  }

  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  onTimerEnd(handler: (timer: RoomTimer) => void) {
    this.timerEndHandlers.push(handler);
    return () => {
      this.timerEndHandlers = this.timerEndHandlers.filter(h => h !== handler);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  get isInRoom(): boolean { return !!this.currentRoom; }
  get isHost(): boolean { return !!this.you?.isHost; }
  get members(): RoomMember[] { return this.currentRoom?.members ?? []; }
  get roomTimers(): RoomTimer[] { return this.currentRoom?.timers ?? []; }

  getRemaining(timer: RoomTimer): number {
    if (timer.status === 'done' || timer.status === 'cancelled') return 0;
    const now = Date.now() + this.serverTimeOffset;
    const elapsed = Math.floor((now - timer.startAt) / 1000);
    return Math.max(0, timer.duration - elapsed);
  }

  getWsUrl(): string {
    try {
      const saved = localStorage.getItem(WS_URL_KEY);
      if (saved) return saved;
    } catch {}
    return WS_BASE;
  }

  setWsUrl(url: string) {
    try { localStorage.setItem(WS_URL_KEY, url); } catch {}
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket && this.wsState === 'connected') { resolve(); return; }
      this.isManualDisconnect = false;
      this.wsState = 'connecting';
      this.notify();

      const url = this.getWsUrl();
      let settled = false;
      const socket = new WebSocket(url);
      this.socket = socket;

      socket.onopen = () => {
        this.wsState = 'connected';
        this.reconnectCount = 0;
        this.startPing();
        this.notify();
        if (!settled) { settled = true; resolve(); }
      };

      socket.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          this.handleMessage(msg);
        } catch {}
      };

      socket.onclose = () => {
        this.stopPing();
        this.wsState = 'disconnected';
        this.socket = null;
        this.notify();
        if (!settled) { settled = true; reject(new Error('连接失败')); return; }
        if (!this.isManualDisconnect && this.isInRoom) {
          this.tryReconnect();
        }
      };

      socket.onerror = () => {
        this.wsState = 'error';
        this.notify();
        // 不在这里 reject，等 onclose 触发时统一处理
      };
    });
  }

  disconnect() {
    this.isManualDisconnect = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.stopPing();
    if (this.socket) {
      try { this.socket.close(); } catch {}
      this.socket = null;
    }
    this.wsState = 'disconnected';
    this.notify();
  }

  private tryReconnect() {
    if (this.reconnectCount >= this.maxReconnect) return;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectCount), 30000);
    this.reconnectCount++;
    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
        if (this.currentRoom && this.you) {
          this.send('room:join', {
            code: this.currentRoom.code,
            nickname: this.you.nickname,
            avatar: this.you.avatar,
            memberId: this.you.id,
          });
        }
      } catch {
        this.tryReconnect();
      }
    }, delay);
  }

  private send(type: string, payload: any) {
    if (!this.socket || this.wsState !== 'connected') return;
    try {
      this.socket.send(JSON.stringify({ type, payload, ts: Date.now() }));
    } catch {}
  }

  private startPing() {
    this.pingTimer = setInterval(() => this.send('ping', {}), 20000);
  }

  private stopPing() {
    if (this.pingTimer) clearInterval(this.pingTimer);
  }

  private handleMessage(msg: { type: string; payload: any; ts?: number }) {
    const { type, payload } = msg;
    switch (type) {
      case 'welcome':
        if (msg.ts) this.serverTimeOffset = msg.ts - Date.now();
        break;
      case 'pong':
        if (payload?.serverTime) this.serverTimeOffset = payload.serverTime - Date.now();
        break;
      case 'room:state':
        this.you = payload.you;
        this.currentRoom = {
          code: payload.code,
          potId: payload.potId || '',
          members: this.mapMembers(payload.members),
          timers: this.mapTimers(payload.timers),
        };
        this.notify();
        break;
      case 'room:member-join': {
        if (!this.currentRoom) return;
        const member = this.mapMember(payload.member);
        const exists = this.currentRoom.members.findIndex(m => m.id === member.id);
        if (exists >= 0) this.currentRoom.members[exists] = member;
        else this.currentRoom.members.push(member);
        this.notify();
        break;
      }
      case 'room:member-leave': {
        if (!this.currentRoom) return;
        this.currentRoom.members = this.currentRoom.members.filter(m => m.id !== payload.memberId);
        this.notify();
        break;
      }
      case 'room:pot-changed':
        if (!this.currentRoom) return;
        this.currentRoom.potId = payload.potId;
        this.notify();
        break;
      case 'timer:added': {
        if (!this.currentRoom) return;
        const timer = this.mapTimer(payload.timer);
        if (!this.currentRoom.timers.find(t => t.id === timer.id)) {
          this.currentRoom.timers.unshift(timer);
        }
        this.notify();
        break;
      }
      case 'timer:updated': {
        if (!this.currentRoom) return;
        const timer = this.mapTimer(payload.timer);
        const idx = this.currentRoom.timers.findIndex(t => t.id === timer.id);
        if (idx >= 0) this.currentRoom.timers[idx] = timer;
        this.notify();
        break;
      }
      case 'timer:removed':
        if (!this.currentRoom) return;
        this.currentRoom.timers = this.currentRoom.timers.filter(t => t.id !== payload.timerId);
        this.alertedIds.delete(payload.timerId);
        this.notify();
        break;
      case 'error':
        console.error('[WS Error]', payload.msg);
        break;
    }
  }

  async createRoom(nickname: string, avatar: string) {
    await this.connect();
    this.send('room:create', { nickname, avatar });
  }

  async joinRoom(code: string, nickname: string, avatar: string) {
    await this.connect();
    this.send('room:join', { code: code.toUpperCase(), nickname, avatar });
  }

  leaveRoom() {
    if (this.isInRoom) this.send('room:leave', {});
    this.currentRoom = null;
    this.you = null;
    this.alertedIds.clear();
    this.disconnect();
    this.notify();
  }

  setPot(potId: string) {
    this.send('room:set-pot', { potId });
  }

  addTimer(foodId: string, foodName: string, foodEmoji: string, duration: number) {
    this.send('timer:add', {
      foodId, foodName, foodEmoji, duration,
      startAt: Date.now() + this.serverTimeOffset,
    });
  }

  updateTimer(timerId: string, status: 'done' | 'cancelled') {
    this.send('timer:update', { timerId, status });
  }

  removeTimer(timerId: string) {
    this.send('timer:remove', { timerId });
  }

  private mapMember(raw: any): RoomMember {
    return {
      id: raw.id, nickname: raw.nickname,
      avatar: raw.avatar || '🧑',
      isHost: raw.isHost ?? false,
      online: raw.online ?? true,
      joinAt: raw.joinAt ?? Date.now(),
    };
  }
  private mapMembers(raw: any): RoomMember[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map(m => this.mapMember(m));
    return Object.values(raw).map((m: any) => this.mapMember(m));
  }
  private mapTimer(raw: any): RoomTimer {
    return {
      id: raw.id, foodId: raw.foodId,
      foodName: raw.foodName, foodEmoji: raw.foodEmoji,
      startAt: raw.startAt, duration: raw.duration,
      status: raw.status, ownerId: raw.ownerId,
      ownerNickname: raw.ownerNickname || '',
      ownerAvatar: raw.ownerAvatar || '🧑',
    };
  }
  private mapTimers(raw: any): RoomTimer[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map(t => this.mapTimer(t));
    return Object.values(raw).map((t: any) => this.mapTimer(t));
  }

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
          this.timerEndHandlers.forEach(h => h(t));
        }
      }
      if (hasRunning) this.notify();
    }, 1000);
  }

  destroy() {
    if (this.tickTimer) clearInterval(this.tickTimer);
    this.disconnect();
  }
}
