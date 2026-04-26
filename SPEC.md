# 好学伴 - 学习打卡与愿望激励系统

## 1. 概念与愿景

一个帮助学生养成学习习惯的互动平台，通过任务管理、打卡激励和愿望奖励系统，让学习变得有目标、有动力、有收获。家长可以全程参与监督，培养孩子自律。

**核心理念**：完成任务获得积分和奖励，让学习变得有期待。

---

## 2. 设计语言

### 2.1 美学方向
清新学习风格，以蓝色渐变为核心，搭配温暖的金色作为奖励色，营造积极向上的学习氛围。

### 2.2 色彩系统
```css
:root {
  /* 主色调 */
  --primary: #4b6cb7;
  --primary-dark: #3a5795;
  --secondary: #182848;

  /* 辅助色 */
  --success: #4CAF50;
  --warning: #FF9800;
  --danger: #F44336;

  /* 背景色 */
  --bg: #f5f7fa;
  --card: #ffffff;

  /* 文字色 */
  --text: #333;
  --text-light: #666;

  /* 特殊色 */
  --gold: #FFD700;
  --gold-light: #FFF9C4;

  /* 任务类型 */
  --required: #e74c3c;      /* 必须项 - 红色边框 */
  --optional: #4CAF50;     /* 选做项 - 绿色边框 */
  --completed: #9e9e9e;   /* 已完成 - 灰色 */
}
```

### 2.3 字体
- 主字体：`-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif`
- 数字/时间：`"SF Mono", "Consolas", monospace`

### 2.4 间距系统
- 基础单位：4px
- 间距梯度：4, 8, 12, 16, 24, 32, 48px
- 卡片圆角：12px
- 按钮圆角：8px

### 2.5 动效哲学
- 过渡时长：200-300ms
- 缓动曲线：`cubic-bezier(0.4, 0, 0.2, 1)`
- 掉落动画：弹跳效果 + 金色闪光
- 完成反馈：打勾动画 + 积分飘字

---

## 3. 布局与结构

### 3.1 页面架构
```
┌─────────────────────────────────────────────────────────────────┐
│  Header (家长/学生 切换 | 账号菜单)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────┐ │ ┌──────────────────────┐          │
│  │      📅 日任务         │ │ │      📆 周任务         │          │
│  │                       │ │ │                       │          │
│  │  必须项 (红色标记)      │ │ │  本周进度            │          │
│  │  [ ] 数学练习 30min    │ │ │  ██████░░░░ 60%      │          │
│  │  [✓] 英语单词 20min    │ │ │                       │          │
│  │                       │ │ │  必须项               │          │
│  │  选做项 (绿色标记)      │ │ │  [■] 完成5天 3/5     │          │
│  │  [ ] 阅读30分钟        │ │ │                       │          │
│  │  [✓] 练字15分钟        │ │ │  选做项               │          │
│  │                       │ │ │  [□] 完成所有选做3天  │          │
│  │  + 添加任务             │ │ │                       │          │
│  └──────────────────────┘ │ └──────────────────────┘          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                  │
│  │今日学习│ │运动时间│ │积分余额│ │愿望卡片│                  │
│  │ 2.5h   │ │ 0.5h   │ │ 1250   │ │ 3张待兑│                  │
│  └────────┘ └────────┘ └────────┘ └────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 视图切换
- 学生端：任务视图 / 积分商店 / 愿望池 / 我的奖励
- 家长端：任务管理 / 数据统计 / 愿望审批 / 账号设置

### 3.3 响应式策略
- 桌面端：左右分栏（日任务 | 周任务）
- 平板端：左右分栏但更窄
- 移动端：上下切换（日任务 → 周任务）

---

## 4. 功能与交互

### 4.1 账号系统

#### 4.1.1 家长注册
- 输入：用户名、密码、确认密码
- 验证：用户名唯一性检查
- 完成后：生成邀请码（6位字母数字）

#### 4.1.2 学生绑定
- 输入：邀请码、自己的用户名、密码
- 验证：邀请码有效性检查
- 完成后：与家长账号关联

#### 4.1.3 登录流程
- 用户名/密码登录
- 登录后检测角色（家长/学生）
- 跳转对应首页

#### 4.1.4 账号菜单
- 切换账号
- 修改密码
- 退出登录（仅退出不解绑）

### 4.2 时长监控系统

#### 4.2.1 监控机制
```javascript
// 监控事件
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // 开始记录切出
    startTracking();
  } else {
    // 结束记录
    endTracking();
  }
});

