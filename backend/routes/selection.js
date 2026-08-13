const express = require('express');
const store = require('../store');
const { auth } = require('../middleware/auth');
const { logOperation } = require('../middleware/logger');

const router = express.Router();

router.get('/competitors', auth, async (req, res) => {
  const { page = 1, pageSize = 10, keyword, category } = req.query;
  try {
    const db = store.getDB();
    let rows = [...db.competitors];
    if (keyword) {
      const kw = keyword.toLowerCase();
      rows = rows.filter(c =>
        (c.product_name && c.product_name.toLowerCase().includes(kw)) ||
        (c.competitor_name && c.competitor_name.toLowerCase().includes(kw))
      );
    }
    if (category) rows = rows.filter(c => c.category == category);
    const total = rows.length;
    rows.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    const list = rows.slice((page - 1) * pageSize, page * pageSize);
    res.json({ code: 200, data: { list, total } });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.post('/competitors', auth, async (req, res) => {
  const { productName, competitorName, category, price, url, remark } = req.body;
  try {
    const record = store.insert('competitors', {
      product_name: productName, competitor_name: competitorName,
      category, price, url, remark, created_by: req.user.id
    });
    await logOperation(req.user.id, 'create', 'competitor', record.id, `添加竞品: ${competitorName}`);
    res.json({ code: 200, data: { id: record.id } });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.put('/competitors/:id', auth, async (req, res) => {
  const { productName, competitorName, category, price, url, remark } = req.body;
  try {
    store.update('competitors', parseInt(req.params.id), {
      product_name: productName, competitor_name: competitorName,
      category, price, url, remark
    });
    res.json({ code: 200, message: '更新成功' });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.delete('/competitors/:id', auth, async (req, res) => {
  try {
    store.remove('competitors', parseInt(req.params.id));
    res.json({ code: 200, message: '删除成功' });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.get('/trending', auth, async (req, res) => {
  try {
    const db = store.getDB();
    const productSales = {};
    db.order_items.forEach(oi => {
      if (!productSales[oi.product_id]) productSales[oi.product_id] = 0;
      productSales[oi.product_id] += oi.quantity;
    });
    const avgCompetitorPrice = {};
    const compByCat = {};
    db.competitors.forEach(c => {
      if (!compByCat[c.category]) compByCat[c.category] = [];
      compByCat[c.category].push(c.price);
    });
    Object.keys(compByCat).forEach(cat => {
      const arr = compByCat[cat];
      avgCompetitorPrice[cat] = arr.reduce((a, b) => a + b, 0) / arr.length;
    });

    const rows = db.products
      .filter(p => p.status === 1)
      .map(p => ({
        category: p.category,
        name: p.name,
        sales_count: productSales[p.id] || 0,
        price: p.price,
        avg_competitor_price: avgCompetitorPrice[p.category] || null
      }))
      .sort((a, b) => b.sales_count - a.sales_count)
      .slice(0, 20);
    res.json({ code: 200, data: rows });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.get('/suggestions', auth, async (req, res) => {
  try {
    const db = store.getDB();
    const lowStock = db.products.filter(p => p.stock < 10 && p.status === 1)
      .sort((a, b) => a.stock - b.stock);
    const lowMargin = db.products.filter(p => p.status === 1)
      .map(p => ({ ...p, margin: p.price - p.cost_price, margin_rate: ((p.price - p.cost_price) / p.price * 100) || 0 }))
      .sort((a, b) => a.margin_rate - b.margin_rate)
      .slice(0, 20);
    const catSales = {};
    db.order_items.forEach(oi => {
      const p = db.products.find(pr => pr.id === oi.product_id);
      if (p) catSales[p.category] = (catSales[p.category] || 0) + oi.quantity;
    });
    const hotCategories = Object.entries(catSales)
      .map(([category, sales]) => ({ category, sales }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);
    res.json({ code: 200, data: { lowStock, lowMargin, hotCategories } });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

module.exports = router;