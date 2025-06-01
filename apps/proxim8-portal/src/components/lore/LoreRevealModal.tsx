"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lore } from "@/types/lore";
import { NFTMetadata } from "@/types/nft";
import Proxim8Avatar from "@/components/proxim8/Proxim8Avatar";

interface LoreRevealModalProps {
  lore: Lore;
  nft?: NFTMetadata;
  isOpen: boolean;
  onClose: () => void;
}

export default function LoreRevealModal({ lore, nft, isOpen, onClose }: LoreRevealModalProps) {
  const router = useRouter();
  const [stage, setStage] = useState<'decrypting' | 'revealing' | 'revealed'>('decrypting');
  const [decryptProgress, setDecryptProgress] = useState(0);
  const [glitchText, setGlitchText] = useState('');
  
  // Glitch characters for the decryption effect
  const glitchChars = '█▓▒░╔╗╚╝║═╬╩╦╠╣╟╢╤╥╙╘╒╓╫╪┘┌';
  
  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setStage('decrypting');
      setDecryptProgress(0);
      setGlitchText('');
      
      // Start decryption animation
      const timer = setTimeout(() => {
        startDecryption();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  // Decryption animation
  const startDecryption = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      setDecryptProgress(Math.min(progress, 100));
      
      // Generate glitch text
      const glitchLength = Math.floor(Math.random() * 50) + 20;
      const newGlitch = Array(glitchLength)
        .fill(0)
        .map(() => glitchChars[Math.floor(Math.random() * glitchChars.length)])
        .join('');
      setGlitchText(newGlitch);
      
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setStage('revealing');
          setTimeout(() => {
            setStage('revealed');
          }, 1000);
        }, 500);
      }
    }, 100);
  };
  
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && stage === 'revealed') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose, stage]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 animate-fade-in"
        onClick={stage === 'revealed' ? onClose : undefined}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-black border border-gray-800 rounded-lg max-w-2xl w-full overflow-hidden">
          
          {/* Decrypting Stage */}
          {stage === 'decrypting' && (
            <div className="p-12 text-center">
              <div className="mb-8">
                <div className="font-orbitron text-xs text-primary-500 mb-2 tracking-wider animate-pulse">
                  ACCESSING QUANTUM SUBSTRATE...
                </div>
                <div className="font-space-mono text-2xl text-gray-300 mb-6">
                  MEMORY FRAGMENT DETECTED
                </div>
                
                {/* Glitch text effect */}
                <div className="h-20 overflow-hidden mb-6">
                  <pre className="font-space-mono text-xs text-primary-500/50 leading-tight whitespace-pre-wrap break-all animate-pulse">
                    {glitchText}
                  </pre>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-gray-900 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary-500 to-cyan-500 transition-all duration-300"
                    style={{ width: `${decryptProgress}%` }}
                  />
                </div>
                <p className="font-space-mono text-xs text-gray-500 mt-2">
                  DECRYPTING: {Math.floor(decryptProgress)}%
                </p>
              </div>
            </div>
          )}
          
          {/* Revealing Stage */}
          {stage === 'revealing' && (
            <div className="p-12 text-center animate-pulse">
              <div className="mb-8">
                <div className="font-orbitron text-sm text-cyan-400 mb-4 tracking-wider">
                  DECRYPTION COMPLETE
                </div>
                <div className="font-orbitron text-3xl text-primary-500 animate-fade-in">
                  LORE RECOVERED
                </div>
              </div>
            </div>
          )}
          
          {/* Revealed Stage */}
          {stage === 'revealed' && (
            <div className="animate-fade-in">
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 p-6">
                <div className="flex items-start gap-4">
                  {/* Proxim8 Avatar */}
                  {nft && (
                    <div className="animate-slide-right">
                      <Proxim8Avatar 
                        nft={nft} 
                        size="lg"
                        showName={false}
                        onClick={() => {
                          onClose();
                          router.push(`/agent/${nft.tokenId || nft.id}`);
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="flex-1 animate-slide-up">
                    <div className="font-space-mono text-xs text-cyan-400 mb-2">
                      MEMORY RECOVERY SUCCESSFUL
                    </div>
                    <h2 className="font-orbitron text-xl font-bold text-gray-200">
                      {lore.title}
                    </h2>
                    {nft && (
                      <p className="font-space-mono text-xs text-gray-500 mt-2">
                        Recovered from: {nft.name || `Proxim8 #${nft.tokenId}`}
                      </p>
                    )}
                    
                    {/* Lore type and rarity */}
                    <div className="flex items-center gap-3 mt-3">
                      {lore.traits?.attributeName && (
                        <span className="font-space-mono text-xs px-2 py-1 bg-primary-500/20 text-primary-400 rounded">
                          {lore.traits.attributeName}
                        </span>
                      )}
                      {lore.rarity && (
                        <span className="font-space-mono text-xs px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded">
                          {lore.rarity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[50vh]">
                {/* Background context if available */}
                {lore.background && (
                  <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 mb-4 animate-slide-up">
                    <p className="font-space-mono text-xs text-cyan-400 mb-2">CONTEXT</p>
                    <p className="font-space-mono text-sm text-gray-400">{lore.background}</p>
                  </div>
                )}
                
                <div className="font-space-mono text-sm text-gray-300 whitespace-pre-wrap leading-relaxed animate-slide-up animation-delay-200">
                  {lore.content}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-700/50 p-4 flex justify-between items-center bg-gray-900/50">
                <div className="font-space-mono text-xs text-gray-500">
                  <span className="text-cyan-400">◈</span> FRAGMENT STORED IN ARCHIVE
                </div>
                <button
                  onClick={onClose}
                  className="font-space-mono px-6 py-2 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 hover:border-primary-500/50 transition-all"
                >
                  CONTINUE
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}