/**
 * 房间管理器 - 内存存储版本（小范围使用，无需 Redis）
 */

import { customAlphabet } from 'nanoid';
import type { Room, Member, Timer, RoomStatus } from './types';

// 房间码字符集（去掉易混淆的 0/O/1/I）
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const generateRoomCode = customAlphabet(ROOM_CODE_ALPHABET, 6);

// 成员ID生成器
const generateMemberId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 12);
// 计时器ID生成器
const generateTimerId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 16);

// 房间 TTL：24 小时
const ROOM_TTL_MS = 24 * 60 * 60 * 1000;
// 成员离线判定：60 秒无心跳视为离线（但记录保留）
const MEMBER_OFFLINE_MS = 60 * 1000;

export class RoomManager {
  private rooms = new Map<string, Room>();

  constructor() {
    // 定时清理过期房间，每 10 分钟扫描一次
    setInterval(() => this.cleanupExpired(), 10 * 60 * 1000);
  }

  /**
   * 创建房间
   */
  createRoom(nickname: string, avatar: string): { room: Room; member: Member } {
    let code = generateRoomCode();
    // 防冲突
    while (this.rooms.has(code)) {
      code = generateRoomCode();
    }

    const memberId = generateMemberId();
    const now = Date.now();

    const host: Member = {
      id: memberId,
      nickname,
      avatar,
      joinedAt: now,
      lastSeen: now,
      isHost: true,
    };

    const room: Room = {
      code,
      hostId: memberId,
      createdAt: now,
      potId: null,
      status: 'active',
      members: new Map([[memberId, host]]),
      timers: new Map(),
    };

    this.rooms.set(code, room);
    console.log(`[Room] Created ${code} by ${nickname}`);
    return { room, member: host };
  }

  /**
   * 加入房间
   */
  joinRoom(
    code: string,
    nickname: string,
    avatar: string,
    existingMemberId?: string
  ): { room: Room; member: Member } | null {
    const room = this.rooms.get(code);
    if (!room || room.status !== 'active') {
      return null;
    }

    const now = Date.now();

    // 支持断线重连：如果提供了 memberId 且成员已存在，更新状态
    if (existingMemberId && room.members.has(existingMemberId)) {
      const member = room.members.get(existingMemberId)!;
      member.lastSeen = now;
      member.nickname = nickname;
      member.avatar = avatar;
      console.log(`[Room] ${code} - ${nickname} reconnected`);
      return { room, member };
    }

    // 新成员
    const memberId = generateMemberId();
    const member: Member = {
      id: memberId,
      nickname,
      avatar,
      joinedAt: now,
      lastSeen: now,
      isHost: false,
    };

    room.members.set(memberId, member);
    console.log(`[Room] ${code} - ${nickname} joined`);
    return { room, member };
  }

  /**
   * 离开房间
   */
  leaveRoom(code: string, memberId: string): Room | null {
    const room = this.rooms.get(code);
    if (!room) return null;

    const leaving = room.members.get(memberId);
    if (!leaving) return room;

    room.members.delete(memberId);
    console.log(`[Room] ${code} - ${leaving.nickname} left`);

    // 如果房主离开，转让给最早加入的成员
    if (leaving.isHost && room.members.size > 0) {
      const nextHost = [...room.members.values()].sort(
        (a, b) => a.joinedAt - b.joinedAt
      )[0];
      nextHost.isHost = true;
      room.hostId = nextHost.id;
      console.log(`[Room] ${code} - host transferred to ${nextHost.nickname}`);
    }

    // 如果没有成员了，标记为解散（保留数据，24h 后清理）
    if (room.members.size === 0) {
      room.status = 'dismissed';
      console.log(`[Room] ${code} - dismissed (empty)`);
    }

    return room;
  }

  /**
   * 获取房间
   */
  getRoom(code: string): Room | null {
    return this.rooms.get(code) || null;
  }

  /**
   * 添加计时器
   */
  addTimer(
    code: string,
    memberId: string,
    payload: { foodId: string; foodName: string; foodEmoji: string; duration: number; startAt?: number }
  ): Timer | null {
    const room = this.rooms.get(code);
    if (!room || room.status !== 'active') return null;

    const member = room.members.get(memberId);
    if (!member) return null;

    const serverNow = Date.now();
    // 若客户端传了 startAt 且偏差在合理范围（±5s）内，则使用服务端时间；否则直接用服务端时间
    const startAt = serverNow;

    const timer: Timer = {
      id: generateTimerId(),
      foodId: payload.foodId,
      foodName: payload.foodName,
      foodEmoji: payload.foodEmoji,
      ownerId: memberId,
      ownerNickname: member.nickname,
      ownerAvatar: member.avatar,
      startAt,
      duration: payload.duration,
      status: 'running',
    };

    room.timers.set(timer.id, timer);
    return timer;
  }

  updateTimer(code: string, timerId: string, status: 'done' | 'cancelled'): Timer | null {
    const room = this.rooms.get(code);
    if (!room) return null;
    const timer = room.timers.get(timerId);
    if (!timer) return null;
    timer.status = status;
    return timer;
  }

  removeTimer(code: string, timerId: string): boolean {
    const room = this.rooms.get(code);
    if (!room) return false;
    return room.timers.delete(timerId);
  }

  setPot(code: string, potId: string): Room | null {
    const room = this.rooms.get(code);
    if (!room) return null;
    room.potId = potId;
    return room;
  }

  /**
   * 更新成员心跳
   */
  heartbeat(code: string, memberId: string) {
    const room = this.rooms.get(code);
    if (!room) return;
    const member = room.members.get(memberId);
    if (member) member.lastSeen = Date.now();
  }

  /**
   * 房间状态快照（用于广播）
   */
  snapshot(code: string) {
    const room = this.rooms.get(code);
    if (!room) return null;
    return {
      code: room.code,
      hostId: room.hostId,
      createdAt: room.createdAt,
      potId: room.potId,
      status: room.status,
      members: [...room.members.values()],
      timers: [...room.timers.values()],
    };
  }

  /**
   * 清理过期房间
   */
  private cleanupExpired() {
    const now = Date.now();
    let removed = 0;
    for (const [code, room] of this.rooms) {
      // 超过 TTL 或已解散超过 30 分钟，直接删除
      if (now - room.createdAt > ROOM_TTL_MS) {
        this.rooms.delete(code);
        removed++;
      } else if (room.status === 'dismissed' && room.members.size === 0) {
        // 解散的空房间 30 分钟后清理
        if (now - room.createdAt > 30 * 60 * 1000) {
          this.rooms.delete(code);
          removed++;
        }
      }
    }
    if (removed > 0) console.log(`[Room] Cleaned ${removed} expired rooms`);
  }

  /**
   * 统计信息（供监控用）
   */
  stats() {
    return {
      totalRooms: this.rooms.size,
      activeRooms: [...this.rooms.values()].filter(r => r.status === 'active').length,
      totalMembers: [...this.rooms.values()].reduce((s, r) => s + r.members.size, 0),
      totalTimers: [...this.rooms.values()].reduce((s, r) => s + r.timers.size, 0),
    };
  }
}

export const roomManager = new RoomManager();
