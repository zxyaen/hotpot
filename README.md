# 🔥 火锅计时助手 (Hotpot Timer)

一个帮你涮火锅时掌控火候的微信小程序。支持多食材并行计时、到时提醒、同桌多人实时同步。

## ✨ 核心功能

- 🍲 **多种锅底** - 清汤/番茄/麻辣/牛油/菌菇，自动适配涮煮时间
- 🥩 **40+ 食材库** - 参考海底捞推荐时间，三段式（安全/推荐/最长），数据存储于 CloudBase 数据库
- ⏱️ **多路并行计时** - 最多同时计时 8 个食材
- 🔔 **到时提醒** - 震动 + 声音 + 屏幕提示
- 👥 **同桌多人同步** - 创建房间，朋友扫码加入，全桌共享计时看板（WebSocket 实时通信）
- ⭐ **收藏组合** - 常点食材套餐一键启动
- 📜 **历史记录** - 回看每次火锅聚餐

## 🏗️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | 微信小程序原生 + TypeScript + MobX-miniprogram |
| 后端 | Node.js 18 / Fastify / ws |
| 存储 | CloudBase 数据库（食材/锅底数据）+ 内存 Map（房间实时状态）|
| 部署 | 腾讯云 CloudBase 云托管 |
| 通信 | HTTPS + WebSocket (wss) |

## 📁 项目结构

```
hotpot-timer/
├── miniprogram/            # 微信小程序端
│   ├── pages/
│   │   ├── home/           # 首页（锅底选择 & 进房间）
│   │   ├── foods/          # 食材选择 & 计时看板
│   │   ├── room/           # 多人房间
│   │   ├── pot/            # 锅底详情
│   │   ├── history/        # 历史记录
│   │   └── settings/       # 设置
│   ├── stores/             # MobX 全局状态
│   ├── services/           # API / WebSocket / 通知服务
│   └── utils/
│       └── config.ts       # 服务器地址配置（改这里切换环境）
├── server/                 # 后端服务
│   ├── src/
│   │   ├── app.ts          # 主入口 & API 路由
│   │   ├── ws-gateway.ts   # WebSocket 多人同步网关
│   │   ├── room-manager.ts # 房间管理
│   │   └── types.ts        # 类型定义
│   ├── data/               # 食材/锅底兜底 JSON（数据库不可用时使用）
│   └── Dockerfile
└── docs/                   # 文档（PRD/技术方案）
```

## 🚀 本地开发

### 后端
```bash
cd server
npm install
npm run dev    # 本地开发，端口 3000
```

### 小程序
1. 用**微信开发者工具**打开项目根目录（含 `project.config.json`）
2. 填入自己的 AppID（测试可用测试号）
3. 开发调试时勾选「不校验合法域名」
4. 修改 `miniprogram/utils/config.ts` 将地址指向本地或线上服务

## ☁️ 线上部署

后端已部署到 **腾讯云 CloudBase 云托管**：

| 项目 | 地址 |
|------|------|
| 后端默认域名 | `https://hotpot-timer-server-249413-6-1307945326.sh.run.tcloudbase.com` |
| WebSocket | `wss://hotpot-timer-server-249413-6-1307945326.sh.run.tcloudbase.com/ws` |
| CloudBase 环境 | `hotpot-d7gn5onbkea76e975` |

### 环境变量（云托管后台配置）

| 变量名 | 说明 |
|--------|------|
| `NODE_ENV` | `production` |
| `TCB_ENV_ID` | CloudBase 环境 ID |
| `TCB_SECRET_ID` | 腾讯云 SecretId（可选，云托管内置身份免配） |
| `TCB_SECRET_KEY` | 腾讯云 SecretKey（可选） |

### 重新部署

```bash
# 在项目根目录下执行
cd server
tcb login --apiKeyId <SecretId> --apiKey <SecretKey>
# 将 server 目录复制到 ~/.mcporter/ 后执行：
mcporter call cloudbase manageCloudRun \
  --args '{"action":"deploy","serverName":"hotpot-timer-server","envId":"hotpot-d7gn5onbkea76e975","targetPath":"hotpot-server"}'
```

## 📊 API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/stats` | 服务器状态（房间数、食材数等）|
| GET | `/api/foods` | 获取全部食材列表 |
| GET | `/api/pots` | 获取全部锅底列表 |
| WS | `/ws` | WebSocket 多人同步连接 |

## 📦 版本规划

- [x] v0.1.0 - 项目骨架 & 食材库
- [x] v0.2.0 - 单机版核心功能（计时、食材选择、锅底）
- [x] v0.3.0 - 后端部署（CloudBase 云托管 + 数据库）
- [x] v0.4.0 - 多人同步（WebSocket 房间同步）
- [ ] v1.0.0 - 打磨上线（订阅消息、收藏组合、性能优化）

## 📄 相关文档

- PRD 与技术方案: [腾讯文档](https://docs.qq.com/aio/DVWxjZGVLTGNQT052)
- UI 原型: 见 `docs/` 目录

## 📝 License

个人项目，仅供小范围朋友使用。
