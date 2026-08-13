const express = require('express');
const store = require('../store');
const { auth, authorize } = require('../middleware/auth');
const { logOperation } = require('../middleware/logger');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  const { page = 1, pageSize = 10, keyword, status, category } = req.query;
  try {
    let conditions = {};
    if (keyword) {
      const db = store.getDB();
      let rows = db.products.filter(p =>
        (p.name && p.name.toLowerCase().includes(keyword.toLowerCase())) ||
        (p.sku && p.sku.toLowerCase().includes(keyword.toLowerCase()))
      );
      if (status !== undefined && status !== '') rows = rows.filter(r => r.status == status);
      if (category) rows = rows.filter(r => r.category == category);
      const total = rows.length;
      rows.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
      const list = rows.slice((page - 1) * pageSize, page * pageSize);
      return res.json({ code: 200, data: { list, total } });
    }
    if (status !== undefined && status !== '') conditions.status = status;
    if (category) conditions.category = category;
    const { list, total } = store.paginate('products', conditions, page, pageSize);
    res.json({ code: 200, data: { list, total } });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.get('/categories', auth, async (req, res) => {
  try {
    const db = store.getDB();
    const cats = [...new Set(db.products.map(p => p.category).filter(Boolean))];
    res.json({ code: 200, data: cats });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const product = store.queryOne('products', { id: parseInt(req.params.id) });
    if (!product) return res.json({ code: 404, message: '产品不存在' });
    res.json({ code: 200, data: product });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.post('/', auth, async (req, res) => {
  const { name, sku, category, price, costPrice, stock, description, images, status } = req.body;
  try {
    const record = store.insert('products', {
      name, sku, category, price, cost_price: costPrice, stock,
      description, images: images || [], status: status ?? 1, created_by: req.user.id
    });
    await logOperation(req.user.id, 'create', 'product', record.id, `创建产品: ${name}`);
    res.json({ code: 200, data: { id: record.id } });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  const { name, sku, category, price, costPrice, stock, description, images, status } = req.body;
  try {
    store.update('products', parseInt(req.params.id), {
      name, sku, category, price, cost_price: costPrice, stock,
      description, images: images || [], status
    });
    await logOperation(req.user.id, 'update', 'product', req.params.id, `更新产品: ${name}`);
    res.json({ code: 200, message: '更新成功' });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.delete('/:id', auth, authorize('admin', 'manager'), async (req, res) => {
  try {
    store.remove('products', parseInt(req.params.id));
    await logOperation(req.user.id, 'delete', 'product', req.params.id);
    res.json({ code: 200, message: '删除成功' });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.put('/:id/status', auth, async (req, res) => {
  const { status } = req.body;
  try {
    store.update('products', parseInt(req.params.id), { status });
    await logOperation(req.user.id, 'update', 'product', req.params.id, `状态变更: ${status}`);
    res.json({ code: 200, message: '状态更新成功' });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

router.post('/batch/import', auth, async (req, res) => {
  const { products } = req.body;
  try {
    let imported = 0;
    for (const p of products) {
      store.insert('products', {
        name: p.name, sku: p.sku, category: p.category, price: p.price,
        cost_price: p.costPrice, stock: p.stock, description: p.description,
        images: p.images || [], status: p.status ?? 1, created_by: req.user.id
      });
      imported++;
    }
    await logOperation(req.user.id, 'create', 'product', 0, `批量导入${imported}个产品`);
    res.json({ code: 200, data: { imported } });
  } catch (e) {
    res.json({ code: 500, message: e.message });
  }
});

module.exports = router;