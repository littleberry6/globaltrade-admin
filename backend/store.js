const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function load() {
  if (!fs.existsSync(DATA_FILE)) {
    return seed();
  }
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    return seed();
  }
}

function save(db) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

function seed() {
  const bcrypt = require('bcryptjs');
  const db = {
    users: [],
    roles: [],
    products: [],
    orders: [],
    order_items: [],
    logistics: [],
    customers: [],
    inquiries: [],
    competitors: [],
    operation_logs: [],
    _seq: { users: 1, roles: 1, products: 1, orders: 1, order_items: 1, logistics: 1, customers: 1, inquiries: 1, competitors: 1, operation_logs: 1 }
  };

  async function doSeed() {
    const hashed = await bcrypt.hash('admin123', 10);
    db.users.push({
      id: 1, username: 'admin', password: hashed, role: 'admin',
      nickname: '超级管理员', email: 'admin@globaltrade.com', phone: '', status: 1,
      last_login_at: null, created_at: new Date().toISOString()
    });
    db._seq.users = 2;

    db.roles.push({ id: 1, name: '管理员', code: 'admin', permissions: ['product:view','product:create','product:edit','product:delete','order:view','order:create','order:edit','customer:view','customer:create','customer:edit','analytics:view','system:log'], description: '管理员角色' });
    db.roles.push({ id: 2, name: '运营', code: 'manager', permissions: ['product:view','product:create','product:edit','order:view','order:create','customer:view','customer:create','customer:edit','analytics:view'], description: '运营角色' });
    db.roles.push({ id: 3, name: '业务员', code: 'staff', permissions: ['product:view','order:view','customer:view','customer:create','analytics:view'], description: '业务员角色' });
    db.roles.push({ id: 4, name: '查看者', code: 'viewer', permissions: ['product:view','order:view','analytics:view'], description: '只读角色' });
    db._seq.roles = 5;

    const products = [
      ['Wireless Bluetooth Earbuds', 'SKU-BT-001', 'Electronics', 29.99, 15.00, 500, 'High-quality wireless earbuds with noise cancellation', ['img1.jpg','img2.jpg']],
      ['LED Desk Lamp', 'SKU-LED-002', 'Home', 39.99, 18.00, 300, 'Adjustable LED desk lamp with touch control', ['img1.jpg']],
      ['Stainless Steel Water Bottle', 'SKU-SS-003', 'Kitchen', 19.99, 8.00, 1000, 'Double-walled vacuum insulated bottle', ['img1.jpg','img2.jpg','img3.jpg']],
      ['Yoga Mat Premium', 'SKU-YG-004', 'Sports', 24.99, 10.00, 200, 'Non-slip eco-friendly yoga mat', ['img1.jpg']],
      ['Silicone Kitchen Utensils Set', 'SKU-SC-005', 'Kitchen', 34.99, 14.00, 150, '12-piece silicone utensil set', ['img1.jpg','img2.jpg']],
      ['Wireless Charger Pad', 'SKU-WC-006', 'Electronics', 19.99, 8.50, 400, 'Fast wireless charging pad', ['img1.jpg']],
      ['Pet Grooming Brush', 'SKU-PG-007', 'Pet', 15.99, 6.00, 600, 'Self-cleaning pet grooming brush', ['img1.jpg','img2.jpg']],
      ['Outdoor Camping Tent', 'SKU-CT-008', 'Sports', 89.99, 45.00, 50, '4-person waterproof camping tent', ['img1.jpg','img2.jpg']],
      ['Baby Diaper Bag', 'SKU-BD-009', 'Baby', 42.99, 20.00, 100, 'Multi-function diaper bag backpack', ['img1.jpg']],
      ['Car Phone Holder', 'SKU-CP-010', 'Auto', 12.99, 4.50, 800, 'Magnetic car phone mount', ['img1.jpg']]
    ];
    products.forEach(p => {
      db.products.push({
        id: db._seq.products++, name: p[0], sku: p[1], category: p[2], price: p[3], cost_price: p[4],
        stock: p[5], description: p[6], images: p[7], status: 1, view_count: Math.floor(Math.random() * 500) + 50,
        created_by: 1, created_at: new Date().toISOString()
      });
    });

    const customers = [
      ['John Smith', 'TechGlobal Inc.', 'john@techglobal.com', '+1-555-0101', 'vip', 'alibaba', 'New York, USA', '长期合作客户'],
      ['Emma Wilson', 'HomeDecor Ltd.', 'emma@homedecor.co.uk', '+44-20-7946', 'key', 'madeinchina', 'London, UK', '家居品类大客户'],
      ['Raj Patel', 'SportGoods Co.', 'raj@sportgoods.in', '+91-98765', 'key', 'online', 'Mumbai, India', '体育用品'],
      ['Maria Garcia', 'BabyCare LLC', 'maria@babycare.com', '+1-555-0202', 'normal', 'expo', 'Los Angeles, USA', '展会客户'],
      ['Chen Wei', 'Evergreen Trade', 'chen@evergreen.com', '+65-6234', 'potential', 'referral', 'Singapore', '转介绍客户']
    ];
    customers.forEach(c => {
      db.customers.push({
        id: db._seq.customers++, name: c[0], company: c[1], email: c[2], phone: c[3],
        level: c[4], source: c[5], address: c[6], remark: c[7], status: 1, created_by: 1, created_at: new Date().toISOString()
      });
    });

    const channels = ['alibaba', 'madeinchina', 'amazon', 'shopify', 'tiktok', 'direct'];
    const statuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];
    for (let i = 0; i < 50; i++) {
      const channel = channels[Math.floor(Math.random() * channels.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const customerId = Math.floor(Math.random() * 5) + 1;
      const customer = db.customers.find(c => c.id === customerId);
      const itemCount = Math.floor(Math.random() * 3) + 1;
      let totalAmount = 0;
      const orderItems = [];
      for (let j = 0; j < itemCount; j++) {
        const productId = Math.floor(Math.random() * 10) + 1;
        const product = db.products.find(p => p.id === productId);
        const qty = Math.floor(Math.random() * 10) + 1;
        totalAmount += product.price * qty;
        orderItems.push({ productId, productName: product.name, sku: product.sku, quantity: qty, price: product.price });
      }
      const orderId = db._seq.orders++;
      db.orders.push({
        id: orderId, order_no: `GT${Date.now()}${String(i).padStart(4,'0')}`,
        customer_id: customerId, customer_name: customer.name, channel,
        total_amount: totalAmount, status, remark: '', created_by: 1,
        created_at: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 3600 * 1000)).toISOString()
      });
      orderItems.forEach(oi => {
        db.order_items.push({
          id: db._seq.order_items++, order_id: orderId, product_id: oi.productId,
          product_name: oi.productName, sku: oi.sku, quantity: oi.quantity, price: oi.price
        });
      });
      if (status !== 'cancelled') {
        const stageIdx = statuses.indexOf(status);
        const stages = ['picked_up', 'customs', 'warehouse', 'delivery', 'signed'];
        for (let s = 0; s <= Math.min(stageIdx, stages.length - 1); s++) {
          db.logistics.push({
            id: db._seq.logistics++, order_id: orderId, stage: stages[s],
            description: `${stages[s]} completed`,
            created_at: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 3600 * 1000)).toISOString()
          });
        }
      }
    }

    const comps = [
      ['Wireless Bluetooth Earbuds', 'BrandA', 'Electronics', 39.99, 'https://example.com/a'],
      ['Wireless Bluetooth Earbuds', 'BrandB', 'Electronics', 34.99, 'https://example.com/b'],
      ['LED Desk Lamp', 'BrandC', 'Home', 49.99, 'https://example.com/c'],
      ['Stainless Steel Water Bottle', 'BrandD', 'Kitchen', 24.99, 'https://example.com/d'],
      ['Yoga Mat Premium', 'BrandE', 'Sports', 29.99, 'https://example.com/e']
    ];
    comps.forEach(c => {
      db.competitors.push({
        id: db._seq.competitors++, product_name: c[0], competitor_name: c[1],
        category: c[2], price: c[3], url: c[4], remark: '', created_by: 1, created_at: new Date().toISOString()
      });
    });

    save(db);
    console.log('Database initialized! Admin: admin / admin123');
  }

  doSeed().catch(e => console.error('Seed error:', e));
  return db;
}

