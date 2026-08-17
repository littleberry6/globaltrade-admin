# GlobalTrade Admin 项目复盘文档

## 一、项目概述

**项目定位**：面向外贸B2B/B2C企业的跨境电商后台管理系统，聚焦"本地化履约全链路追踪"（区别于纯管理工具），服务于阿里巴巴国际站/Made-in-China等B2B平台运营人员。

**核心功能**：产品管理（上架/下架/更新）、订单物流追踪、数据统计分析、选品竞品监控、客户CRM闭环、系统权限管理、中英文切换。

**技术栈**：
| 层级 | 技术 | 版本 |
|---|---|---|
| 前端框架 | Vue 3 + Vite | 5.x |
| UI组件库 | Element Plus | 2.x |
| 状态管理 | Pinia | 2.x |
| 路由 | Vue Router | 4.x |
| 图表 | ECharts | 5.x |
| HTTP | Axios | 1.x |
| 国际化 | vue-i18n | 9.x |
| 后端框架 | Node.js + Express | 4.x |
| 数据库 | MySQL | 8.x |
| 认证 | JWT + bcryptjs | - |

---

## 二、目录结构

```
manage/
├── backend/                           # 后端 Node.js + Express
│   ├── config/
│   │   └── db.js                     # MySQL连接池配置
│   ├── middleware/
│   │   ├── auth.js                   # JWT认证 + 角色权限
│   │   └── logger.js                 # 操作日志记录
│   ├── routes/
│   │   ├── auth.js                   # 登录/个人信息/改密码
│   │   ├── products.js               # 产品CRUD + 批量导入
│   │   ├── orders.js                 # 订单CRUD + 物流节点
│   │   ├── customers.js              # 客户 + 询盘跟进
│   │   ├── analytics.js              # 数据看板API
│   │   ├── selection.js              # 竞品 + 选品建议
│   │   └── system.js                 # 用户/角色/日志管理
│   ├── sql/
│   │   └── init.js                   # 数据库初始化（建表+种子数据）
│   ├── server.js                     # Express入口
│   ├── .env                          # 环境变量
│   └── package.json
│
└── frontend/                          # 前端 Vue3
    ├── src/
    │   ├── api/
    │   │   ├── request.js            # Axios封装（拦截器+Token）
    │   │   └── index.js              # 所有API方法定义
    │   ├── i18n/
    │   │   ├── index.js              # i18n实例
    │   │   └── locales/
    │   │       ├── zh.js             # 中文语言包
    │   │       └── en.js             # 英文语言包
    │   ├── layout/
    │   │   └── MainLayout.vue        # 主布局（侧边栏+顶栏+面包屑）
    │   ├── router/
    │   │   └── index.js              # 路由配置 + 路由守卫
    │   ├── stores/
    │   │   └── user.js               # Pinia用户状态
    │   ├── styles/
    │   │   └── index.scss            # 全局深色科技风主题
    │   ├── views/
    │   │   ├── Login.vue             # 登录页
    │   │   ├── Dashboard.vue         # 数据看板
    │   │   ├── products/             # 产品模块
    │   │   ├── orders/               # 订单模块
    │   │   ├── analytics/            # 数据统计
    │   │   ├── selection/            # 选品分析
    │   │   ├── customers/            # 客户模块
    │   │   └── system/               # 系统管理
    │   ├── App.vue
    │   └── main.js
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## 三、数据库设计

### 核心表结构

```sql
-- 用户表
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,        -- bcrypt加密
  role ENUM('admin','manager','staff','viewer'),
  nickname VARCHAR(50), email VARCHAR(100), phone VARCHAR(20),
  avatar VARCHAR(500), status TINYINT DEFAULT 1,
  last_login_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 角色表（JSON存储权限列表）
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50), code VARCHAR(50) UNIQUE,
  permissions JSON, description VARCHAR(500)
);

-- 产品表
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL, sku VARCHAR(100) UNIQUE,
  category VARCHAR(100),
  price DECIMAL(12,2), cost_price DECIMAL(12,2),
  stock INT DEFAULT 0, description TEXT, images JSON,
  status TINYINT DEFAULT 1, view_count INT DEFAULT 0,
  created_by INT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 订单表
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_no VARCHAR(50) UNIQUE,
  customer_id INT, customer_name VARCHAR(200),
  channel ENUM('alibaba','madeinchina','amazon','shopify','tiktok','direct'),
  total_amount DECIMAL(12,2),
  status ENUM('pending','paid','processing','shipped','delivered','completed','cancelled'),
  created_by INT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 订单明细表
CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT, product_name VARCHAR(200),
  sku VARCHAR(100), quantity INT, price DECIMAL(12,2)
);

-- 物流追踪表（每节点一条记录）
CREATE TABLE logistics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  stage ENUM('picked_up','customs','warehouse','delivery','signed'),
  description VARCHAR(500),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 客户表
CREATE TABLE customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100), company VARCHAR(200),
  email VARCHAR(100), phone VARCHAR(20),
  level ENUM('vip','key','normal','potential'),
  source ENUM('alibaba','madeinchina','expo','online','referral','other'),
  address VARCHAR(500), remark TEXT,
  status TINYINT DEFAULT 1, created_by INT
);

-- 询盘/报价表
CREATE TABLE inquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT,
  type ENUM('inquiry','quote','sample','negotiation'),
  content TEXT, amount DECIMAL(12,2),
  status ENUM('pending','replied','quoted','negotiating','won','lost')
);

-- 竞品表
CREATE TABLE competitors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_name VARCHAR(200), competitor_name VARCHAR(200),
  category VARCHAR(100), price DECIMAL(12,2), url VARCHAR(500)
);

-- 操作日志表
CREATE TABLE operation_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action ENUM('create','read','update','delete','login','export'),
  target_type VARCHAR(50), target_id INT,
  detail TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 初始化数据
- 默认管理员：`admin / admin123`（登录后请立即修改）
- 10条模拟产品（Electronics/Home/Kitchen/Sports/Pet/Auto/Baby等品类）
- 5条模拟客户（VIP/Key/Normal/Potential四级）
- 50条模拟订单（随机渠道+状态+物流节点）
- 4个预置角色（admin/manager/staff/viewer）

---

## 四、API接口清单

### 认证模块 `/api/auth`
| 方法 | 路径 | 说明 | 认证 |
|---|---|---|---|
| POST | /login | 用户名密码登录，返回JWT | 否 |
| GET | /profile | 获取当前用户信息 | 是 |
| PUT | /profile | 更新昵称/邮箱/手机 | 是 |
| PUT | /password | 修改密码 | 是 |

### 产品模块 `/api/products`
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | / | 分页列表（支持keyword/category/status筛选） |
| GET | /categories | 获取所有品类列表 |
| GET | /:id | 产品详情 |
| POST | / | 新建产品 |
| PUT | /:id | 更新产品 |
| DELETE | /:id | 删除产品（admin/manager） |
| PUT | /:id/status | 切换上下架状态 |
| POST | /batch/import | 批量导入产品 |

### 订单模块 `/api/orders`
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | / | 分页列表（支持keyword/status/channel/日期范围） |
| GET | /:id | 订单详情（含明细+物流） |
| POST | / | 创建订单（事务：扣库存+写明细+写物流） |
| PUT | /:id/status | 更新订单状态 |
| POST | /:id/logistics | 添加物流节点 |
| GET | /stats/summary | 订单统计汇总 |

### 客户模块 `/api/customers`
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | / | 分页列表 |
| GET | /:id | 客户详情（含询盘历史+订单历史） |
| POST | / | 新建客户 |
| PUT | /:id | 更新客户 |
| DELETE | /:id | 删除客户 |
| POST | /:id/inquiry | 添加询盘/报价/样品记录 |
| PUT | /inquiry/:id | 更新询盘状态 |
| GET | /pipeline/stats | 转化漏斗统计 |

### 数据统计 `/api/analytics`
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /overview | 看板数据（指标+渠道+热销TOP10） |
| GET | /sales-trend | 销售趋势（7d/30d/90d） |
| GET | /channel-comparison | 渠道对比分析 |
| GET | /category-performance | 品类表现分析 |
| GET | /funnel | 全链路漏斗数据 |

### 选品模块 `/api/selection`
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /competitors | 竞品列表 |
| POST | /competitors | 新增竞品 |
| PUT | /competitors/:id | 更新竞品 |
| DELETE | /competitors/:id | 删除竞品 |
| GET | /trending | 热销趋势排行 |
| GET | /suggestions | 智能建议（库存预警/低利润/热销品类） |

### 系统模块 `/api/system`
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /users | 用户列表（仅admin） |
| POST | /users | 新建用户 |
| PUT | /users/:id | 更新用户（角色/状态） |
| DELETE | /users/:id | 删除用户 |
| GET | /roles | 角色列表 |
| POST | /roles | 新建角色+权限 |
| PUT | /roles/:id | 更新角色权限 |
| DELETE | /roles/:id | 删除角色 |
| GET | /logs | 操作日志（支持用户/动作/时间筛选） |
| GET | /permissions/list | 权限清单（14项预置权限） |

