# 熟了吗？业务流程文档

> 版本：v0.2.0 | 基于小程序代码梳理 | 2026-04-22

---

## 一、整体架构

### 1.1 页面结构

| 页面 | 路由 | 功能 |
|------|------|------|
| 计时主页 | `/pages/home/index` | 查看/管理正在进行的计时器 |
| 食材库 | `/pages/foods/index` | 浏览食材、搜索、收藏、发起计时 |
| 同桌火锅 | `/pages/room/index` | 多人实时同步计时（大厅 + 房间） |
| 历史记录 | `/pages/history/index` | 查看过往火锅记录 |
| 设置 | `/pages/settings/index` | 用户偏好、提醒设置、时间偏好 |
| 自定义食材 | `/pages/custom-food/index` | 新增/编辑自定义食材 |
| 自定义锅底 | `/pages/custom-pot/index` | 新增/编辑自定义锅底 |
| 锅底选择 | `/pages/pot/index` | 选择当前锅底 |

### 1.2 全局 Store

| Store | 职责 |
|-------|------|
| `TimerStore` | 单人模式所有计时器，含锅底状态、历史记录 |
| `RoomStore` | 多人 WebSocket 连接、房间成员、共享计时器 |
| `SettingStore` | 用户昵称、头像、提醒偏好、时间偏好、收藏 |
| `CustomDataStore` | 用户自定义食材和锅底 |

---

## 二、单人计时流程

### 2.1 主流程

```
用户进入「计时主页」
  │
  ├─ [未选锅底] → 点击「选择锅底」→ 跳转 pot 页面选择 → 返回
  │
  ├─ 点击「下菜开始计时」→ 跳转「食材库」选食材
  │     └─ 点击食材 → TimerStore.addTimer(foodId, timePreference)
  │           └─ 计算时长 = 基础时长 × 锅底时间因子
  │           └─ 最多同时 8 个计时器
  │           └─ 返回「计时主页」展示新计时器
  │
  └─ 计时器展示（每秒刷新）
        ├─ running + 剩余 > 40% 总时长 → 绿色「最佳口感」
        ├─ running + 剩余 ≤ 40% 总时长 → 黄色「还差一点」
        ├─ running + 剩余 = 0 → 红色「到时了」+ 弹出提醒弹窗 + 抖动动画
        ├─ done → 灰色「已完成」
        └─ cancelled → 灰色「已取消」
```

### 2.2 计时器卡片操作

| 状态 | 可操作 |
|------|--------|
| running（未到时） | 取消（弹确认框） |
| running（到时）  | ✓ 我已捞出（标为 done） |
| done / cancelled | 移除（直接删除） |

### 2.3 批量操作

1. 点击「批量取消」→ 进入批量模式
2. 点击卡片（仅 running 未到时的可选）→ 勾选/取消勾选
3. 工具栏：全选 / 取消计时（弹确认框）
4. 点击「完成」退出批量模式

### 2.4 底部批量工具栏（正常模式）

| 按钮 | 行为 |
|------|------|
| 清除已完成 | 移除所有 done/cancelled 的计时器，无需确认 |
| 批量取消 | 进入批量选择模式 |
| 结束本次 | 弹确认框，保存到历史并清空全部 |

### 2.5 到时提醒弹窗

- 触发时机：某 timer 剩余时间首次降到 0
- 内容：食材 emoji（大字动画）+ 食材名 + 提示文案
- 操作：「✓ 我已捞出」→ 标为 done；点遮罩关闭（不修改状态）

---

## 三、食材库流程

### 3.1 食材列表

- 分类过滤：全部 / ⭐ 收藏 / 各食材分类 / 自定义
- 搜索：按食材名称实时过滤
- 展示时长：根据当前锅底和时间偏好（min/recommended/max）动态计算
- 食材卡片：emoji + 名称 + 分类标签 + 推荐时长 + 收藏按钮 + 开始计时按钮
- 长按自定义食材 → 跳转编辑页

### 3.2 收藏

- 点击 ⭐ 切换收藏状态（持久化到 SettingStore）
- 「⭐ 收藏」分类只展示已收藏食材

### 3.3 自定义食材

- 进入「自定义」分类 → 点击「+ 新增食材」跳转 `/pages/custom-food/index`
- 字段：名称、emoji、分类、最短/推荐/最长时间、提示文字

---

## 四、锅底选择流程

### 4.1 内置锅底（7种）

