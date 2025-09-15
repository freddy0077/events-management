'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ModernFiltersProps {
  isOpen: boolean;
  onToggle: () => void;
  onClear?: () => void;
  children: React.ReactNode;
  title?: string;
}

export const ModernFilters: React.FC<ModernFiltersProps> = ({
  isOpen,
  onToggle,
  onClear,
  children,
  title = "Filters"
}) => {
  return (
    <>
      {/* Filter Toggle Button */}
      <button
        onClick={onToggle}
        className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
          isOpen
            ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        <FunnelIcon className="h-4 w-4" />
        <span>{title}</span>
      </button>

      {/* Filter Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 shadow-lg mt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FunnelIcon className="h-5 w-5 text-gray-600" />
                  Advanced {title}
                </h3>
                <div className="flex items-center gap-2">
                  {onClear && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onClear}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <XMarkIcon className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                  <button
                    onClick={onToggle}
                    className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </div>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
