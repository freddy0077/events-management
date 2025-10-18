import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { getRedisConfig } from '../config/redis.config';

@Injectable()
export class CapacityCounterService implements OnModuleDestroy {
  private readonly logger = new Logger(CapacityCounterService.name);
  private readonly redis: Redis;
  private readonly CACHE_TTL = 300; // 5 minutes in seconds

  constructor() {
    const config = getRedisConfig();
    this.logger.log(`🔄 Attempting Redis connection to ${config.host}:${config.port}...`);
    
    this.redis = new Redis(config);
    
    this.redis.on('connect', () => {
      this.logger.log('✅ Redis connected for capacity counters');
    });
    
    this.redis.on('ready', () => {
      this.logger.log('✅ Redis ready for capacity counters');
    });
    
    this.redis.on('error', (error) => {
      this.logger.error('❌ Redis connection error (capacity counters):', error.message);
      this.logger.error('   Config:', { host: config.host, port: config.port, db: config.db });
    });
    
    this.redis.on('close', () => {
      this.logger.warn('⚠️ Redis connection closed (capacity counters)');
    });
  }

  async onModuleDestroy() {
    await this.redis.quit();
    this.logger.log('🔌 Redis connection closed');
  }

  /**
   * Get current capacity count from Redis cache
   * @param type - 'event' or 'category'
   * @param id - Event or category ID
   * @returns Current count, or null if not cached
   */
  async getCapacityCount(
    type: 'event' | 'category',
    id: string,
  ): Promise<number | null> {
    const key = this.getCapacityKey(type, id);

    try {
      const cached = await this.redis.get(key);
      if (cached !== null) {
        const count = parseInt(cached, 10);
        this.logger.debug(`📊 Capacity cache hit: ${key} = ${count}`);
        return count;
      }

      this.logger.debug(`📊 Capacity cache miss: ${key}`);
      return null;
    } catch (error) {
      this.logger.error(`Failed to get capacity count for ${key}:`, error);
      return null;
    }
  }

  /**
   * Increment capacity counter atomically
   * @param type - 'event' or 'category'
   * @param id - Event or category ID
   * @returns New count after increment
   */
  async incrementCapacity(
    type: 'event' | 'category',
    id: string,
  ): Promise<number> {
    const key = this.getCapacityKey(type, id);

    try {
      const newCount = await this.redis.incr(key);
      await this.redis.expire(key, this.CACHE_TTL);
      
      this.logger.debug(`📈 Capacity incremented: ${key} = ${newCount}`);
      return newCount;
    } catch (error) {
      this.logger.error(`Failed to increment capacity for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Decrement capacity counter atomically
   * @param type - 'event' or 'category'
   * @param id - Event or category ID
   * @returns New count after decrement (never below 0)
   */
  async decrementCapacity(
    type: 'event' | 'category',
    id: string,
  ): Promise<number> {
    const key = this.getCapacityKey(type, id);

    try {
      // Use Lua script to ensure we never go below 0
      const script = `
        local current = redis.call("get", KEYS[1])
        if current and tonumber(current) > 0 then
          return redis.call("decr", KEYS[1])
        else
          return 0
        end
      `;

      const newCount = await this.redis.eval(script, 1, key) as number;
      await this.redis.expire(key, this.CACHE_TTL);
      
      this.logger.debug(`📉 Capacity decremented: ${key} = ${newCount}`);
      return Math.max(0, newCount);
    } catch (error) {
      this.logger.error(`Failed to decrement capacity for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Set capacity count explicitly (sync with database)
   * @param type - 'event' or 'category'
   * @param id - Event or category ID
   * @param count - Exact count to set
   */
  async setCapacityCount(
    type: 'event' | 'category',
    id: string,
    count: number,
  ): Promise<void> {
    const key = this.getCapacityKey(type, id);

    try {
      await this.redis.set(key, count.toString(), 'EX', this.CACHE_TTL);
      this.logger.debug(`📊 Capacity set: ${key} = ${count}`);
    } catch (error) {
      this.logger.error(`Failed to set capacity for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Invalidate capacity cache (force refresh from database)
   * @param type - 'event' or 'category'
   * @param id - Event or category ID
   */
  async invalidateCapacity(type: 'event' | 'category', id: string): Promise<void> {
    const key = this.getCapacityKey(type, id);
    
    try {
      await this.redis.del(key);
      this.logger.debug(`🗑️ Capacity cache invalidated: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to invalidate capacity for ${key}:`, error);
    }
  }

  /**
   * Get multiple capacity counts in a single operation
   * @param items - Array of {type, id} objects
   * @returns Map of keys to counts
   */
  async getMultipleCapacityCounts(
    items: Array<{ type: 'event' | 'category'; id: string }>,
  ): Promise<Map<string, number | null>> {
    if (items.length === 0) {
      return new Map();
    }

    const keys = items.map(item => this.getCapacityKey(item.type, item.id));
    const results = new Map<string, number | null>();

    try {
      const values = await this.redis.mget(...keys);
      
      keys.forEach((key, index) => {
        const value = values[index];
        results.set(key, value !== null ? parseInt(value, 10) : null);
      });

      return results;
    } catch (error) {
      this.logger.error('Failed to get multiple capacity counts:', error);
      return new Map();
    }
  }

  /**
   * Sync capacity count from database
   * This should be called periodically or when cache is stale
   * @param type - 'event' or 'category'
   * @param id - Event or category ID
   * @param actualCount - Count from database
   */
  async syncCapacityFromDatabase(
    type: 'event' | 'category',
    id: string,
    actualCount: number,
  ): Promise<void> {
    await this.setCapacityCount(type, id, actualCount);
    this.logger.log(`🔄 Capacity synced from database: ${type}:${id} = ${actualCount}`);
  }

  /**
   * Get cache statistics for monitoring
   */
  async getCacheStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
    hitRate: number;
  }> {
    try {
      const info = await this.redis.info('stats');
      const keyspaceInfo = await this.redis.info('keyspace');
      
      // Parse info for basic stats
      const totalKeys = (await this.redis.dbsize()) || 0;
      
      return {
        totalKeys,
        memoryUsage: 'N/A', // Would need additional parsing
        hitRate: 0, // Would need to track hits/misses
      };
    } catch (error) {
      this.logger.error('Failed to get cache stats:', error);
      return {
        totalKeys: 0,
        memoryUsage: 'Error',
        hitRate: 0,
      };
    }
  }

  private getCapacityKey(type: 'event' | 'category', id: string): string {
    return `capacity:${type}:${id}`;
  }
}
