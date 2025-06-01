"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lore } from "@/types/lore";
import { NFTMetadata } from "@/types/nft";
import Proxim8Avatar from "@/components/proxim8/Proxim8Avatar";

interface LoreModalProps {
  lore: Lore;
  nft?: NFTMetadata;
  isOpen: boolean;
  onClose: () => void;
}

export default function LoreModal({ lore, nft, isOpen, onClose }: LoreModalProps) {
  const router = useRouter();
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900/95 border border-gray-700 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col animate-slide-up">
          {/* Header */}
          <div className="bg-gray-800/50 border-b border-gray-700 p-6">
            <div className="flex items-start gap-4">
              {/* Proxim8 Avatar - clickable to navigate */}
              {nft && (
                <Proxim8Avatar 
                  nft={nft} 
                  size="lg"
                  showName={false}
                  onClick={() => {
                    onClose();
                    router.push(`/agent/${nft.tokenId || nft.id}`);
                  }}
                />
              )}
              
              <div className="flex-1">
                <h2 className="font-orbitron text-xl font-bold text-gray-200">
                  Lore Recovered
                </h2>
                <p className="font-space-mono text-sm text-gray-400 mt-2">
                  Memory fragment successfully retrieved
                </p>
                {nft && (
                  <p className="font-space-mono text-xs text-gray-500 mt-1">
                    From: {nft.name || `Proxim8 #${nft.tokenId}`}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            <h3 className="font-orbitron text-xl text-gray-200 mb-4">
              {lore.title}
            </h3>
            
            {/* Background context if available */}
            {lore.background && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-4">
                <p className="font-space-mono text-xs text-gray-500 mb-2">CONTEXT</p>
                <p className="font-space-mono text-sm text-gray-400">{lore.background}</p>
              </div>
            )}
            
            <div className="font-space-mono text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
              {lore.content}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-700/50 p-4 flex justify-between items-center flex-shrink-0">
            <p className="font-space-mono text-xs text-gray-500">
              CLAIMED: {new Date(lore.claimedAt || lore.updatedAt).toLocaleDateString()}
            </p>
            <button
              onClick={onClose}
              className="font-space-mono px-6 py-2 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 hover:border-gray-600 transition-all"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </>
  );
}