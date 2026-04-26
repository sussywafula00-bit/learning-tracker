# 好学伴 - 学习打卡与愿望激励系统

## 项目概述

一个帮助学生养成学习习惯的互动平台，通过任务管理、打卡激励和愿望奖励系统，让学习变得有目标、有动力、有收获。

## 技术栈

- **前端**: HTML5 + CSS3 + Vanilla JavaScript
- **存储**: localStorage（纯前端，无需后端）
- **图表**: Chart.js v3.9.1
- **图标**: Font Awesome 6.4
- **字体**: 系统字体栈（PingFang SC, Microsoft YaHei 等）

## 项目结构

```
learning-tracker/
├── SPEC.md              # 详细技术规格文档
├── CLAUDE.md            # 本文件，项目文档
├── login.html           # 登录注册页
├── student.html         # 学生端主页
├── parent.html          # 家长端主页
├── css/
│   ├── common.css       # 公共样式（变量、布局、组件）
│   ├── login.css       # 登录样式
│   ├── student.css     # 学生端样式
│   └── parent.css      # 家长端样式
└── js/
    ├── storage.js       # localStorage 封装
    ├── utils.js        # 工具函数
    ├── auth.js          # 认证系统（注册、登录、账号绑定）
    ├── tasks.js         # 任务管理（CRUD、自动生成）
    ├── tracker.js       # 时长监控（标签页切换检测）
    ├── points.js        # 积分系统
    ├── drop.js          # 掉落机制（积分/愿望卡）
    ├── wishes.js        # 愿望卡系统
    ├── login.js         # 登录页逻辑
    ├── student.js       # 学生端逻辑
    └── parent.js        # 家长端逻辑
```

## 核心数据模型

### 账号系统
- **家长账号**: 创建邀请码，关联学生账号，查看数据
- **学生账号**: 通过邀请码绑定到家长，完成任务获取奖励

### 任务类型
```javascript
TaskType = {
  DAILY_REQUIRED: 'daily_required',    // 日必须项
  DAILY_OPTIONAL: 'daily_optional',    // 日选做项
  WEEKLY_REQUIRED: 'weekly_required',  // 周必须项
  WEEKLY_OPTIONAL: 'weekly_optional'   // 周选做项
}
```

### 掉落规则
| 触发条件 | 掉落内容 |
|---------|---------|
| 完成所有日必须项 | 积分 20-50 |
| 完成 2 项日选做项 | 积分 30-60 |
| 每周六随机时刻 | 愿望卡 ×1（从愿望池抽取）|

### 惩罚机制
- 周必须项未完成 → 删除近两日积分
- 每周有补打卡次数限制（家长设置）
- 当日豁免功能（不影响其他积分）

## localStorage 键名

| 键名 | 存储内容 |
|------|---------|
| `lt_current_user` | 当前登录用户 |
| `lt_users` | 所有用户列表 |
| `lt_bindings` | 家长-学生绑定关系 |
| `lt_templates` | 任务模板 |
| `lt_records` | 打卡记录 |
| `lt_tracking` | 时长记录 |
| `lt_points` | 积分记录 |
| `lt_wishes` | 愿望池 |
| `lt_settings` | 系统设置 |

## 页面入口

- `login.html` - 登录/注册
- `student.html` - 学生端
- `parent.html` - 家长端

## 启动方式

```bash
cd learning-tracker
python -m http.server 8080
# 访问 http://localhost:8080/login.html
```

## 关键实现说明

### 1. 任务自动生成
- 添加任务后只在今天生成一条记录
- 明天会自动按今天的必须项生成
- 点击刷新按钮可手动按昨日任务重新生成

### 2. 时长监控
- 监听 `visibilitychange` 事件（标签页切换）
- 监听 `blur/focus` 事件（窗口失焦/聚焦）
- 记录每次切出的时间点和持续时长

### 3. 每周掉落定时器
- 每周六 20:00 随机触发
- 延迟 0-60 分钟随机偏移
- 触发后自动重新安排下周

## 待完成功能

- [x] 周日惩罚自动检测和执行
- [x] 家长端豁免审批功能
- [ ] 积分商店兑换功能
- [ ] 数据导出/导入优化
- [ ] 响应式移动端适配
- [ ] 离线通知（Service Worker）

## 已实现功能说明

### 周日惩罚自动检测
- 学生在每周日首次登录时自动检测周必须项完成情况
- 未完成且无豁免时自动执行惩罚（删除近两日积分）
- 已执行惩罚的周不会重复惩罚

### 豁免审批功能
- 学生可申请豁免（选择日期和原因）
- 家长在家长端「豁免审批」标签页审批
- 批准的豁免日期自动加入豁免列表，当日不计惩罚

## 开发规范

- 使用 ES6+ 语法，类使用 class
- CSS 变量定义在 `:root`
- 模块方法使用 static 方法
- 工具函数放在 Utils 类
- UI 交互逻辑放在对应的 App 类

## 注意事项

- localStorage 有大小限制（约5MB）
- 同源策略限制，不同端口数据不共享
- 清理浏览器数据会丢失所有数据
- 建议定期手动备份数据
