'use client';

import { useState } from 'react';

interface TabToggleProps {
  onToggle: (tab: 'essays' | 'documents') => void;
}

export default function TabToggle({ onToggle }: TabToggleProps) {
  const [activeTab, setActiveTab] = useState<'essays' | 'documents'>('essays');

  const handleToggle = (tab: 'essays' | 'documents') => {
    setActiveTab(tab);
    onToggle(tab);
  };

  return (
    <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-gray-800">
      <button
        onClick={() => handleToggle('essays')}
        className={`px-4 py-3 text-lg font-medium transition-all ${
          activeTab === 'essays'
            ? 'text-black dark:text-white border-b-2 border-black dark:border-white'
            : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
        }`}
      >
        Essays
      </button>
      <button
        onClick={() => handleToggle('documents')}
        className={`px-4 py-3 text-lg font-medium transition-all ${
          activeTab === 'documents'
            ? 'text-black dark:text-white border-b-2 border-black dark:border-white'
            : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
        }`}
      >
        Documents
      </button>
    </div>
  );
}
