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
import cloudbase from '@cloudbase/node-sdk';

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const TCB_ENV_ID = process.env.TCB_ENV_ID || 'hotpot-d7gn5onbkea76e975';
const TCB_SECRET_ID = process.env.TCB_SECRET_ID || '';
const TCB_SECRET_KEY = process.env.TCB_SECRET_KEY || '';

// 本地兜底数据（数据库不可用时使用）
const foodsPath = join(__dirname, '..', 'data', 'foods.json');
const potsPath = join(__dirname, '..', 'data', 'pots.json');
const FALLBACK_FOODS: Food[] = JSON.parse(readFileSync(foodsPath, 'utf-8'));
const FALLBACK_POTS: Pot[] = JSON.parse(readFileSync(potsPath, 'utf-8'));

// 内存缓存（避免每次请求查数据库）
let cachedFoods: Food[] | null = null;
let cachedPots: Pot[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10分钟

// 初始化 CloudBase SDK
function getDb() {
  const app = cloudbase.init({
    env: TCB_ENV_ID,
    secretId: TCB_SECRET_ID,
    secretKey: TCB_SECRET_KEY,
  });
  return app.database();
}

// 从数据库加载食材
async function loadFoods(): Promise<Food[]> {
  const now = Date.now();
  if (cachedFoods && now - cacheTime < CACHE_TTL) return cachedFoods;
  try {
    const db = getDb();
    const res = await db.collection('foods').limit(100).get();
    if (res.data && res.data.length > 0) {
      cachedFoods = res.data as Food[];
      cacheTime = now;
      return cachedFoods;
    }
  } catch (e) {
    console.error('读取foods数据库失败，使用本地数据:', e);
  }
  return FALLBACK_FOODS;
}

// 从数据库加载锅底
async function loadPots(): Promise<Pot[]> {
  const now = Date.now();
  if (cachedPots && now - cacheTime < CACHE_TTL) return cachedPots;
  try {
    const db = getDb();
    const res = await db.collection('pots').limit(20).get();
    if (res.data && res.data.length > 0) {
      cachedPots = res.data as Pot[];
      return cachedPots;
    }
  } catch (e) {
    console.error('读取pots数据库失败，使用本地数据:', e);
  }
  return FALLBACK_POTS;
}

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

  // 食材库（从CloudBase数据库读取，有缓存）
  app.get('/api/foods', async () => {
    const foods = await loadFoods();
    return { foods, total: foods.length };
  });

  // 锅底库（从CloudBase数据库读取，有缓存）
  app.get('/api/pots', async () => {
    const pots = await loadPots();
    return { pots, total: pots.length };
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
    const [foods, pots] = await Promise.all([loadFoods(), loadPots()]);
    return {
      ...roomManager.stats(),
      foodsCount: foods.length,
      potsCount: pots.length,
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
