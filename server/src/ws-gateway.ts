/**
 * WebSocket 网关
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import { roomManager } from './room-manager';
import type { WsMessage, Room } from './types';

interface WsClient {
  socket: WebSocket;
  roomCode: string;
  memberId: string;
  isAlive: boolean;
}

// 所有在线客户端：memberId -> client
const clients = new Map<string, WsClient>();

/**
 * 向房间广播消息
 */
function broadcast(roomCode: string, message: WsMessage, excludeMemberId?: string) {
  const room = roomManager.getRoom(roomCode);
  if (!room) return;

  const data = JSON.stringify(message);
  for (const memberId of room.members.keys()) {
    if (memberId === excludeMemberId) continue;
    const client = clients.get(memberId);
    if (client && client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(data);
    }
  }
}

/**
 * 单独给某个客户端发消息
 */
function sendTo(memberId: string, message: WsMessage) {
  const client = clients.get(memberId);
  if (client && client.socket.readyState === WebSocket.OPEN) {
    client.socket.send(JSON.stringify(message));
  }
}

function buildMessage<T>(type: string, payload: T): WsMessage<T> {
  return { type, payload, ts: Date.now() };
}

/**
 * 处理客户端消息
 */
function handleMessage(client: WsClient, raw: string) {
  let msg: WsMessage;
  try {
    msg = JSON.parse(raw);
  } catch {
    return;
  }

  const { type, payload } = msg;

  switch (type) {
    case 'ping': {
      // 心跳
      client.isAlive = true;
      if (client.roomCode && client.memberId) {
        roomManager.heartbeat(client.roomCode, client.memberId);
      }
      sendTo(client.memberId, buildMessage('pong', { serverTime: Date.now() }));
      break;
    }

    case 'room:create': {
      const { nickname, avatar } = payload as { nickname: string; avatar: string };
      const { room, member } = roomManager.createRoom(nickname, avatar);

      // 断开旧连接（如果存在）
      const old = clients.get(member.id);
      if (old && old.socket !== client.socket) old.socket.close();

      client.roomCode = room.code;
      client.memberId = member.id;
      clients.set(member.id, client);

      sendTo(
        member.id,
        buildMessage('room:state', {
          you: member,
          ...roomManager.snapshot(room.code),
        })
      );
      break;
    }

    case 'room:join': {
      const { code, nickname, avatar, memberId } = payload as {
        code: string;
        nickname: string;
        avatar: string;
        memberId?: string;
      };
      const upperCode = code.toUpperCase();
      const result = roomManager.joinRoom(upperCode, nickname, avatar, memberId);

      if (!result) {
        sendTo(client.memberId || 'temp', buildMessage('error', { code: 'ROOM_NOT_FOUND', msg: '房间不存在或已解散' }));
        // 未建立 memberId，只能回给 socket 本身
        if (!client.memberId) {
          client.socket.send(JSON.stringify(buildMessage('error', { code: 'ROOM_NOT_FOUND', msg: '房间不存在或已解散' })));
        }
        return;
      }

      const old = clients.get(result.member.id);
      if (old && old.socket !== client.socket) old.socket.close();

      client.roomCode = upperCode;
      client.memberId = result.member.id;
      clients.set(result.member.id, client);

      // 向新成员发送全量房间状态
      sendTo(
        result.member.id,
        buildMessage('room:state', {
          you: result.member,
          ...roomManager.snapshot(upperCode),
        })
      );

      // 广播新成员加入
      broadcast(upperCode, buildMessage('room:member-join', { member: result.member }), result.member.id);
      break;
    }

    case 'room:leave': {
      if (!client.roomCode || !client.memberId) return;
      const room = roomManager.leaveRoom(client.roomCode, client.memberId);
      if (room) {
        broadcast(client.roomCode, buildMessage('room:member-leave', { memberId: client.memberId }));
      }
      clients.delete(client.memberId);
      client.roomCode = '';
      client.memberId = '';
      break;
    }

    case 'room:set-pot': {
      if (!client.roomCode) return;
      const { potId } = payload as { potId: string };
      const room = roomManager.setPot(client.roomCode, potId);
      if (room) {
        broadcast(client.roomCode, buildMessage('room:pot-changed', { potId }));
      }
      break;
    }

    case 'timer:add': {
      if (!client.roomCode || !client.memberId) return;
      const timer = roomManager.addTimer(client.roomCode, client.memberId, payload);
      if (timer) {
        broadcast(client.roomCode, buildMessage('timer:added', { timer }));
      }
      break;
    }

    case 'timer:update': {
      if (!client.roomCode) return;
      const { timerId, status } = payload as { timerId: string; status: 'done' | 'cancelled' };
      const timer = roomManager.updateTimer(client.roomCode, timerId, status);
      if (timer) {
        broadcast(client.roomCode, buildMessage('timer:updated', { timer }));
      }
      break;
    }

    case 'timer:remove': {
      if (!client.roomCode) return;
      const { timerId } = payload as { timerId: string };
      if (roomManager.removeTimer(client.roomCode, timerId)) {
        broadcast(client.roomCode, buildMessage('timer:removed', { timerId }));
      }
      break;
    }

    default:
      console.warn('[WS] Unknown message type:', type);
  }
}

export function setupWsServer(wss: WebSocketServer) {
  // 心跳检测
  const heartbeatInterval = setInterval(() => {
    for (const [memberId, client] of clients) {
      if (!client.isAlive) {
        client.socket.terminate();
        clients.delete(memberId);
        continue;
      }
      client.isAlive = false;
      try {
        client.socket.ping();
      } catch {
        /* ignore */
      }
    }
  }, 30 * 1000);

  wss.on('connection', (socket: WebSocket, req: IncomingMessage) => {
    const client: WsClient = {
      socket,
      roomCode: '',
      memberId: '',
      isAlive: true,
    };

    console.log('[WS] New connection from', req.socket.remoteAddress);

    socket.on('pong', () => {
      client.isAlive = true;
    });

    socket.on('message', (data) => {
      try {
        handleMessage(client, data.toString());
      } catch (e) {
        console.error('[WS] Handle error:', e);
      }
    });

    socket.on('close', () => {
      console.log('[WS] Connection closed, member:', client.memberId || '(none)');
      if (client.roomCode && client.memberId) {
        // 不主动离开房间（允许断线重连），仅清理 socket 映射
        // 心跳超时后房间状态会自动更新
        const c = clients.get(client.memberId);
        if (c && c.socket === socket) {
          clients.delete(client.memberId);
        }
      }
    });

    socket.on('error', (err) => {
      console.error('[WS] Socket error:', err);
    });

    // 欢迎消息
    socket.send(
      JSON.stringify(buildMessage('welcome', { serverTime: Date.now() }))
    );
  });

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  console.log('[WS] Gateway ready');
}
