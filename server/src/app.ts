/**
 * 火锅计时助手 - 后端主入口
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { WebSocketServer } from 'ws';
import { readFileSync } from 'fs';
import { join } from 'path';
import { setupWsServer } from './ws-gateway';
import { roomManager } from './room-manager';
import type { Food, Pot } from './types';

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// 加载静态数据
const foodsPath = join(__dirname, '..', 'data', 'foods.json');
const potsPath = join(__dirname, '..', 'data', 'pots.json');
const FOODS: Food[] = JSON.parse(readFileSync(foodsPath, 'utf-8'));
const POTS: Pot[] = JSON.parse(readFileSync(potsPath, 'utf-8'));

async function main() {
  const app = Fastify({
    logger: { level: 'info' },
  });

  // 允许小程序跨域访问
  await app.register(cors, {
    origin: true,
  });

  // ======================= HTTP 路由 =======================

  app.get('/', async () => ({
    name: 'Hotpot Timer Server',
    version: '0.1.0',
    status: 'running',
    endpoints: ['/api/foods', '/api/pots', '/api/time', '/api/stats', 'WS /ws'],
  }));

  // 食材库
  app.get('/api/foods', async () => {
    return { foods: FOODS, total: FOODS.length };
  });

  // 锅底库
  app.get('/api/pots', async () => {
    return { pots: POTS, total: POTS.length };
  });

  // 服务器时间（用于客户端时钟校准）
  app.get('/api/time', async () => {
    return { serverTime: Date.now() };
  });

  // 房间是否存在（加入前预检）
  app.get<{ Params: { code: string } }>('/api/rooms/:code', async (req, reply) => {
    const code = req.params.code.toUpperCase();
    const room = roomManager.getRoom(code);
    if (!room || room.status !== 'active') {
      return reply.code(404).send({ error: 'ROOM_NOT_FOUND', msg: '房间不存在或已解散' });
    }
    return {
      code: room.code,
      memberCount: room.members.size,
      createdAt: room.createdAt,
    };
  });

  // 监控统计
  app.get('/api/stats', async () => {
    return {
      ...roomManager.stats(),
      foodsCount: FOODS.length,
      potsCount: POTS.length,
      uptime: process.uptime(),
    };
  });

  // ======================= 启动 HTTP =======================

  await app.listen({ port: PORT, host: HOST });

  // ======================= WebSocket =======================
  // 基于 Fastify 的 HTTP server 启动 WS
  const wss = new WebSocketServer({
    server: app.server,
    path: '/ws',
  });

  setupWsServer(wss);

  app.log.info(`🔥 Hotpot Timer Server running at http://${HOST}:${PORT}`);
  app.log.info(`📡 WebSocket endpoint: ws://${HOST}:${PORT}/ws`);

  // 优雅退出
  const shutdown = async () => {
    app.log.info('Shutting down...');
    wss.close();
    await app.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
