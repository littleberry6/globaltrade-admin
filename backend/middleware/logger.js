const store = require('../store');

async function logOperation(userId, action, targetType, targetId, detail = '') {
  try {
    store.insert('operation_logs', {
      user_id: userId, action, target_type: targetType, target_id: targetId, detail
    });
  } catch (e) {
    console.error('Log write failed:', e.message);
  }
}

module.exports = { logOperation };