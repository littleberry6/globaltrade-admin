const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const store = require('../store');
const { auth, JWT_SECRET } = require('../middleware/auth');
const { logOperation } = require('../middleware/logger');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.json({ code: 400, message: '用户名和密码不能为空' });
  }
  try {
    const user = store.queryOne('users', { username });
    if (!user) {
      return res.json({ code: 400, message: '用户名或密码错误' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.json({ code: 400, message: '用户名或密码错误' });
    }
    if (user.status !== 1) {
      return res.json({ code: 403, message: '账号已被禁用' });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    store.update('users', user.id, { last_login_at: new Date().toISOString() });
    res.json({
      code: 200,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          nickname: user.nickname,
          avatar: user.avatar
        }
      }
    });
  } catch (e) {
    res.json({ code: 500, message: '登录失败: ' + e.message });
  }
});

router.get('/profile', auth, async (req, res) => {
  try {
    const user = store.queryOne('users', { id: req.user.id });
    if (!user) return res.json({ code: 404, message: '用户不存在' });
    const { password, ...profile } = user;
    res.json({ code: 200, data: profile });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.put('/profile', auth, async (req, res) => {
  const { nickname, email, phone } = req.body;
  try {
    store.update('users', req.user.id, { nickname, email, phone });
    await logOperation(req.user.id, 'update', 'user', req.user.id, '更新个人信息');
    res.json({ code: 200, message: '更新成功' });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.put('/password', auth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const user = store.queryOne('users', { id: req.user.id });
    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) return res.json({ code: 401, message: '原密码错误' });
    const hashed = await bcrypt.hash(newPassword, 10);
    store.update('users', req.user.id, { password: hashed });
    await logOperation(req.user.id, 'update', 'user', req.user.id, '修改密码');
    res.json({ code: 200, message: '密码修改成功' });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

module.exports = router;