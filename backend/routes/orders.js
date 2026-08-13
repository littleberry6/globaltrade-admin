const express = require('express');
const store = require('../store');
const { auth, authorize } = require('../middleware/auth');
const { logOperation } = require('../middleware/logger');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  const { page = 1, pageSize = 10, keyword, status, channel, startDate, endDate } = req.query;
  try {
    const db = store.getDB();
    let rows = [...db.orders];
    if (keyword) {
      rows = rows.filter(o =>
        (o.order_no && o.order_no.toLowerCase().includes(keyword.toLowerCase())) ||
        (o.customer_name && o.customer_name.toLowerCase().includes(keyword.toLowerCase()))
      );
    }
    if (status) rows = rows.filter(o => o.status == status);
    if (channel) rows = rows.filter(o => o.channel == channel);
    if (startDate) rows = rows.filter(o => o.created_at >= startDate);
    if (endDate) rows = rows.filter(o => o.created_at <= endDate + 'T23:59:59');
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
    const order = db.orders.find(o => o.id === parseInt(req.params.id));
    if (!order) return res.json({ code: 404, message: '订单不存在' });
    const items = db.order_items.filter(i => i.order_id === order.id);
    const logistics = db.logistics.filter(l => l.order_id === order.id).sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
    res.json({ code: 200, data: { ...order, items, logistics } });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.post('/', auth, async (req, res) => {
  const { orderNo, customerId, customerName, channel, items, totalAmount, status, logistics } = req.body;
  try {
    const db = store.getDB();
    const orderRecord = store.insert('orders', {
      order_no: orderNo, customer_id: customerId, customer_name: customerName,
      channel, total_amount: totalAmount, status: status || 'pending', created_by: req.user.id
    });
    for (const item of items) {
      store.insert('order_items', {
        order_id: orderRecord.id, product_id: item.productId,
        product_name: item.productName, sku: item.sku, quantity: item.quantity, price: item.price
      });
      const product = db.products.find(p => p.id === item.productId);
      if (product) {
        store.update('products', product.id, { stock: Math.max(0, product.stock - item.quantity) });
      }
    }
    if (logistics && logistics.length) {
      for (const log of logistics) {
        store.insert('logistics', {
          order_id: orderRecord.id, stage: log.stage,
          description: log.description || '', created_at: log.createdAt || new Date().toISOString()
        });
      }
    }
    await logOperation(req.user.id, 'create', 'order', orderRecord.id, `创建订单: ${orderNo}`);
    res.json({ code: 200, data: { id: orderRecord.id } });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.put('/:id/status', auth, async (req, res) => {
  const { status } = req.body;
  try {
    store.update('orders', parseInt(req.params.id), { status });
    await logOperation(req.user.id, 'update', 'order', req.params.id, `状态变更: ${status}`);
    res.json({ code: 200, message: '状态更新成功' });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.post('/:id/logistics', auth, async (req, res) => {
  const { stage, description } = req.body;
  try {
    store.insert('logistics', {
      order_id: parseInt(req.params.id), stage, description,
      created_at: new Date().toISOString()
    });
    await logOperation(req.user.id, 'update', 'order', req.params.id, `添加物流节点: ${stage}`);
    res.json({ code: 200, message: '物流节点添加成功' });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.get('/stats/summary', auth, async (req, res) => {
  try {
    const db = store.getDB();
    const activeOrders = db.orders.filter(o => o.status !== 'cancelled');
    const byStatus = {};
    db.orders.forEach(o => { byStatus[o.status] = (byStatus[o.status] || 0) + 1; });
    const byStatusArr = Object.entries(byStatus).map(([status, count]) => ({ status, count }));

    const byChannel = {};
    activeOrders.forEach(o => {
      if (!byChannel[o.channel]) byChannel[o.channel] = { channel: o.channel, count: 0, amount: 0 };
      byChannel[o.channel].count++;
      byChannel[o.channel].amount += parseFloat(o.total_amount) || 0;
    });
    const byChannelArr = Object.values(byChannel).map(c => ({ channel: c.channel, count: c.count, amount: c.amount }));

    const revenue = {};
    activeOrders.forEach(o => {
      const date = (o.created_at || '').split('T')[0];
      if (!date) return;
      if (!revenue[date]) revenue[date] = { date, revenue: 0, orders: 0 };
      revenue[date].revenue += parseFloat(o.total_amount) || 0;
      revenue[date].orders++;
    });
    const revenueArr = Object.values(revenue).sort((a, b) => a.date.localeCompare(b.date));

    const totalAmount = activeOrders.reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0);
    const totalOrders = activeOrders.length;

    res.json({ code: 200, data: { byStatus: byStatusArr, byChannel: byChannelArr, revenue: revenueArr, total: { total_amount: totalAmount, total_orders: totalOrders } } });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

module.exports = router;