let _db = null;
function getDB() {
  if (!_db) _db = load();
  return _db;
}

function persist() {
  save(_db);
}

function query(table, conditions = {}) {
  const db = getDB();
  let rows = db[table] || [];
  for (const [key, val] of Object.entries(conditions)) {
    if (val === undefined || val === null || val === '') continue;
    if (typeof val === 'object' && val.like) {
      const pattern = val.like.replace(/%/g, '');
      rows = rows.filter(r => (r[key] || '').toLowerCase().includes(pattern.toLowerCase()));
    } else if (typeof val === 'object' && val.gte) {
      rows = rows.filter(r => r[key] >= val.gte);
    } else if (typeof val === 'object' && val.lte) {
      rows = rows.filter(r => r[key] <= val.lte);
    } else {
      rows = rows.filter(r => r[key] == val);
    }
  }
  return rows;
}

function queryOne(table, conditions = {}) {
  return query(table, conditions)[0] || null;
}

function insert(table, data) {
  const db = getDB();
  const id = db._seq[table]++;
  const record = { id, created_at: new Date().toISOString(), ...data };
  db[table].push(record);
  persist();
  return record;
}

function update(table, id, data) {
  const db = getDB();
  const idx = db[table].findIndex(r => r.id === id);
  if (idx >= 0) {
    db[table][idx] = { ...db[table][idx], ...data, updated_at: new Date().toISOString() };
    persist();
    return db[table][idx];
  }
  return null;
}

function remove(table, id) {
  const db = getDB();
  const idx = db[table].findIndex(r => r.id === id);
  if (idx >= 0) {
    db[table].splice(idx, 1);
    persist();
    return true;
  }
  return false;
}

function paginate(table, conditions = {}, page = 1, pageSize = 10, orderBy = 'created_at', order = 'desc') {
  let rows = query(table, conditions);
  const total = rows.length;
  rows.sort((a, b) => {
    const va = a[orderBy], vb = b[orderBy];
    if (va < vb) return order === 'desc' ? 1 : -1;
    if (va > vb) return order === 'desc' ? -1 : 1;
    return 0;
  });
  const list = rows.slice((page - 1) * pageSize, page * pageSize);
  return { list, total };
}

module.exports = { query, queryOne, insert, update, remove, paginate, getDB, persist };