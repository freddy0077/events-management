const Redis = require('ioredis');

console.log('Testing Redis connection...');

const redis = new Redis({
  host: '127.0.0.1',
  port: 6379,
  retryStrategy: (times) => {
    console.log(`Retry attempt ${times}`);
    if (times > 3) {
      return null; // Stop retrying
    }
    return Math.min(times * 100, 2000);
  }
});

redis.on('connect', () => {
  console.log('✅ Connected to Redis');
});

redis.on('ready', () => {
  console.log('✅ Redis is ready');
  redis.ping((err, result) => {
    if (err) {
      console.error('❌ PING failed:', err);
    } else {
      console.log('✅ PING successful:', result);
    }
    redis.quit();
    process.exit(0);
  });
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
});

redis.on('close', () => {
  console.log('Connection closed');
});

setTimeout(() => {
  console.log('❌ Timeout - could not connect');
  process.exit(1);
}, 5000);
