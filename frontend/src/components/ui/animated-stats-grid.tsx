'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface StatItem {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  loading?: boolean;
}

interface AnimatedStatsGridProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4 | 6;
}

export const AnimatedStatsGrid: React.FC<AnimatedStatsGridProps> = ({
  stats,
  columns = 6
}) => {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3 lg:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={`mt-8 grid ${gridCols[columns]} gap-4`}
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 + index * 0.05 }}
          whileHover={{ scale: 1.05 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-gradient-to-r ${stat.color} text-white shadow-lg`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-gray-600">{stat.label}</div>
              <div className="text-xl font-bold text-gray-900">
                {stat.loading ? (
                  <div className="w-8 h-6 bg-gray-200 rounded animate-pulse" />
                ) : (
                  stat.value
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};
