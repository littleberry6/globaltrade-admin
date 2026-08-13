const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.redirect('http://localhost:5173');
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/selection', require('./routes/selection'));
app.use('/api/system', require('./routes/system'));

app.get('/api/health', (req, res) => {
  res.json({ code: 200, message: 'GlobalTrade Admin API is running', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ code: 500, message: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`GlobalTrade Admin API running on port ${PORT}`);
});