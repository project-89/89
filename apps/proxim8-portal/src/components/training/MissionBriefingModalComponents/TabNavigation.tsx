interface TabNavigationProps {
  tabs: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  disabled?: boolean;
}

export function TabNavigation({ tabs, activeTab, onTabChange, disabled }: TabNavigationProps) {
  return (
    <div className="flex space-x-1 p-1 bg-gray-800/50 rounded-lg">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => !disabled && onTabChange(tab.id)}
          disabled={disabled}
          className={`
            flex-1 px-4 py-2 rounded-md transition-all text-sm font-space-mono uppercase tracking-wider
            ${activeTab === tab.id
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <div className="flex items-center justify-center gap-2">
            {tab.icon}
            <span>{tab.label}</span>
          </div>
        </button>
      ))}
    </div>
  );
}