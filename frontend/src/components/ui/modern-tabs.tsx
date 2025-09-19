'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TabItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number | null;
}

interface ModernTabsProps {
  tabs: TabItem[];
  selectedTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
  rightContent?: React.ReactNode;
}

export const ModernTabs: React.FC<ModernTabsProps> = ({
  tabs,
  selectedTab,
  onTabChange,
  children,
  rightContent
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mt-8"
    >
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-1 bg-gray-100 rounded-2xl p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  selectedTab === tab.id
                    ? 'bg-white text-blue-700 shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
                {tab.count !== null && tab.count !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      selectedTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {rightContent && (
            <div className="flex items-center space-x-3">
              {rightContent}
            </div>
          )}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
