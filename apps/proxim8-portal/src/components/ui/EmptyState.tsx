"use client";

import { HiOutlineExclamationCircle } from "react-icons/hi";
import EmptyStateClient from "./EmptyStateClient";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  title: string;
  description: string;
  action?: EmptyStateAction;
  icon?: React.ReactNode;
}

export default function EmptyState({
  title,
  description,
  action,
  icon,
}: EmptyStateProps) {
  // If there's an action that requires client interactivity, use client component
  if (action) {
    return (
      <EmptyStateClient
        title={title}
        description={description}
        action={action}
        icon={icon}
      />
    );
  }

  // Otherwise render as server component
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
      </div>
    </div>
  );
}
