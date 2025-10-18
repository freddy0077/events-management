import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { getRedisConfig } from '../config/redis.config';

@Injectable()
export class DistributedLockService implements OnModuleDestroy {
  private readonly logger = new Logger(DistributedLockService.name);
  private readonly redis: Redis;

  constructor() {
    const config = getRedisConfig();
    this.logger.log(`🔄 Attempting Redis connection to ${config.host}:${config.port}...`);
    
    this.redis = new Redis(config);
    
    this.redis.on('connect', () => {
      this.logger.log('✅ Redis connected for distributed locks');
    });
    
    this.redis.on('ready', () => {
      this.logger.log('✅ Redis ready for distributed locks');
    });
    
    this.redis.on('error', (error) => {
      this.logger.error('❌ Redis connection error (distributed locks):', error.message);
      this.logger.error('   Config:', { host: config.host, port: config.port, db: config.db });
    });
    
    this.redis.on('close', () => {
      this.logger.warn('⚠️ Redis connection closed (distributed locks)');
    });
  }

  async onModuleDestroy() {
    await this.redis.quit();
    this.logger.log('🔌 Redis connection closed');
  }

  /**
   * Acquire a distributed lock with automatic expiration
   * @param key - Lock identifier (e.g., 'event:123:category:456')
   * @param ttl - Time to live in milliseconds (default: 10000ms)
   * @param retries - Number of retry attempts (default: 5)
   * @param retryDelay - Delay between retries in ms (default: 100ms)
   * @returns Lock value if acquired, null if failed
   */
  async acquireLock(
    key: string,
    ttl: number = 10000,
    retries: number = 5,
    retryDelay: number = 100,
  ): Promise<string | null> {
    const lockValue = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const lockKey = `lock:${key}`;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        // SET NX (only if not exists) with expiration
        // Using SET with NX and PX options for atomic operation
        const result = await this.redis.set(
          lockKey,
          lockValue,
          'PX', // milliseconds
          ttl,
          'NX', // only set if not exists
        );

        if (result === 'OK') {
          this.logger.debug(`🔒 Lock acquired: ${lockKey} (attempt ${attempt + 1}/${retries})`);
          return lockValue;
        }

        // Lock already held, wait and retry
        if (attempt < retries - 1) {
          const backoff = retryDelay * Math.pow(2, attempt); // Exponential backoff
          this.logger.debug(`⏳ Lock busy, retrying in ${backoff}ms: ${lockKey}`);
          await this.sleep(backoff);
        }
      } catch (error) {
        this.logger.error(`Failed to acquire lock ${lockKey}:`, error);
        throw error;
      }
    }

    this.logger.warn(`⚠️ Failed to acquire lock after ${retries} attempts: ${lockKey}`);
    return null;
  }

  /**
   * Release a distributed lock
   * Uses Lua script to ensure we only delete our own lock
   * @param key - Lock identifier
   * @param lockValue - Value returned from acquireLock
   * @returns true if lock was released, false otherwise
   */
  async releaseLock(key: string, lockValue: string): Promise<boolean> {
    const lockKey = `lock:${key}`;

    // Lua script to ensure we only delete our own lock (atomic check-and-delete)
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    try {
      const result = await this.redis.eval(script, 1, lockKey, lockValue);
      
      if (result === 1) {
        this.logger.debug(`🔓 Lock released: ${lockKey}`);
        return true;
      }
      
      this.logger.warn(`⚠️ Lock not released (already expired or not owned): ${lockKey}`);
      return false;
    } catch (error) {
      this.logger.error(`Failed to release lock ${lockKey}:`, error);
      return false;
    }
  }

  /**
   * Extend lock TTL if still held
   * @param key - Lock identifier
   * @param lockValue - Value returned from acquireLock
   * @param ttl - New TTL in milliseconds
   * @returns true if lock was extended, false otherwise
   */
  async extendLock(key: string, lockValue: string, ttl: number): Promise<boolean> {
    const lockKey = `lock:${key}`;

    // Lua script to extend TTL only if we own the lock
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("pexpire", KEYS[1], ARGV[2])
      else
        return 0
      end
    `;

    try {
      const result = await this.redis.eval(script, 1, lockKey, lockValue, ttl);
      
      if (result === 1) {
        this.logger.debug(`⏰ Lock extended: ${lockKey} (+${ttl}ms)`);
        return true;
      }
      
      return false;
    } catch (error) {
      this.logger.error(`Failed to extend lock ${lockKey}:`, error);
      return false;
    }
  }

  /**
   * Check if a lock is currently held
   * @param key - Lock identifier
   * @returns true if lock exists, false otherwise
   */
  async isLocked(key: string): Promise<boolean> {
    const lockKey = `lock:${key}`;
    const exists = await this.redis.exists(lockKey);
    return exists === 1;
  }

  /**
   * Get remaining TTL for a lock
   * @param key - Lock identifier
   * @returns TTL in milliseconds, -1 if no TTL, -2 if key doesn't exist
   */
  async getLockTTL(key: string): Promise<number> {
    const lockKey = `lock:${key}`;
    return await this.redis.pttl(lockKey);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
