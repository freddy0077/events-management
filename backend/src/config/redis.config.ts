import { RedisOptions } from 'ioredis';

export const redisConfig: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,
  lazyConnect: false,
  connectTimeout: 10000,
  // Connection pool settings
  keepAlive: 30000,
};

export const getRedisConfig = (): RedisOptions => {
  const config = { ...redisConfig };
  
  // Log configuration (without password)
  console.log('🔧 Redis Configuration:', {
    host: config.host,
    port: config.port,
    db: config.db,
    hasPassword: !!config.password,
  });
  
  return config;
};
