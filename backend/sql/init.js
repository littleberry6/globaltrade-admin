const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function init() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root'
  });

  await conn.query('CREATE DATABASE IF NOT EXISTS globaltrade_admin DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  await conn.query('USE globaltrade_admin');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'manager', 'staff', 'viewer') DEFAULT 'staff',
      nickname VARCHAR(50),
      email VARCHAR(100),
      phone VARCHAR(20),
      avatar VARCHAR(500),
      status TINYINT DEFAULT 1,
      last_login_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS roles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      code VARCHAR(50) UNIQUE NOT NULL,
      permissions JSON,
      description VARCHAR(500),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      sku VARCHAR(100) UNIQUE,
      category VARCHAR(100),
      price DECIMAL(12,2) DEFAULT 0,
      cost_price DECIMAL(12,2) DEFAULT 0,
      stock INT DEFAULT 0,
      description TEXT,
      images JSON,
      status TINYINT DEFAULT 1,
      view_count INT DEFAULT 0,
      created_by INT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_no VARCHAR(50) UNIQUE NOT NULL,
      customer_id INT,
      customer_name VARCHAR(200),
      channel ENUM('alibaba', 'madeinchina', 'amazon', 'shopify', 'tiktok', 'direct') DEFAULT 'alibaba',
      total_amount DECIMAL(12,2) DEFAULT 0,
      status ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'completed', 'cancelled') DEFAULT 'pending',
      remark TEXT,
      created_by INT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT,
      product_name VARCHAR(200),
      sku VARCHAR(100),
      quantity INT DEFAULT 1,
      price DECIMAL(12,2) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS logistics (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      stage ENUM('picked_up', 'customs', 'warehouse', 'delivery', 'signed') NOT NULL,
      description VARCHAR(500),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      company VARCHAR(200),
      email VARCHAR(100),
      phone VARCHAR(20),
      level ENUM('vip', 'key', 'normal', 'potential') DEFAULT 'potential',
      source ENUM('alibaba', 'madeinchina', 'expo', 'online', 'referral', 'other'),
      address VARCHAR(500),
      remark TEXT,
      status TINYINT DEFAULT 1,
      created_by INT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      type ENUM('inquiry', 'quote', 'sample', 'negotiation') DEFAULT 'inquiry',
      content TEXT,
      amount DECIMAL(12,2),
      status ENUM('pending', 'replied', 'quoted', 'negotiating', 'won', 'lost') DEFAULT 'pending',
      created_by INT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS competitors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_name VARCHAR(200) NOT NULL,
      competitor_name VARCHAR(200) NOT NULL,
      category VARCHAR(100),
      price DECIMAL(12,2),
      url VARCHAR(500),
      remark TEXT,
      created_by INT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS operation_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      action ENUM('create', 'read', 'update', 'delete', 'login', 'export') NOT NULL,
      target_type VARCHAR(50),
      target_id INT,
      detail TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const hashed = await bcrypt.hash('admin123', 10);
  await conn.query(
    `INSERT IGNORE INTO users (username, password, role, nickname, email) VALUES (?, ?, 'admin', '超级管理员', 'admin@globaltrade.com')`,
    ['admin', hashed]
  );

  const sampleProducts = [
    ['Wireless Bluetooth Earbuds', 'SKU-BT-001', 'Electronics', 29.99, 15.00, 500, 'High-quality wireless earbuds with noise cancellation', '["img1.jpg","img2.jpg"]', 1],
    ['LED Desk Lamp', 'SKU-LED-002', 'Home', 39.99, 18.00, 300, 'Adjustable LED desk lamp with touch control', '["img1.jpg"]', 1],
    ['Stainless Steel Water Bottle', 'SKU-SS-003', 'Kitchen', 19.99, 8.00, 1000, 'Double-walled vacuum insulated bottle', '["img1.jpg","img2.jpg","img3.jpg"]', 1],
    ['Yoga Mat Premium', 'SKU-YG-004', 'Sports', 24.99, 10.00, 200, 'Non-slip eco-friendly yoga mat', '["img1.jpg"]', 1],
    ['Silicone Kitchen Utensils Set', 'SKU-SC-005', 'Kitchen', 34.99, 14.00, 150, '12-piece silicone utensil set', '["img1.jpg","img2.jpg"]', 1],
    ['Wireless Charger Pad', 'SKU-WC-006', 'Electronics', 19.99, 8.50, 400, 'Fast wireless charging pad for smartphones', '["img1.jpg"]', 1],
    ['Pet Grooming Brush', 'SKU-PG-007', 'Pet', 15.99, 6.00, 600, 'Self-cleaning pet grooming brush', '["img1.jpg","img2.jpg"]', 1],
    ['Outdoor Camping Tent', 'SKU-CT-008', 'Sports', 89.99, 45.00, 50, '4-person waterproof camping tent', '["img1.jpg","img2.jpg"]', 1],
    ['Baby Diaper Bag', 'SKU-BD-009', 'Baby', 42.99, 20.00, 100, 'Multi-function diaper bag backpack', '["img1.jpg"]', 1],
    ['Car Phone Holder', 'SKU-CP-010', 'Auto', 12.99, 4.50, 800, 'Magnetic car phone mount', '["img1.jpg"]', 1]
  ];
  for (const p of sampleProducts) {
    await conn.query(
      `INSERT INTO products (name, sku, category, price, cost_price, stock, description, images, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      p
    );
  }

  const sampleCustomers = [
    ['John Smith', 'TechGlobal Inc.', 'john@techglobal.com', '+1-555-0101', 'vip', 'alibaba', 'New York, USA', '长期合作客户'],
    ['Emma Wilson', 'HomeDecor Ltd.', 'emma@homedecor.co.uk', '+44-20-7946', 'key', 'madeinchina', 'London, UK', '家居品类大客户'],
    ['Raj Patel', 'SportGoods Co.', 'raj@sportgoods.in', '+91-98765', 'key', 'online', 'Mumbai, India', '体育用品'],
    ['Maria Garcia', 'BabyCare LLC', 'maria@babycare.com', '+1-555-0202', 'normal', 'expo', 'Los Angeles, USA', '展会客户'],
    ['Chen Wei', 'Evergreen Trade', 'chen@evergreen.com', '+65-6234', 'potential', 'referral', 'Singapore', '转介绍客户']
  ];
  for (const c of sampleCustomers) {
    await conn.query(
      `INSERT INTO customers (name, company, email, phone, level, source, address, remark, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      c
    );
  }

  const channels = ['alibaba', 'madeinchina', 'amazon', 'shopify', 'tiktok', 'direct'];
  const statuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];
  for (let i = 0; i < 50; i++) {
    const channel = channels[Math.floor(Math.random() * channels.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const customerId = Math.floor(Math.random() * 5) + 1;
    const customerName = sampleCustomers[customerId - 1][0];
    const itemCount = Math.floor(Math.random() * 3) + 1;
    let totalAmount = 0;
    const items = [];
    for (let j = 0; j < itemCount; j++) {
      const productId = Math.floor(Math.random() * 10) + 1;
      const qty = Math.floor(Math.random() * 10) + 1;
      const [prod] = await conn.query('SELECT * FROM products WHERE id = ?', [productId]);
      const price = prod[0].price;
      totalAmount += price * qty;
      items.push({ productId, qty, productName: prod[0].name, sku: prod[0].sku, price });
    }
    const orderNo = `GT${Date.now()}${String(i).padStart(4, '0')}`;
    const [orderResult] = await conn.query(
      `INSERT INTO orders (order_no, customer_id, customer_name, channel, total_amount, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [orderNo, customerId, customerName, channel, totalAmount, status]
    );
    const orderId = orderResult.insertId;
    for (const item of items) {
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, product_name, sku, quantity, price)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.productId, item.productName, item.sku, item.qty, item.price]
      );
    }
    if (status !== 'cancelled') {
      const stages = ['picked_up', 'customs', 'warehouse', 'delivery', 'signed'];
      const stageIdx = statuses.indexOf(status);
      for (let s = 0; s <= Math.min(stageIdx, stages.length - 1); s++) {
        await conn.query(
          `INSERT INTO logistics (order_id, stage, description) VALUES (?, ?, ?)`,
          [orderId, stages[s], `${stages[s]} completed`]
        );
      }
    }
  }

  const competitorData = [
    ['Wireless Bluetooth Earbuds', 'BrandA', 'Electronics', 39.99, 'https://example.com/a'],
    ['Wireless Bluetooth Earbuds', 'BrandB', 'Electronics', 34.99, 'https://example.com/b'],
    ['LED Desk Lamp', 'BrandC', 'Home', 49.99, 'https://example.com/c'],
    ['Stainless Steel Water Bottle', 'BrandD', 'Kitchen', 24.99, 'https://example.com/d'],
    ['Yoga Mat Premium', 'BrandE', 'Sports', 29.99, 'https://example.com/e']
  ];
  for (const comp of competitorData) {
    await conn.query(
      `INSERT INTO competitors (product_name, competitor_name, category, price, url, created_by)
       VALUES (?, ?, ?, ?, ?, 1)`,
      comp
    );
  }

  const rolePermissions = JSON.stringify([
    'product:view', 'product:create', 'product:edit', 'product:delete',
    'order:view', 'order:create', 'order:edit',
    'customer:view', 'customer:create', 'customer:edit',
    'analytics:view', 'system:log'
  ]);
  await conn.query(
    `INSERT IGNORE INTO roles (name, code, permissions, description) VALUES (?, ?, ?, ?)`,
    ['管理员', 'admin', rolePermissions, '拥有大部分操作权限']
  );
  await conn.query(
    `INSERT IGNORE INTO roles (name, code, permissions, description) VALUES (?, ?, ?, ?)`,
    ['运营', 'manager', JSON.stringify(['product:view', 'product:create', 'product:edit', 'order:view', 'order:create', 'customer:view', 'customer:create', 'customer:edit', 'analytics:view']), '运营角色']
  );
  await conn.query(
    `INSERT IGNORE INTO roles (name, code, permissions, description) VALUES (?, ?, ?, ?)`,
    ['业务员', 'staff', JSON.stringify(['product:view', 'order:view', 'customer:view', 'customer:create', 'analytics:view']), '业务员角色']
  );
  await conn.query(
    `INSERT IGNORE INTO roles (name, code, permissions, description) VALUES (?, ?, ?, ?)`,
    ['查看者', 'viewer', JSON.stringify(['product:view', 'order:view', 'analytics:view']), '只读角色']
  );

  console.log('Database initialized successfully!');
  console.log('Default admin: admin / admin123');
  await conn.end();
}

init().catch(err => {
  console.error('Init failed:', err);
  process.exit(1);
});