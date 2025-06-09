import { X } from "lucide-react";

interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  isDeploying?: boolean;
}

export function ModalHeader({ title, subtitle, onClose, isDeploying }: ModalHeaderProps) {
  return (
    <div className="p-6 border-b border-gray-800 relative">
      <button
        onClick={onClose}
        disabled={isDeploying}
        className={`absolute top-6 right-6 text-gray-400 hover:text-white transition-colors ${
          isDeploying ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <X className="w-6 h-6" />
      </button>
      
      <h2 className="text-2xl font-orbitron font-bold uppercase tracking-wide text-white">
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm text-gray-400 font-space-mono mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
}