---

## 五、前端页面清单

### 页面路由表
| 路径 | 组件 | 说明 | 权限 |
|---|---|---|---|
| /login | Login.vue | 登录页 | 公开 |
| /dashboard | Dashboard.vue | 数据看板（6指标+3Tab+图表） | 登录用户 |
| /products | ProductList.vue | 产品列表（筛选+表格+360°预览） | 登录用户 |
| /products/new | ProductForm.vue | 新建产品 | 登录用户 |
| /products/:id/edit | ProductForm.vue | 编辑产品 | 登录用户 |
| /orders | OrderList.vue | 订单列表（筛选+新建） | 登录用户 |
| /orders/:id | OrderDetail.vue | 订单详情（物流追踪+快捷操作） | 登录用户 |
| /analytics | Analytics.vue | 数据统计（销售趋势+渠道+品类） | 登录用户 |
| /selection/competitors | Competitors.vue | 竞品监控（价差对比） | 登录用户 |
| /selection/trending | Trending.vue | 热销趋势（排行+洞察） | 登录用户 |
| /selection/suggestions | Suggestions.vue | 智能建议（AI预警） | 登录用户 |
| /customers | CustomerList.vue | 客户列表（转化漏斗卡片） | 登录用户 |
| /customers/:id | CustomerDetail.vue | 客户详情（询盘+订单+漏斗图） | 登录用户 |
| /system/users | Users.vue | 用户管理 | admin |
| /system/roles | Roles.vue | 角色权限 | admin |
| /system/logs | Logs.vue | 操作日志 | admin/manager |

### 核心交互
- **登录页**：深色渐变背景 + 浮动光晕动画 + 品牌特性展示
- **数据看板**：6卡片数字滚动动画 + 3Tab切换（漏斗/物流/客户） + ECharts图表
- **产品列表**：图片缩略图点击弹出 360° 预览（支持旋转切换）
- **订单详情**：物流 Timeline + 一键流转状态（pending→paid→processing→shipped→delivered→completed）
- **客户详情**：转化漏斗图 + 询盘全生命周期管理
- **系统管理**：角色权限矩阵（14项权限可勾选分配）

---

## 六、遇到的问题与解决方案

### 问题1：Dashboard.vue 语法错误（Expected ")" but found end of file）
**原因**：单文件 `<script setup>` 中有两个 `<script>` 标签（一个setup + 一个普通script），以及 `dayjs` 未安装但被引用。
**解决**：
1. 合并为单一 `<script setup>` 标签
2. 移除 `dayjs` 依赖，改用原生 `Date` 对象格式化日期
3. 将所有箭头函数内联代码改为 `function` 声明，减少esbuild解析问题
4. 将多参数解构的Promise.all拆分为索引访问方式

### 问题2：PowerShell不支持 `&&` 链式命令
**原因**：项目在Windows PowerShell 5下运行，`&&` 是bash语法
**解决**：使用分号 `;` 或分两行执行命令，如 `Set-Location path; npm install`

### 问题3：MySQL连接失败
**原因**：默认配置 `root/root` 与实际MySQL密码不符
**解决**：修改 `backend/.env` 中的 `DB_PASSWORD` 为实际密码，或修改 `backend/config/db.js` 中的默认值

### 问题4：Vite编译报esbuild错误
**原因**：`<script setup>` 模板字符串中使用了复杂的内联表达式（如 `{ width: item.percent + '%' }` 与回调函数嵌套）
**解决**：将复杂的内联表达式提取为独立的 `function` 声明，使用 `function` 关键字代替箭头函数，降低esbuild解析压力

### 问题5：ECharts 深色主题与Element Plus深色主题融合
**原因**：ECharts默认白底与深色UI不协调
**解决**：所有图表显式设置 `backgroundColor: 'transparent'`，并自定义tooltip/axis/legend的文字颜色为 `#8FA3BE` 系列

### 问题6：JWT Token过期后静默失败
**原因**：Token过期后后端返回401，但前端未正确拦截
**解决**：在 `api/request.js` 的响应拦截器中，检测到401时自动调用 `userStore.logout()` 并跳转到登录页

---

## 七、如何添加新页面

### 步骤1：后端添加API

**在 `backend/routes/` 下新建路由文件**，例如 `reports.js`：

```javascript
// backend/routes/reports.js
const express = require('express');
const pool = require('../config/db');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/monthly', auth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM orders WHERE MONTH(created_at) = MONTH(NOW())');
    res.json({ code: 200, data: rows });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

module.exports = router;
```

**在 `backend/server.js` 中注册**：
```javascript
app.use('/api/reports', require('./routes/reports'));
```