| 锅底 | emoji | 时间因子 | 温度 |
|------|-------|---------|------|
| 清汤锅 | 🥘 | 1.0 | 100°C |
| 番茄锅 | 🍅 | 1.05 | 98°C |
| 麻辣锅 | 🌶️ | 0.95 | 105°C |
| 牛油锅 | 🔥 | 0.9 | 110°C |
| 菌菇锅 | 🍄 | 1.0 | 100°C |
| 酸菜锅 | 🥬 | 1.0 | 100°C |
| 鸳鸯锅 | ☯️ | 0.95 | 105°C |

### 4.2 时间因子逻辑

```
最终时长 = round(食材基础时长 × 锅底时间因子)
```

### 4.3 房间内换锅底

- 只有房主（isHost）可以换锅底
- 换锅底时发送 `room:set-pot` WS 消息，全房间同步

---

## 五、多人同桌（Room）流程

### 5.1 大厅视图

```
进入同桌火锅页 → 大厅视图
  │
  ├─ 填写信息：选头像（8种 emoji） + 输入昵称（≤8字）
  │
  ├─ 「创建房间」→ WS connect → 发送 room:create
  │       └─ 收到 room:state → 进入「房间视图」，自己为房主 👑
  │
  └─ 「加入房间」→ 输入4位数字房间码 → 发送 room:join
          └─ 收到 room:state → 进入「房间视图」
```

### 5.2 房间视图

```
房间视图
  ├─ 顶部：房间码（点击复制）+ 当前锅底 + WebSocket 状态灯
  ├─ 成员列表：头像 + 昵称 + 在线状态点 + 房主皇冠
  └─ 计时列表
        ├─ 进度条（背景层）
        ├─ 食材 emoji + 名称 + 发起人（头像 + 昵称）
        ├─ 倒计时数字 + 状态文字
        └─ 操作按钮（房主 or 自己才显示）
              ├─ running：「✓ 捞起」/「✕ 取消」
              └─ done/cancelled：「🗑 移除」
```

### 5.3 WebSocket 消息协议

#### 客户端 → 服务端

| 消息类型 | payload | 说明 |
|---------|---------|------|
| `room:create` | `{nickname, avatar}` | 创建房间 |
| `room:join` | `{code, nickname, avatar, [memberId]}` | 加入房间 |
| `room:leave` | `{}` | 离开房间 |
| `room:set-pot` | `{potId}` | 切换锅底（仅房主） |
| `timer:add` | `{foodId, foodName, foodEmoji, duration, startAt}` | 添加计时器 |
| `timer:update` | `{timerId, status}` | 更新状态（done/cancelled） |
| `timer:remove` | `{timerId}` | 移除计时器 |
| `ping` | `{}` | 心跳（每 20 秒） |

#### 服务端 → 客户端

| 消息类型 | payload | 说明 |
|---------|---------|------|
| `welcome` | `{ts}` | 连接成功，服务端时间戳 |
| `pong` | `{serverTime}` | 心跳响应，用于时钟校准 |
| `room:state` | `{code, potId, members, timers, you}` | 全量同步房间状态 |
| `room:member-join` | `{member}` | 有人进入 |
| `room:member-leave` | `{memberId}` | 有人离开 |
| `room:pot-changed` | `{potId}` | 锅底更换 |
| `timer:added` | `{timer}` | 新增计时器 |
| `timer:updated` | `{timer}` | 计时器状态更新 |
| `timer:removed` | `{timerId}` | 计时器删除 |
| `error` | `{msg}` | 错误信息 |

### 5.4 断线重连

- 非主动断开 + 仍在房间时：指数退避重连（1s, 2s, 4s… 最多 5 次）
- 重连成功后：重新发送 `room:join` 携带 memberId 恢复身份

### 5.5 服务端时钟校准

- 收到 `welcome` 或 `pong` 时计算 `serverTimeOffset = serverTime - clientTime`
- `getRemaining` 计算时使用 `Date.now() + serverTimeOffset`，确保多端倒计时一致

---

## 六、设置流程

### 6.1 配置项

| 配置 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| 昵称 | text | 火锅达人 | 多人模式显示名 |
| 头像 | emoji | 🍲 | 从 10 个 emoji 中选 |
| 声音提醒 | switch | true | 到时播放提示音 |
| 震动提醒 | switch | true | 到时震动 |
| 时间偏好 | radio | recommended | min/recommended/max 三档 |

### 6.2 时间偏好说明

| 偏好 | 取值字段 | 描述 |
|------|---------|------|
| 最短安全 | `cookTime.min` | 刚熟，口感最嫩 |
| 推荐时间 | `cookTime.recommended` | 平衡最佳口感（默认） |
| 完全煮熟 | `cookTime.max` | 入味更安全 |

