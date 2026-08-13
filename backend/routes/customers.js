const express = require('express');
const store = require('../store');
const { auth } = require('../middleware/auth');
const { logOperation } = require('../middleware/logger');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  const { page = 1, pageSize = 10, keyword, level, source } = req.query;
  try {
    const db = store.getDB();
    let rows = [...db.customers];
    if (keyword) {
      const kw = keyword.toLowerCase();
      rows = rows.filter(c =>
        (c.name && c.name.toLowerCase().includes(kw)) ||
        (c.company && c.company.toLowerCase().includes(kw)) ||
        (c.email && c.email.toLowerCase().includes(kw))
      );
    }
    if (level) rows = rows.filter(c => c.level == level);
    if (source) rows = rows.filter(c => c.source == source);
    const total = rows.length;
    rows.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    const list = rows.slice((page - 1) * pageSize, page * pageSize);
    res.json({ code: 200, data: { list, total } });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const db = store.getDB();
    const customer = db.customers.find(c => c.id === parseInt(req.params.id));
    if (!customer) return res.json({ code: 404, message: '客户不存在' });
    const inquiries = db.inquiries.filter(i => i.customer_id === customer.id).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    const orders = db.orders.filter(o => o.customer_id === customer.id).map(o => ({
      id: o.id, order_no: o.order_no, total_amount: o.total_amount, status: o.status, created_at: o.created_at
    })).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    res.json({ code: 200, data: { ...customer, inquiries, orders } });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.post('/', auth, async (req, res) => {
  const { name, company, email, phone, level, source, address, remark } = req.body;
  try {
    const record = store.insert('customers', {
      name, company, email, phone, level: level || 'normal',
      source, address, remark, created_by: req.user.id
    });
    await logOperation(req.user.id, 'create', 'customer', record.id, `创建客户: ${name}`);
    res.json({ code: 200, data: { id: record.id } });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  const { name, company, email, phone, level, source, address, remark, status } = req.body;
  try {
    store.update('customers', parseInt(req.params.id), { name, company, email, phone, level, source, address, remark, status });
    await logOperation(req.user.id, 'update', 'customer', req.params.id, `更新客户: ${name}`);
    res.json({ code: 200, message: '更新成功' });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    store.remove('customers', parseInt(req.params.id));
    res.json({ code: 200, message: '删除成功' });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.post('/:id/inquiry', auth, async (req, res) => {
  const { type, content, amount, status } = req.body;
  try {
    const record = store.insert('inquiries', {
      customer_id: parseInt(req.params.id), type, content, amount,
      status: status || 'pending', created_by: req.user.id
    });
    res.json({ code: 200, data: { id: record.id } });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.put('/inquiry/:id', auth, async (req, res) => {
  const { status, content } = req.body;
  try {
    store.update('inquiries', parseInt(req.params.id), { status, content });
    res.json({ code: 200, message: '更新成功' });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.get('/pipeline/stats', auth, async (req, res) => {
  try {
    const db = store.getDB();
    const activeCustomers = db.customers.filter(c => c.status === 1);

    const byLevel = {};
    activeCustomers.forEach(c => { byLevel[c.level] = (byLevel[c.level] || 0) + 1; });
    const byLevelArr = Object.entries(byLevel).map(([level, count]) => ({ level, count }));

    const bySource = {};
    activeCustomers.forEach(c => { bySource[c.source] = (bySource[c.source] || 0) + 1; });
    const bySourceArr = Object.entries(bySource).map(([source, count]) => ({ source, count }));

    const inquiryStats = {};
    db.inquiries.forEach(i => { inquiryStats[i.status] = (inquiryStats[i.status] || 0) + 1; });
    const inquiryStatsArr = Object.entries(inquiryStats).map(([status, count]) => ({ status, count }));

    const conversion = {};
    activeCustomers.forEach(c => {
      if (!conversion[c.level]) conversion[c.level] = { level: c.level, total_customers: 0, ordered_customers: 0 };
      conversion[c.level].total_customers++;
      const hasOrder = db.orders.some(o => o.customer_id === c.id);
      if (hasOrder) conversion[c.level].ordered_customers++;
    });

    res.json({ code: 200, data: { byLevel: byLevelArr, bySource: bySourceArr, inquiryStats: inquiryStatsArr, conversion: Object.values(conversion) } });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

module.exports = router;