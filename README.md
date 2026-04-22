# 🍲 熟了吗？(Hotpot Timer)

> 涮火锅计时助手 —— 帮你精准掌控每种食材的最佳出锅时机

支持多食材并行计时、智能锅底时间适配、同桌多人实时同步，提供**微信小程序**和 **H5（React）** 双端体验。

---

## 🌐 在线体验

| 平台 | 入口 |
|------|------|
| H5 网页版 | [hotpot-d7gn5onbkea76e975-1307945326.tcloudbaseapp.com](https://hotpot-d7gn5onbkea76e975-1307945326.tcloudbaseapp.com) |
| 微信小程序 | 使用微信开发者工具导入本项目体验 |

---

## ✨ 核心功能

### 🍖 食材计时
- **40+ 内置食材库** — 参考海底捞推荐时间，覆盖肉类 / 海鲜 / 蔬菜 / 豆制品等分类
- **多路并行计时** — 最多同时计时 8 个食材
- **三色状态系统** — 🔴 生着呢 → 🟡 快好了 → 🟢 到时了，一眼看清进度
- **实时进度条** — 精准显示每种食材的熟成进度
- **批量取消** — 多选计时中的食材，一次全部取消
- **到时提醒** — 弹窗 + 铃声提示，不错过最佳出锅时机

### 🍲 锅底智能适配
- **7 种内置锅底** — 清汤 / 番茄 / 麻辣 / 牛油 / 菌菇 / 猪肚鸡 / 椰子鸡
- **温度系数自动计算** — 不同锅底沸腾温度不同，自动适配涮煮时间
- **三档时间偏好** — 最短安全 / 推荐 / 完全熟透，随时切换

### 🛠️ 自定义扩展
- **自定义食材** — 设置 emoji / 名称 / 分类 / 涮煮时间 / 小贴士
- **自定义锅底** — 设置 emoji / 名称 / 颜色 / 温度 / 时间系数
- **本地持久化** — 自定义数据存于本地，刷新不丢失
- **拼音排序** — 食材库按拼音首字母自动排序，快速定位

### 👥 多人同桌同步
- **4 位房间码** — 快速创建 / 加入房间，全桌共享计时看板
- **WebSocket 实时同步** — 低延迟推送，所有操作实时同步到同桌成员
- **自动重连** — 网络波动后自动恢复连接
- **时间校准** — ping-pong 机制消除客户端时钟偏差

### 📱 H5 体验优化
- **移动端专属 UI** — 固定顶部导航 & 底部 TabBar，不随内容滚动
- **流畅动效** — 食材卡片选中动画、计时器状态颜色切换
- **安全区适配** — 支持 iPhone 刘海 / 圆角屏安全区
- **无滚动条** — 全局隐藏滚动条，界面更简洁

---

## 🏗️ 技术栈

### 微信小程序端
| 层级 | 技术 |
|------|------|
| 框架 | 微信小程序原生 + TypeScript |
| 状态管理 | 自实现 Store（Publisher/Subscriber 模式）|
| 样式 | WXSS + Flex 布局 |

### H5 端
| 层级 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript |
| UI 组件库 | react-vant（移动端组件）|
| 状态管理 | React Context + 自实现 Store |
| 样式 | CSS Modules + CSS 变量 |
| 构建工具 | Create React App |

### 后端 & 部署
| 层级 | 技术 |
|------|------|
| 后端 | Node.js 18 / Fastify / ws |
| 数据库 | 腾讯云 CloudBase 数据库 |
| 实时通信 | WebSocket (wss) |
| 部署 | 腾讯云 CloudBase 云托管（后端）/ 静态托管（H5）|

---

## 📁 项目结构

```
hotpot-timer/
├── miniprogram/                # 微信小程序端
│   ├── pages/
│   │   ├── home/               # 首页（计时看板）
│   │   ├── foods/              # 食材选择（分类/搜索）
│   │   ├── room/               # 多人同桌
│   │   ├── history/            # 历史记录
│   │   ├── settings/           # 设置
│   │   ├── custom-food/        # 自定义食材
│   │   └── custom-pot/         # 自定义锅底
│   ├── stores/
│   │   ├── timer-store.ts      # 计时器状态管理
│   │   ├── room-store.ts       # 多人房间状态
│   │   └── custom-data-store.ts# 用户自定义数据
│   ├── services/               # API / WebSocket / 通知服务
│   └── utils/
│       ├── config.ts           # 服务器地址配置
│       ├── builtin-data.ts     # 内置食材/锅底数据
│       └── helpers.ts          # 工具函数
│
├── h5/                         # H5 React 版本
│   └── src/
│       ├── pages/              # 页面组件（Home / Foods / Room / History / Settings）
│       ├── components/         # 公共组件（FoodPicker / AlertModal 等）
│       ├── stores/             # 状态管理（TimerStore / RoomStore）
│       ├── utils/              # 工具函数 & 内置数据
│       └── context/            # React Context（AppContext）
│
├── server/                     # 后端服务
│   ├── src/
│   │   ├── app.ts              # 主入口 & API 路由
│   │   ├── ws-gateway.ts       # WebSocket 多人同步网关
│   │   ├── room-manager.ts     # 房间管理（TTL / 心跳）
│   │   └── types.ts            # 类型定义
│   └── Dockerfile
│
└── docs/
    ├── business-flow.md        # 业务流程文档
    ├── PRD.md                  # 产品需求文档
    └── DEPLOY.md               # CloudBase 部署指南
```

---

## 🚀 本地开发

### 后端
```bash
cd server
npm install
npm run dev    # 默认端口 3000
```

### H5 版本
```bash
cd h5
npm install
npm start      # 默认端口 3000（可改 PORT=3001 npm start）
```

### 微信小程序
1. 用**微信开发者工具**打开项目根目录（含 `project.config.json`）
2. 填入自己的 AppID
3. 开发调试时勾选「不校验合法域名」
4. 修改 `miniprogram/utils/config.ts` 将地址指向本地或线上服务

---

## ☁️ 线上部署

### 后端（云托管）

| 项目 | 地址 |
|------|------|
| HTTPS API | `https://hotpot-timer-server-249413-6-1307945326.sh.run.tcloudbase.com` |
| WebSocket | `wss://hotpot-timer-server-249413-6-1307945326.sh.run.tcloudbase.com/ws` |
| CloudBase 环境 | `hotpot-d7gn5onbkea76e975` |

### H5（静态托管）

| 项目 | 地址 |
|------|------|
| 访问地址 | `https://hotpot-d7gn5onbkea76e975-1307945326.tcloudbaseapp.com` |

### 环境变量（云托管后台配置）

| 变量名 | 说明 |
|--------|------|
| `NODE_ENV` | `production` |
| `TCB_ENV_ID` | CloudBase 环境 ID |
| `TCB_SECRET_ID` | 腾讯云 SecretId（云托管内置身份可免配）|
| `TCB_SECRET_KEY` | 腾讯云 SecretKey（云托管内置身份可免配）|

详细部署步骤见 [docs/DEPLOY.md](./docs/DEPLOY.md)

---

## 📊 后端 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/stats` | 服务器状态（房间数、在线人数等）|
| GET | `/api/foods` | 获取全部食材列表 |
| GET | `/api/pots` | 获取全部锅底列表 |
| WS | `/ws` | WebSocket 多人同步连接 |

---

## 📦 版本历史

| 版本 | 状态 | 主要内容 |
|------|------|---------|
| v0.1.0 | ✅ | 项目骨架 & 食材库搭建 |
| v0.2.0 | ✅ | 单机版核心计时功能 |
| v0.3.0 | ✅ | CloudBase 云托管 + 数据库接入 |
| v0.4.0 | ✅ | 多人 WebSocket 实时同步 |
| v0.5.0 | ✅ | 体验优化（批量取消 / 时间偏好 / 计时卡片三色状态）|
| v0.6.0 | ✅ | 自定义食材 & 锅底（本地持久化）|
| v0.7.0 | ✅ | H5 React 版本发布，部署到 CloudBase 静态托管 |
| v0.8.0 | ✅ | H5 全面优化（移动端 UI / 布局 fixed / 拼音排序 / 弹窗体验）|
| v1.0.0 | 🚧 | 订阅消息、收藏组合、性能优化、小程序上线审核 |

---

## 📄 相关文档

- [业务流程文档](./docs/business-flow.md)
- [PRD 产品需求文档](./docs/PRD.md)
- [CloudBase 部署指南](./docs/DEPLOY.md)

---

## 📝 License

个人项目，仅供小范围朋友使用。