---

## 七、数据模型

### 7.1 TimerItem

```typescript
interface TimerItem {
  id: string;           // uuid
  foodId: string;       // 对应食材 ID
  foodName: string;     // 食材名称
  foodEmoji: string;    // 食材 emoji
  startAt: number;      // 开始时间戳（ms）
  duration: number;     // 总时长（秒）
  status: 'running' | 'done' | 'cancelled';
}
```

### 7.2 RoomTimer（多人）

```typescript
interface RoomTimer extends TimerItem {
  ownerId: string;          // 发起人 ID
  ownerNickname: string;    // 发起人昵称
  ownerAvatar: string;      // 发起人头像
}
```

### 7.3 RoomMember

```typescript
interface RoomMember {
  id: string;
  nickname: string;
  avatar: string;       // emoji
  isHost: boolean;
  online: boolean;
  joinAt: number;
}
```

### 7.4 HistoryRecord

```typescript
interface HistoryRecord {
  id: string;
  date: number;                     // 结束时间戳
  potId: string;
  potName: string;
  foodCount: number;
  durationMin: number;              // 本次火锅持续分钟数
  foods: Array<{foodName: string; foodEmoji: string}>;
}
```

---

## 八、交互规范

### 8.1 确认类操作（需弹确认框）

- 取消单个计时器
- 批量取消选中的计时器
- 结束本次（清空并保存历史）
- 离开房间

### 8.2 直接操作（无需确认）

- 清除已完成（done/cancelled）
- 移除单个 done/cancelled 计时器
- 选择锅底
- 收藏/取消收藏食材

### 8.3 Toast 提示

- 加入计时成功：`${emoji} ${食材名} 开始计时`
- 批量取消成功：`已取消 ${n} 个`
- 结束本次成功：`已保存到历史`
- 复制房间码成功：`房间码已复制`

### 8.4 特殊状态提示

- 计时器超过 8 个：`同时最多计时8个`
- 非房主换锅底：`只有房主可以选择锅底`
- 昵称为空创建/加入：`请输入昵称`
- 房间码不足 4 位：`请输入房间码`

---

## 九、H5 适配要点

### 9.1 布局固定

- 顶部 Header：`position: fixed; top: 0`，含 safe-area-inset-top
- 底部 TabBar：`position: fixed; bottom: 0`，含 safe-area-inset-bottom
- 底部操作栏（「下菜开始计时」按钮）：固定在 TabBar 上方
- 页面内容区：`padding-top: [header高度]; padding-bottom: [tabbar+操作栏高度]`

### 9.2 弹窗规范（禁用 alert/confirm/prompt）

| 原生 API | H5 替换方案 |
|---------|------------|
| `wx.showModal` | Toast/Dialog 组件（从下方弹出的半屏 Sheet） |
| `wx.showToast` | 轻提示 Toast 组件（顶部或中部） |
| `wx.showActionSheet` | ActionSheet 组件 |
| `window.alert` / `window.confirm` | 统一 Dialog 组件 |

### 9.3 移动端组件库选型

推荐使用 **Vant**（vant-contrib）轻量级移动端组件库：
- `Dialog` — 替代 confirm 弹窗
- `Toast` — 替代 showToast
- `ActionSheet` — 操作菜单
- `Popup` — 半屏弹窗（食材选择、锅底选择）
- `NavBar` — 顶部导航栏
- `TabBar` — 底部导航栏

### 9.4 食材选择弹窗规范

- 固定为半屏高度（50vh）
- 分类 Tab 横向滚动
- 食材列表可纵向滚动
- 选择食材后不关闭（连续选多个）
- 点击遮罩 / 关闭按钮才关闭

### 9.5 房间码输入

- 仅允许数字输入
- maxlength=4
- 大字号居中显示，letter-spacing 间距

---

## 十、已知 H5 与小程序差异

| 功能 | 小程序 | H5 |
|------|--------|-----|
| 屏幕常亮 | `wx.setKeepScreenOn` | Web Lock API（需用户授权）|
| 震动 | `wx.vibrate` | `navigator.vibrate` |
| 扫码 | `wx.scanCode` | 不支持，隐藏扫码按钮 |
| 存储 | `wx.setStorageSync` | `localStorage` |
| 路由 | `wx.navigateTo` | React state 切换 |
| 分享 | `wx.showShareMenu` | Web Share API / 复制链接 |
