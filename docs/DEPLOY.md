# 🚀 CloudBase 云托管部署指南

本文档指导你将**火锅计时助手**后端服务部署到腾讯云 CloudBase 云托管。

---

## 一、前置准备

### 1. 注册腾讯云账号
前往 https://cloud.tencent.com 注册，完成实名认证。

### 2. 开通 CloudBase 环境
1. 进入控制台：https://console.cloud.tencent.com/tcb
2. 点击「新建环境」
3. 选择「按量计费」（自用推荐，低流量几乎免费）
4. 地域选「上海」或「广州」
5. 记录下你的 **环境 ID**（形如 `hotpot-xxxxxx`），后续要用

---

## 二、部署后端服务（云托管）

### 方式一：控制台上传（新手推荐）

1. 打开 CloudBase 控制台 → 选择你的环境 → 左侧「云托管」
2. 点击「新建服务」，服务名填 `hotpot-timer-server`
3. 上传方式选「本地代码包」，将 `server/` 目录打包为 zip 上传
4. 「Dockerfile 路径」填 `Dockerfile`
5. 端口填 `3000`
6. 最小实例数建议设 `0`（空闲时缩到0，省费用）
7. 配置规格：**0.25 CPU / 256MB 内存**（最低规格，够用）
8. 点击「部署」，等待 3-5 分钟构建完成

### 方式二：CLI 部署

```bash
# 安装 CloudBase CLI
npm install -g @cloudbase/cli

# 登录（会弹出浏览器授权）
cloudbase login

# 将 cloudbaserc.json 中的 {{YOUR_ENV_ID}} 替换为你的环境ID，然后：
cloudbase run deploy --env <你的环境ID>
```

---

## 三、获取服务域名

部署完成后，在「云托管」→「服务详情」中可以看到：
- **默认域名**（免费、自带HTTPS）：形如 `xxx.ap-shanghai.run.tcloudbase.com`
- 这个域名就是你的后端地址，**小程序直接访问，无需备案**

---

## 四、配置微信小程序

### 1. 填入后端地址
打开 `miniprogram/utils/config.ts`（如不存在则在 `app.ts` 中修改），将服务器地址改为你的 CloudBase 域名：

```typescript
// miniprogram/utils/config.ts
export const API_BASE = 'https://xxx.ap-shanghai.run.tcloudbase.com';
export const WS_BASE  = 'wss://xxx.ap-shanghai.run.tcloudbase.com/ws';
```

### 2. 在微信公众平台配置合法域名
1. 登录 https://mp.weixin.qq.com → 「开发」→「开发管理」→「服务器域名」
2. 添加：
   - **request 合法域名**：`https://xxx.ap-shanghai.run.tcloudbase.com`
   - **socket 合法域名**：`wss://xxx.ap-shanghai.run.tcloudbase.com`

---

## 五、费用预估

| 资源 | 规格 | 预估费用 |
|------|------|---------|
| 云托管计算 | 0.25C/256M，按量 | 约 0-5 元/月（低流量） |
| 云托管流量 | 个人自用 | 几乎 0 |
| CloudBase 环境 | 按量计费 | 免费额度内 0 元 |
| **合计** | | **约 0-10 元/月** |

> 💡 新用户腾讯云有免费额度，前几个月可能完全免费

---

## 六、本地开发调试

不部署也可以本地测试：

```bash
# 启动后端
cd server
npm install
npm run dev   # 监听 http://localhost:3000

# 微信开发者工具：
# 设置 → 项目设置 → 勾选「不校验合法域名」
# 将 API_BASE 改为 http://localhost:3000 即可联调
```

---

## 七、日志与监控

部署后可在 CloudBase 控制台 → 云托管 → 日志中查看实时日志，方便排查问题。