### 步骤2：前端添加API方法

**在 `frontend/src/api/index.js` 中添加**：
```javascript
export const reportApi = {
  monthly: () => request.get('/reports/monthly'),
  export: (data) => request.post('/reports/export', data, { responseType: 'blob' })
}
```

### 步骤3：添加路由

**在 `frontend/src/router/index.js` 的 children 数组中添加**：
```javascript
{
  path: 'reports',
  name: 'Reports',
  component: () => import('@/views/reports/MonthlyReport.vue'),
  meta: { title: 'reports' }
}
```

### 步骤4：创建视图组件

**在 `frontend/src/views/reports/MonthlyReport.vue`**：
```vue
<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">月度报表</h1>
    </div>
    <el-card class="chart-card">
      <h3>月度数据</h3>
      <div ref="chartRef" class="chart-area"></div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { reportApi } from '@/api'
import * as echarts from 'echarts'

const chartRef = ref(null)

async function loadData() {
  const res = await reportApi.monthly()
  // 处理数据 + 渲染图表...
}

onMounted(async () => {
  await nextTick()
  loadData()
})
</script>

<style lang="scss" scoped>
.page-container { /* 已有样式可复用 */ }
.chart-card { /* 复用全局样式 */ }
.chart-area { width: 100%; height: 350px; }
</style>
```

### 步骤5：添加侧边栏菜单

**修改 `frontend/src/layout/MainLayout.vue` 的 `<el-menu>`**：

在对应 `<el-sub-menu>` 中添加 `<el-menu-item>`，或直接作为顶层item：

```vue
<el-menu-item index="/reports">
  <el-icon><Document /></el-icon>
  <template #title>月度报表</template>
</el-menu-item>
```

### 步骤6：添加国际化（可选）

**在 `frontend/src/i18n/locales/zh.js` 的 nav 中添加**：
```javascript
reports: '月度报表'
```

**在 `en.js` 中添加**：
```javascript
reports: 'Monthly Report'
```

### 步骤7：添加数据库表（如需要）

**在 `backend/sql/init.js` 的 `init()` 函数中添加建表语句**：
```javascript
await conn.query(`
  CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200), data JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`);
```

然后在 `backend/sql/init.js` 末尾添加示例数据的插入语句。

### 添加新页面完整流程总结

```
1. 后端 routes/xxx.js → 注册到 server.js → 前端 api/index.js 添加方法
2. 前端 views/xxx/NewPage.vue → router/index.js 添加路由
3. layout/MainLayout.vue 添加侧边栏入口
4. i18n/locales/{zh,en}.js 添加翻译
5. 如需新表：sql/init.js 添加建表语句
6. 重启前后端服务
```

---

## 八、启动与部署

### 本地开发
```bash
# 终端1：启动后端
cd backend && node server.js
# http://localhost:3000

# 终端2：启动前端
cd frontend && npm run dev
# http://localhost:5173

# 初始化数据库（首次）
cd backend && node sql/init.js
```

### 生产部署
```bash
# 后端
cd backend
npm install
# 设置环境变量
# DB_HOST, DB_PASSWORD, JWT_SECRET
node server.js

# 前端
cd frontend
npm install
npm run build
# 将 dist/ 目录部署到Nginx或其他静态服务器
```

### 默认账号
- 用户名：`admin`
- 密码：`admin123`
- **首次登录后请立即修改密码**

---

## 九、技术要点备忘

### 认证流程
```
登录 → POST /api/auth/login → 返回JWT(7天有效)
→ 存入 localStorage
→ Axios拦截器自动添加 Authorization: Bearer <token>
→ 后端 auth 中间件验证 → 挂载 req.user
→ 路由守卫检测未登录 → 跳转登录页
```

### 权限控制
- 路由级：`router.beforeEach` 检查 token 存在性
- 接口级：后端 `authorize(...roles)` 中间件检查角色
- 前端级：侧边栏 `v-if="userStore.role === 'admin'"` 控制菜单显示

### 响应格式
```javascript
// 成功
{ code: 200, data: {...}, message: 'success' }
// 失败
{ code: 400/401/403/500, message: '错误描述' }
```

### 全局样式变量
```scss
--bg-primary: #0A1628     // 主背景
--bg-secondary: #0F1F36   // 侧边栏背景
--bg-card: #1A3355        // 卡片背景
--border-color: #2A4365   // 边框
--accent-cyan: #00D4FF    // 主强调色
--accent-blue: #3B82F6    // 次要强调色
--gradient-primary: linear-gradient(135deg, #00D4FF, #3B82F6)
```