// 窗口失焦（备用）
window.addEventListener('blur', () => { startTracking(); });
window.addEventListener('focus', () => { endTracking(); });
```

#### 4.2.2 记录数据结构
```javascript
{
  date: "2024-03-15",
  sessions: [
    { startTime: "14:32:15", duration: 323 }, // 5分23秒
    { startTime: "15:05:42", duration: 728 }, // 12分08秒
    { startTime: "16:48:33", duration: 165 }  // 2分45秒
  ],
  totalCount: 3,
  totalDuration: 1216 // 20分16秒
}
```

#### 4.2.3 家长端展示
- 按日期查看明细列表
- 显示每次切出的时间点和时长
- 当天/当周/当月汇总统计
- 可导出CSV

### 4.3 任务管理系统

#### 4.3.1 任务分类
```javascript
const TaskType = {
  DAILY_REQUIRED: 'daily_required',   // 日必须
  DAILY_OPTIONAL: 'daily_optional',   // 日选做
  WEEKLY_REQUIRED: 'weekly_required', // 周必须
  WEEKLY_OPTIONAL: 'weekly_optional'  // 周选做
};
```

#### 4.3.2 任务数据结构
```javascript
{
  id: "task_001",
  type: "daily_required",
  name: "数学练习",
  description: "完成练习册第10页",
  plannedDuration: 30, // 分钟
  repeatType: "daily", // 每天/每周/自定义
  pointsReward: 10,
  pointsPenalty: -5,
  createdAt: timestamp,
  templateId: null // 来自模板的ID
}
```

#### 4.3.3 任务创建（模板复制）
1. 点击"添加任务" → 选择"从模板复制"
2. 显示历史任务列表（按最近使用排序）
3. 选择任务 → 自动填充
4. 修改日期范围和参数 → 保存

#### 4.3.4 打卡流程
1. 点击任务"开始"按钮
2. 进入计时模式（可最小化/切标签后台计时）
3. 点击"完成" → 弹出学习总结（五星评价）
4. 记录实际用时
5. 判定是否触发掉落

### 4.4 掉落机制

#### 4.4.1 掉落规则
| 触发条件 | 掉落内容 | 触发时机 |
|---------|---------|---------|
| 完成一个日必须项 | 积分+10~30 | 即时 |
| 完成2项日选做项 | 积分+20~50 | 即时 |
| 完成所有日必须项 | 积分+50 | 即时 |
| 每周随机时刻 | 愿望卡×1 | 每周一次 |

#### 4.4.2 掉落动画
```
┌─────────────────────────────┐
│      ✨ 恭喜获得 ✨          │
│                             │
│    ┌─────────────────┐      │
│    │   🃏 愿望卡      │      │
│    │                 │      │
│    │  "想要一本《xxx》│      │
│    │     原版书"      │      │
│    └─────────────────┘      │
│                             │
│        [ 查看愿望 ]          │
└─────────────────────────────┘
```

### 4.5 积分系统

#### 4.5.1 积分获取
- 完成任务：+10~50（根据任务设置）
- 连续打卡：额外奖励
- 选做项完成：双倍积分

#### 4.5.2 积分扣除
- 任务未完成：-5~-20
- 周必须项未完成：删除近2日所有积分
- 超时完成：-5

#### 4.5.3 积分商店（可选兑换）
```javascript
{
  id: "reward_001",
  name: "30分钟游戏时间",
  description: "",
  pointsCost: 100,
  quantity: -1, // 无限
  icon: "gamepad"
}
```

### 4.6 愿望卡系统

#### 4.6.1 学生愿望池
```javascript
{
  id: "wish_001",
  studentId: "student_001",
  description: "想要一套《哈利波特》原版书",
  status: "pending", // pending/approved/redeemed/rejected
  createdAt: timestamp,
  approvedAt: null,
  redeemedAt: null
}
```

#### 4.6.2 每周掉落流程
1. 每周六20:00随机时刻触发
2. 从学生愿望池随机抽取1张
3. 通知家长审批
4. 家长可修改内容
5. 审批通过 → 待兑现列表

#### 4.6.3 家长审批
- 查看愿望内容
- 可修改：愿望名称、描述、评估价值
- 通过/拒绝

#### 4.6.4 兑现流程
1. 线下兑现愿望
2. 家长标记"已兑现"
3. 愿望卡移入历史

### 4.7 惩罚与豁免

#### 4.7.1 周必须项未完成检测
- 每周日24:00检测
- 如未完成：删除当日及前一日所有积分
- 发送通知给学生和家长

#### 4.7.2 补打卡机制
- 每周补打卡次数（家长设置，默认3次）
- 学生点击"补打卡" → 选择未完成的必须项
- 无需审批，自动生效
- 补打卡记录单独显示

#### 4.7.3 当日豁免
- 家长设置豁免次数（默认3次/周）
- 学生申请豁免 → 家长一键批准
- 豁免当日不受惩罚
- 不影响其他积分记录

---

## 5. 组件清单

### 5.1 登录注册组件
| 状态 | 说明 |
|-----|------|
| 默认 | 显示表单 |
| 加载中 | 按钮禁用，显示loading |
| 错误 | 显示错误提示（用户名已存在/密码错误等） |
| 成功 | 跳转首页 |

### 5.2 任务卡片组件
| 状态 | 样式 |
|-----|------|
| 待完成 | 白色背景，类型标签（必须红色/选做绿色） |
| 进行中 | 左边框高亮，显示计时器 |
| 已完成 | 灰色背景，打勾图标 |
| 逾期 | 红色边框，感叹号标记 |

### 5.3 计时器组件
```
状态：停止 | 运行中 | 暂停
显示：00:25:30 格式
按钮：开始/暂停 | 停止
```

### 5.4 掉落弹窗组件
- 金色边框
- 弹跳入场动画
- 卡片翻转效果显示内容
- 关闭/查看两个按钮

### 5.5 愿望卡组件
| 状态 | 样式 |
|-----|------|
| 待审批 | 黄色边框 |
| 已通过 | 绿色边框 |
| 已兑现 | 灰色背景 |
| 已拒绝 | 红色删除线 |

### 5.6 数据统计图表
- 使用 Chart.js
- 柱状图：每日学习时长
- 饼图：任务类型分布
- 折线图：积分变化趋势

---

## 6. 技术实现

### 6.1 项目结构
```
learning-tracker/
├── index.html          # 主入口
├── login.html          # 登录注册页
├── parent.html         # 家长端
├── student.html        # 学生端
├── css/
│   ├── common.css      # 公共样式
│   ├── login.css       # 登录样式
│   ├── parent.css      # 家长端样式
│   └── student.css     # 学生端样式
├── js/
│   ├── auth.js         # 认证逻辑
│   ├── storage.js      # localStorage封装
│   ├── tracker.js      # 时长监控
│   ├── tasks.js        # 任务管理
│   ├── points.js       # 积分系统
│   ├── wishes.js       # 愿望卡系统
│   ├── rewards.js      # 奖励系统
│   ├── charts.js       # 图表渲染
│   └── utils.js        # 工具函数
└── assets/
    └── icons/          # 图标资源
