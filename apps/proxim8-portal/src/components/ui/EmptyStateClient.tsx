"use client";

import { HiOutlineExclamationCircle } from "react-icons/hi";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateClientProps {
  title: string;
  description: string;
  action: EmptyStateAction;
  icon?: React.ReactNode;
}

export default function EmptyStateClient({
  title,
  description,
  action,
  icon,
}: EmptyStateClientProps) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-4">
          {icon || (
            <HiOutlineExclamationCircle className="h-12 w-12 text-gray-400" />
          )}
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-400 mb-6">{description}</p>
        <button
          onClick={action.onClick}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          {action.label}
        </button>
      </div>
    </div>
  );
}
