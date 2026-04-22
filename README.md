# 🍲 熟了吗？(Hotpot Timer)

一个帮你涮火锅时掌控火候的微信小程序。支持多食材并行计时、智能锅底时间适配、同桌多人实时同步，以及完整的自定义食材 / 锅底能力。

---

## ✨ 核心功能

### 🍖 食材计时
- **40+ 食材库** — 参考海底捞推荐时间，数据存储于 CloudBase 数据库
- **三档时间偏好** — 最短安全 / 推荐 / 完全煮熟，随时切换
- **多路并行计时** — 最多同时计时 8 个食材
- **批量取消** — 多选计时中的食材，一次全部取消
- **到时提醒** — 声音 + 屏幕提示

### 🍲 锅底智能适配
- **7 种内置锅底** — 清汤 / 番茄 / 麻辣 / 牛油 / 菌菇等
- **温度系数自动计算** — 不同锅底沸腾温度不同，自动调整涮煮时间
- **时间偏好 × 锅底系数联合计算** — 双维度精准控时

### 🛠️ 自定义扩展
- **自定义食材** — 设置名称、emoji 图标、分类、涮煮时间、描述
- **自定义锅底** — 设置名称、emoji 图标、颜色、温度系数
- **本地优先策略** — 自定义数据存于微信 localStorage，优先级高于数据库
- **长按编辑 / 删除** — 已添加的自定义项可随时修改

### 👥 多人同步
- **创建 / 加入房间** — 生成 6 位房间码，全桌共享计时看板
- **WebSocket 实时同步** — 低延迟，断线自动重连
- **时间校准** — ping-pong 机制消除客户端时钟偏差

### 📜 其他
- **历史记录** — 回看每次火锅聚餐（含中文锅底名）
- **收藏食材** — 常点食材快速找到
- **离线可用** — 无网络时内置数据兜底，核心计时功能正常使用

---

## 🏗️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | 微信小程序原生 + TypeScript + MobX-miniprogram |
| 后端 | Node.js 18 / Fastify / ws |
| 存储 | CloudBase 数据库（食材/锅底数据）+ 内存 Map（房间实时状态）+ 微信 localStorage（用户自定义）|
| 部署 | 腾讯云 CloudBase 云托管 |
| 通信 | HTTPS + WebSocket (wss) |

---

## 📁 项目结构

```
hotpot-timer/
├── miniprogram/                # 微信小程序端
│   ├── pages/
│   │   ├── home/               # 首页（计时看板 & 进入多人房间）
│   │   ├── foods/              # 食材选择（分类/搜索/收藏）
│   │   ├── pot/                # 锅底选择
│   │   ├── room/               # 多人房间
│   │   ├── history/            # 历史记录
│   │   ├── settings/           # 设置（时间偏好）
│   │   ├── custom-food/        # 自定义食材（增删改）
│   │   └── custom-pot/         # 自定义锅底（增删改）
│   ├── stores/
│   │   ├── timer-store.ts      # 计时器状态管理
│   │   ├── room-store.ts       # 多人房间状态
│   │   └── custom-data-store.ts# 用户自定义数据管理
│   ├── services/               # API / WebSocket / 通知服务
│   └── utils/
│       ├── config.ts           # 服务器地址配置（改这里切换环境）
│       ├── builtin-data.ts     # 内置食材/锅底数据（兜底用）
│       └── helpers.ts          # 工具函数
├── server/                     # 后端服务
│   ├── src/
│   │   ├── app.ts              # 主入口 & API 路由
│   │   ├── ws-gateway.ts       # WebSocket 多人同步网关
│   │   ├── room-manager.ts     # 房间管理（TTL / 心跳）
│   │   └── types.ts            # 类型定义
│   ├── data/                   # 食材/锅底兜底 JSON（数据库不可用时使用）
│   └── Dockerfile
└── docs/
    ├── PRD.md                  # 产品需求文档
    └── DEPLOY.md               # CloudBase 部署指南
```

---

## 🚀 本地开发

### 后端
```bash
cd server
npm install
npm run dev    # 本地开发，端口 3000
```

### 小程序
1. 用**微信开发者工具**打开项目根目录（含 `project.config.json`）
2. 填入自己的 AppID（`wxf304d22adf6f7892` 或测试号）
3. 开发调试时勾选「不校验合法域名」
4. 修改 `miniprogram/utils/config.ts` 将地址指向本地或线上服务

---

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
| `TCB_SECRET_ID` | 腾讯云 SecretId（可选，云托管内置身份免配）|
| `TCB_SECRET_KEY` | 腾讯云 SecretKey（可选）|

详细部署步骤见 [docs/DEPLOY.md](./docs/DEPLOY.md)

---

## 📊 API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/stats` | 服务器状态（房间数、食材数等）|
| GET | `/api/foods` | 获取全部食材列表（含自定义合并）|
| GET | `/api/pots` | 获取全部锅底列表 |
| WS | `/ws` | WebSocket 多人同步连接 |

---

## 📦 版本历史

| 版本 | 状态 | 主要内容 |
|------|------|---------|
| v0.1.0 | ✅ | 项目骨架 & 食材库 |
| v0.2.0 | ✅ | 单机版核心计时功能 |
| v0.3.0 | ✅ | CloudBase 云托管 + 数据库 |
| v0.4.0 | ✅ | 多人 WebSocket 实时同步 |
| v0.5.0 | ✅ | 体验优化（更名/图标/震动/批量取消/时间偏好）|
| v0.6.0 | ✅ | 自定义食材 & 锅底（本地优先策略）|
| v1.0.0 | 🚧 | 订阅消息、收藏组合、性能优化、上线审核 |

---

## 📄 相关文档

- [PRD 产品需求文档](./docs/PRD.md)
- [CloudBase 部署指南](./docs/DEPLOY.md)
- [腾讯文档在线版](https://docs.qq.com/aio/DVWxjZGVLTGNQT052)

---

## 📝 License

个人项目，仅供小范围朋友使用。