```

### 6.2 数据存储（localStorage）
```javascript
// 键名设计
STORAGE_KEYS = {
  CURRENT_USER: 'lt_current_user',
  USERS: 'lt_users',           // 所有用户
  BINDINGS: 'lt_bindings',      // 家长-学生绑定
  TASKS: 'lt_tasks',            // 任务模板
  RECORDS: 'lt_records',        // 打卡记录
  TRACKING: 'lt_tracking',      // 时长记录
  WISHES: 'lt_wishes',          // 愿望池
  POINTS: 'lt_points',          // 积分记录
  REWARDS: 'lt_rewards',       // 奖励定义
  SETTINGS: 'lt_settings'       // 系统设置
}
```

### 6.3 核心模块

#### 6.3.1 auth.js
```javascript
// 功能
- register(username, password, role)
- login(username, password)
- logout()
- getCurrentUser()
- generateInviteCode()
- bindStudent(inviteCode, studentUsername, studentPassword)

// 角色检测
- isParent(userId) → boolean
- isStudent(userId) → boolean
```

#### 6.3.2 tracker.js
```javascript
// 功能
- startTracking()    // 开始记录
- endTracking()      // 结束记录
- getTodayRecords()   // 获取今日记录
- getRecordsByDateRange(start, end)
- getWeeklySummary()
- getMonthlySummary()
- exportToCSV()
```

#### 6.3.3 tasks.js
```javascript
// 功能
- createTask(taskData)
- copyFromTemplate(templateId, dateRange)
- startTask(taskId)
- completeTask(taskId, summary)
- getDailyTasks(date)
- getWeeklyTasks(weekStartDate)
- checkWeeklyCompletion()
- applyPunishment()  // 扣除积分
```

#### 6.3.4 drop.js（掉落系统）
```javascript
// 功能
- checkDrop(taskType, completedTasks)
- dropPoints(amount)
- dropWishCard()  // 每周随机掉落
- getRandomWishFromPool()
- shouldTriggerWeeklyDrop()  // 检测是否该本周掉落
```

### 6.4 weekly-drop 定时器
```javascript
// 每周六20:00随机触发
function scheduleWeeklyDrop() {
  const now = new Date();
  const saturday = new Date();
  saturday.setDay(6); // 设置到周六
  saturday.setHours(20, 0, 0, 0);

  if (saturday < now) {
    saturday.addWeek(); // 已经是周六20点之后了
  }

  const delay = saturday - now + Math.random() * 3600000; // 0-1小时随机
  setTimeout(dropWishCard, delay);
}
```

---

## 7. 页面流程

### 7.1 首次使用流程
```
打开网站 → 注册家长账号 → 生成邀请码 → 注册学生账号绑定 → 开始使用
```

### 7.2 每日使用流程
```
登录 → 查看今日任务 → 完成必须项/选做项 → 打卡计时 → 获得积分/掉落 → 查看奖励
```

### 7.3 家长审批流程
```
登录家长端 → 查看待审批愿望 → 修改/批准 → 线下兑现 → 标记已兑现
```

---

## 8. 验收标准

### 8.1 功能验收
- [ ] 家长/学生账号注册和绑定
- [ ] 日任务和周任务左右分栏显示
- [ ] 必须项/选做项区分显示
- [ ] 任务计时功能（含切出监控）
- [ ] 积分获取和扣除正确计算
- [ ] 掉落动画正确触发
- [ ] 愿望卡提交、审批、兑现流程
- [ ] 补打卡功能
- [ ] 当日豁免功能
- [ ] 周必须项未完成惩罚

### 8.2 交互验收
- [ ] 登录注册表单验证
- [ ] 任务创建/编辑/删除
- [ ] 计时器开始/暂停/停止
- [ ] 掉落弹窗动画
- [ ] 页面切换流畅

### 8.3 数据验收
- [ ] localStorage 数据正确读写
- [ ] 账号绑定关系正确
- [ ] 积分计算准确
- [ ] 时长记录准确

---

## 9. 开发计划

### Phase 1: 基础框架
1. 项目结构搭建
2. 登录注册系统
3. 账号绑定流程

### Phase 2: 核心功能
4. 任务管理（日任务/周任务）
5. 计时器系统
6. 时长监控

### Phase 3: 激励系统
7. 积分系统
8. 掉落机制
9. 愿望卡系统

### Phase 4: 增强功能
10. 惩罚与豁免
11. 补打卡功能
12. 家长端数据统计

### Phase 5: 优化完善
13. UI/UX优化
14. 动画效果
15. 测试与修复
