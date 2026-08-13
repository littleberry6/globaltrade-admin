const express = require('express');
const bcrypt = require('bcryptjs');
const store = require('../store');
const { auth, authorize } = require('../middleware/auth');
const { logOperation } = require('../middleware/logger');

const router = express.Router();

router.get('/users', auth, authorize('admin'), async (req, res) => {
  const { page = 1, pageSize = 10, keyword, role, status } = req.query;
  try {
    const db = store.getDB();
    let rows = [...db.users];
    if (keyword) {
      const kw = keyword.toLowerCase();
      rows = rows.filter(u =>
        (u.username && u.username.toLowerCase().includes(kw)) ||
        (u.nickname && u.nickname.toLowerCase().includes(kw)) ||
        (u.email && u.email.toLowerCase().includes(kw))
      );
    }
    if (role) rows = rows.filter(u => u.role == role);
    if (status !== undefined && status !== '') rows = rows.filter(u => u.status == status);
    const total = rows.length;
    rows = rows.map(({ password, ...rest }) => rest);
    rows.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    const list = rows.slice((page - 1) * pageSize, page * pageSize);
    res.json({ code: 200, data: { list, total } });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.post('/users', auth, authorize('admin'), async (req, res) => {
  const { username, password, role, nickname, email, phone } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const record = store.insert('users', {
      username, password: hashed, role: role || 'staff', nickname, email, phone
    });
    await logOperation(req.user.id, 'create', 'user', record.id, `创建用户: ${username}`);
    res.json({ code: 200, data: { id: record.id } });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.put('/users/:id', auth, authorize('admin'), async (req, res) => {
  const { role, nickname, email, phone, status } = req.body;
  try {
    store.update('users', parseInt(req.params.id), { role, nickname, email, phone, status });
    await logOperation(req.user.id, 'update', 'user', req.params.id);
    res.json({ code: 200, message: '更新成功' });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.delete('/users/:id', auth, authorize('admin'), async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.json({ code: 400, message: '不能删除自己的账号' });
    }
    store.remove('users', parseInt(req.params.id));
    await logOperation(req.user.id, 'delete', 'user', req.params.id);
    res.json({ code: 200, message: '删除成功' });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.get('/roles', auth, authorize('admin'), async (req, res) => {
  try {
    const db = store.getDB();
    const roles = db.roles.map(r => ({ ...r, permissions: Array.isArray(r.permissions) ? r.permissions : JSON.parse(r.permissions || '[]') }));
    res.json({ code: 200, data: roles });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.post('/roles', auth, authorize('admin'), async (req, res) => {
  const { name, code, permissions, description } = req.body;
  try {
    const record = store.insert('roles', {
      name, code, permissions: permissions || [], description
    });
    res.json({ code: 200, data: { id: record.id } });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.put('/roles/:id', auth, authorize('admin'), async (req, res) => {
  const { name, permissions, description } = req.body;
  try {
    store.update('roles', parseInt(req.params.id), { name, permissions: permissions || [], description });
    res.json({ code: 200, message: '更新成功' });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.delete('/roles/:id', auth, authorize('admin'), async (req, res) => {
  try {
    store.remove('roles', parseInt(req.params.id));
    res.json({ code: 200, message: '删除成功' });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.get('/logs', auth, authorize('admin', 'manager'), async (req, res) => {
  const { page = 1, pageSize = 20, userId, action, targetType, startDate, endDate } = req.query;
  try {
    const db = store.getDB();
    let rows = [...db.operation_logs];
    if (userId) rows = rows.filter(l => l.user_id == userId);
    if (action) rows = rows.filter(l => l.action == action);
    if (targetType) rows = rows.filter(l => l.target_type == targetType);
    if (startDate) rows = rows.filter(l => l.created_at >= startDate);
    if (endDate) rows = rows.filter(l => l.created_at <= endDate + 'T23:59:59');
    const total = rows.length;
    rows.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    const list = rows.slice((page - 1) * pageSize, page * pageSize).map(l => {
      const user = db.users.find(u => u.id === l.user_id);
      return { ...l, username: user ? user.username : 'unknown' };
    });
    res.json({ code: 200, data: { list, total } });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.get('/permissions/list', auth, async (req, res) => {
  const permissions = [
    { key: 'product:view', name: '查看产品' },
    { key: 'product:create', name: '创建产品' },
    { key: 'product:edit', name: '编辑产品' },
    { key: 'product:delete', name: '删除产品' },
    { key: 'order:view', name: '查看订单' },
    { key: 'order:create', name: '创建订单' },
    { key: 'order:edit', name: '编辑订单' },
    { key: 'customer:view', name: '查看客户' },
    { key: 'customer:create', name: '创建客户' },
    { key: 'customer:edit', name: '编辑客户' },
    { key: 'analytics:view', name: '查看数据统计' },
    { key: 'system:user', name: '用户管理' },
    { key: 'system:role', name: '角色管理' },
    { key: 'system:log', name: '查看操作日志' }
  ];
  res.json({ code: 200, data: permissions });
});

module.exports = router;