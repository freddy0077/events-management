'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ModernCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
  gradient?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
}

export const ModernCard: React.FC<ModernCardProps> = ({
  children,
  className = '',
  hover = true,
  delay = 0,
  gradient = false,
  gradientFrom = 'from-white',
  gradientTo = 'to-gray-50'
}) => {
  const baseClasses = gradient 
    ? `bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-2xl p-6 border border-gray-100 shadow-lg`
    : 'bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg';

  const hoverClasses = hover ? 'hover:shadow-xl transition-all duration-300' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={hover ? { scale: 1.02 } : undefined}
      className={`${baseClasses} ${hoverClasses} ${className}`}
    >
      {children}
    </motion.div>
  );
};

interface ModernCardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  rightContent?: React.ReactNode;
}

export const ModernCardHeader: React.FC<ModernCardHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  iconColor = 'bg-blue-100 text-blue-600',
  rightContent
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`p-2 rounded-lg ${iconColor}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {rightContent}
    </div>
  );
};
