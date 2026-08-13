const express = require('express');
const store = require('../store');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/overview', auth, async (req, res) => {
  try {
    const db = store.getDB();
    const activeProducts = db.products.filter(p => p.status === 1).length;
    const totalProducts = db.products.length;
    const activeOrders = db.orders.filter(o => o.status !== 'cancelled');
    const totalOrders = activeOrders.length;
    const totalRevenue = activeOrders.reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0);
    const totalCustomers = db.customers.filter(c => c.status === 1).length;
    const pendingInquiries = db.inquiries.filter(i => i.status === 'pending').length;

    const today = new Date().toISOString().split('T')[0];
    const todayOrders = db.orders.filter(o => (o.created_at || '').startsWith(today));
    const todayRevenue = todayOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0);
    const todayNewCustomers = db.customers.filter(c => (c.created_at || '').startsWith(today)).length;

    const productSales = {};
    db.order_items.forEach(oi => {
      if (!productSales[oi.product_id]) productSales[oi.product_id] = { quantity: 0, revenue: 0 };
      productSales[oi.product_id].quantity += oi.quantity;
      productSales[oi.product_id].revenue += oi.quantity * oi.price;
    });
    const topProducts = Object.entries(productSales)
      .map(([pid, data]) => {
        const p = db.products.find(pr => pr.id === parseInt(pid));
        if (!p) return null;
        return { name: p.name, sku: p.sku, category: p.category, sold: data.quantity, revenue: data.revenue };
      })
      .filter(Boolean)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const channelStats = {};
    activeOrders.forEach(o => {
      if (!channelStats[o.channel]) channelStats[o.channel] = { channel: o.channel, orders: 0, revenue: 0 };
      channelStats[o.channel].orders++;
      channelStats[o.channel].revenue += parseFloat(o.total_amount) || 0;
    });

    res.json({
      code: 200,
      data: {
        active_products: activeProducts, total_products: totalProducts,
        total_orders: totalOrders, total_revenue: totalRevenue,
        total_customers: totalCustomers, pending_inquiries: pendingInquiries,
        today_orders: todayOrders.length, today_revenue: todayRevenue,
        today_new_customers: todayNewCustomers,
        topProducts, channelStats: Object.values(channelStats)
      }
    });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.get('/sales-trend', auth, async (req, res) => {
  const { range = '30d' } = req.query;
  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
  try {
    const db = store.getDB();
    const cutoff = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
    const revenueMap = {};
    db.orders
      .filter(o => o.status !== 'cancelled' && o.created_at >= cutoff)
      .forEach(o => {
        const date = (o.created_at || '').split('T')[0];
        if (!date) return;
        if (!revenueMap[date]) revenueMap[date] = { date, orders: 0, revenue: 0 };
        revenueMap[date].orders++;
        revenueMap[date].revenue += parseFloat(o.total_amount) || 0;
      });
    const rows = Object.values(revenueMap).sort((a, b) => a.date.localeCompare(b.date));
    res.json({ code: 200, data: rows });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.get('/channel-comparison', auth, async (req, res) => {
  try {
    const db = store.getDB();
    const channelData = {};
    db.orders.filter(o => o.status !== 'cancelled').forEach(o => {
      if (!channelData[o.channel]) channelData[o.channel] = { channel: o.channel, orders: 0, revenue: 0 };
      channelData[o.channel].orders++;
      channelData[o.channel].revenue += parseFloat(o.total_amount) || 0;
    });
    const rows = Object.values(channelData).map(c => ({
      ...c,
      avg_order_value: c.orders > 0 ? c.revenue / c.orders : 0
    })).sort((a, b) => b.revenue - a.revenue);
    res.json({ code: 200, data: rows });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.get('/category-performance', auth, async (req, res) => {
  try {
    const db = store.getDB();
    const catData = {};
    db.products.forEach(p => {
      if (!catData[p.category]) catData[p.category] = { category: p.category, product_count: 0, total_sold: 0, total_revenue: 0 };
      catData[p.category].product_count++;
    });
    db.order_items.forEach(oi => {
      const p = db.products.find(pr => pr.id === oi.product_id);
      if (p && catData[p.category]) {
        catData[p.category].total_sold += oi.quantity;
        catData[p.category].total_revenue += oi.quantity * oi.price;
      }
    });
    const rows = Object.values(catData).sort((a, b) => b.total_revenue - a.total_revenue);
    res.json({ code: 200, data: rows });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.get('/funnel', auth, async (req, res) => {
  try {
    const db = store.getDB();
    const productViews = db.products.reduce((s, p) => s + (p.view_count || 0), 0);
    const activeProducts = db.products.filter(p => p.status === 1).length;
    const inquiries = db.inquiries.length;
    const quotes = db.inquiries.filter(i => i.status === 'quoted').length;
    const orders = db.orders.filter(o => o.status !== 'cancelled').length;
    const revenue = db.orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0);
    res.json({ code: 200, data: { productViews, activeProducts, inquiries, quotes, orders, revenue } });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.get('/stock-alerts', auth, async (req, res) => {
  try {
    const db = store.getDB();
    const lowStock = db.products
      .filter(p => p.stock < 20 && p.status === 1)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 10)
      .map(p => ({
        id: p.id, name: p.name, sku: p.sku, stock: p.stock,
        category: p.category, price: p.price,
        level: p.stock === 0 ? 'out' : p.stock < 10 ? 'critical' : 'warning'
      }));
    const outOfStock = lowStock.filter(p => p.level === 'out').length;
    const critical = lowStock.filter(p => p.level === 'critical').length;
    const warning = lowStock.filter(p => p.level === 'warning').length;
    res.json({ code: 200, data: { items: lowStock, summary: { outOfStock, critical, warning } } });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.get('/recent-activity', auth, async (req, res) => {
  try {
    const db = store.getDB();
    const activities = [];
    db.orders
      .slice()
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
      .slice(0, 5)
      .forEach(o => {
        activities.push({
          type: 'order', id: o.id, title: `新订单 ${o.order_no}`,
          desc: `${o.customer_name} - $${parseFloat(o.total_amount).toFixed(2)}`,
          time: o.created_at, status: o.status
        });
      });
    db.inquiries
      .slice()
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
      .slice(0, 5)
      .forEach(i => {
        const customer = db.customers.find(c => c.id === i.customer_id);
        activities.push({
          type: 'inquiry', id: i.id, title: `新询盘 - ${i.type}`,
          desc: customer ? `来自 ${customer.name}` : '',
          time: i.created_at, status: i.status
        });
      });
    db.operation_logs
      .slice()
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
      .slice(0, 5)
      .forEach(l => {
        const user = db.users.find(u => u.id === l.user_id);
        activities.push({
          type: 'log', id: l.id, title: `${l.action} ${l.target_type}`,
          desc: `${user ? user.username : '系统'} - ${l.detail || ''}`,
          time: l.created_at, status: ''
        });
      });
    activities.sort((a, b) => (b.time || '').localeCompare(a.time || ''));
    res.json({ code: 200, data: activities.slice(0, 15) });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.get('/pending-tasks', auth, async (req, res) => {
  try {
    const db = store.getDB();
    const pendingInquiries = db.inquiries
      .filter(i => i.status === 'pending')
      .slice(0, 10)
      .map(i => {
        const customer = db.customers.find(c => c.id === i.customer_id);
        return { id: i.id, type: 'inquiry', title: i.type === 'inquiry' ? '待回复询盘' : i.type === 'quote' ? '待报价' : i.type === 'sample' ? '待寄样' : '待跟进', customer: customer ? customer.name : '', time: i.created_at };
      });
    const pendingOrders = db.orders
      .filter(o => o.status === 'pending' || o.status === 'paid')
      .slice(0, 10)
      .map(o => ({ id: o.id, type: 'order', title: o.status === 'pending' ? '待确认订单' : '待处理订单', customer: o.customer_name, time: o.created_at }));
    const pendingFollowups = db.customers
      .filter(c => c.status === 1 && c.level !== 'potential')
      .slice(0, 5)
      .map(c => ({ id: c.id, type: 'followup', title: '客户跟进', customer: c.name, level: c.level, time: c.created_at }));
    res.json({ code: 200, data: [...pendingInquiries, ...pendingOrders, ...pendingFollowups].sort((a, b) => (b.time || '').localeCompare(a.time || '')) });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

module.exports = router;