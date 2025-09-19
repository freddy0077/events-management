'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface ModernHeaderProps {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  stats?: Array<{
    label: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
  }>;
  actionButton?: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<{ className?: string }>;
  };
  gradient?: string;
}

export const ModernHeader: React.FC<ModernHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  stats = [],
  actionButton,
  gradient = "from-blue-600 via-indigo-600 to-purple-600"
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${gradient} p-8 shadow-2xl`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
      <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10" />
      <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10" />
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
            <Icon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {title}
            </h1>
            <p className="text-white/90 text-lg">
              {subtitle}
            </p>
            {stats.length > 0 && (
              <div className="flex items-center gap-4 mt-3 text-sm text-white/80">
                {stats.map((stat, index) => (
                  <span key={index} className="flex items-center gap-1">
                    <stat.icon className="h-4 w-4" />
                    {stat.value} {stat.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {actionButton && (
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={actionButton.onClick}
              size="lg"
              className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 hover:border-white/50 transition-all duration-300 shadow-lg"
            >
              {actionButton.icon && <actionButton.icon className="h-5 w-5 mr-2" />}
              {actionButton.label}
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
