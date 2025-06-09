"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWalletAuth } from "@/stores/walletAuthStore";
import { useNftStore } from "@/stores/nftStore";
import NFTImage from "@/components/common/NFTImage";
import LoreCard from "@/components/lore/LoreCard";
import UnclaimedLoreCard from "@/components/lore/UnclaimedLoreCard";
import LoreModal from "@/components/lore/LoreModal";
import LoreRevealModal from "@/components/lore/LoreRevealModal";
import { Lore } from "@/types/lore";
import { NFTMetadata } from "@/types/nft";
import { getUserNftLoreItems, claimLoreById } from "@/services/lore";
import { useAnalytics } from "@/hooks/useAnalytics";

export default function LoreClient() {
  const router = useRouter();
  const { track } = useAnalytics();
  const { connected, isAuthenticated, walletAddress } = useWalletAuth();
  const userNfts = useNftStore((state) => state.userNfts);
  const [backgroundNumber] = useState(() => Math.floor(Math.random() * 19) + 1);
  const [allLoreItems, setAllLoreItems] = useState<
    Array<Lore & { claimed: boolean; nftData?: any }>
  >([]);
  const [loreLoading, setLoreLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [selectedLore, setSelectedLore] = useState<Lore | null>(null);
  const [selectedNft, setSelectedNft] = useState<NFTMetadata | null>(null);
  const [showLoreModal, setShowLoreModal] = useState(false);
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [isNewClaim, setIsNewClaim] = useState(false);

  // Derived states
  const claimedLoreItems = allLoreItems.filter((item) => item.claimed);
  const unclaimedLoreItems = allLoreItems.filter((item) => !item.claimed);
  const hasUnclaimedLore = unclaimedLoreItems.length > 0;
  const unclaimedCount = unclaimedLoreItems.length;

  // Fetch all lore items (claimed and unclaimed)
  useEffect(() => {
    const fetchLore = async () => {
      if (!connected || !isAuthenticated || !walletAddress) {
        setLoreLoading(false);
        return;
      }

      setLoreLoading(true);
      try {
        // Get all lore items for user's NFTs
        const loreItems = await getUserNftLoreItems();
        setAllLoreItems(loreItems);
      } catch (error) {
        console.error("Error fetching lore:", error);
      } finally {
        setLoreLoading(false);
      }
    };

    fetchLore();
  }, [connected, isAuthenticated, walletAddress]);

  // Handle claiming a specific lore item
  const handleClaimLore = async (loreId: string, nftId?: string) => {
    if (!connected || !isAuthenticated || !walletAddress) return;

    track('lore_claim_started', {
      lore_id: loreId,
      nft_id: nftId,
      unclaimed_count: unclaimedLoreItems.length
    });

    try {
      setClaiming(true);
      setClaimingId(loreId);
      const claimedLoreItem = await claimLoreById(loreId, nftId);

      if (claimedLoreItem) {
        // Update the lore item in our list
        setAllLoreItems((prev) =>
          prev.map((item) =>
            item.id === loreId
              ? { ...item, ...claimedLoreItem, claimed: true }
              : item
          )
        );

        setSelectedLore(claimedLoreItem);

        // Find the NFT that this lore belongs to
        const nft = userNfts.find((n) => n.tokenId === nftId || n.id === nftId);
        if (!nft && claimedLoreItem.nftId) {
          // Try to find by lore's nftId
          const nftFromLore = userNfts.find(
            (n) =>
              n.tokenId === claimedLoreItem.nftId ||
              n.id === claimedLoreItem.nftId
          );
          setSelectedNft(nftFromLore || null);
        } else {
          setSelectedNft(nft || null);
        }

        // Show reveal modal for new claims
        setIsNewClaim(true);
        setShowRevealModal(true);
        
        track('lore_claim_success', {
          lore_id: loreId,
          lore_type: 'type' in claimedLoreItem ? claimedLoreItem.type : 'unknown',
          lore_title: claimedLoreItem.title,
          nft_id: nftId
        });
      }
    } catch (error) {
      console.error("Error claiming lore:", error);
      track('lore_claim_error', {
        lore_id: loreId,
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setClaiming(false);
      setClaimingId(null);
    }
  };

  // Handle clicking on a claimed lore card
  const handleLoreClick = (lore: Lore) => {
    track('lore_card_clicked', {
      lore_id: lore.id,
      lore_type: 'type' in lore ? lore.type : 'unknown',
      lore_title: lore.title
    });

    setSelectedLore(lore);

    // Find the NFT for this lore
    const nft =
      userNfts.find((n) => n.tokenId === lore.nftId || n.id === lore.nftId) ||
      lore.nftData;

    setSelectedNft(nft || null);
    setIsNewClaim(false);
    setShowLoreModal(true);
  };

  return (
    <div className="min-h-screen bg-black text-gray-200 relative overflow-hidden pt-24">
      {/* Background Image with vignette */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{
          backgroundImage: `url('/background-${backgroundNumber}.png')`,
        }}
      />

      {/* Vignette Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.6) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-orbitron text-4xl font-bold mb-4">
            LORE ARCHIVES
          </h1>
          <p className="font-space-mono text-base font-medium text-gray-300 max-w-3xl">
            Recovered memory fragments from your Proxim8 agents. Each piece
            reveals hidden truths about the war between timelines and the path
            to the Green Loom future.
          </p>
        </div>

        {/* Unclaimed Lore Section */}
        {hasUnclaimedLore && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-orbitron text-2xl font-bold text-gray-200">
                Available Lore
              </h2>
              <span className="font-space-mono text-sm text-gray-400">
                {unclaimedCount}{" "}
                {unclaimedCount === 1 ? "fragment" : "fragments"} to claim
              </span>
            </div>

            {/* List of unclaimed lore items - responsive grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {unclaimedLoreItems.map((loreItem) => {
                const nft = userNfts.find(
                  (n) => n.tokenId === loreItem.nftId || n.id === loreItem.nftId
                );

                return (
                  <UnclaimedLoreCard
                    key={loreItem.id}
                    lore={loreItem}
                    nft={nft}
                    onClaim={handleClaimLore}
                    claiming={claiming}
                    claimingId={claimingId}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loreLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-magenta mb-4 mx-auto"></div>
              <p className="font-space-mono text-sm text-gray-400">
                ACCESSING QUANTUM ARCHIVES...
              </p>
            </div>
          </div>
        )}

        {/* No Wallet Connected */}
        {(!connected || !isAuthenticated) && !loreLoading && (
          <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-12 text-center">
            <h3 className="font-orbitron text-2xl font-bold text-primary-500 mb-4">
              AUTHENTICATION REQUIRED
            </h3>
            <p className="font-space-mono text-base text-gray-300 mb-6">
              Connect your wallet to access the lore archives.
            </p>
            <button
              onClick={() => {
                track('return_to_portal_clicked', { from_page: 'lore' });
                router.push("/");
              }}
              className="font-space-mono px-8 py-3 bg-primary-500/20 border border-primary-500/50 rounded hover:bg-primary-500/30 hover:border-primary-500 transition-all text-primary-500"
            >
              RETURN TO PORTAL
            </button>
          </div>
        )}

        {/* Claimed Lore Section */}
        {!loreLoading && connected && isAuthenticated && claimedLoreItems.length > 0 && (
          <>
            <h2 className="font-orbitron text-2xl font-bold text-gray-200 mb-6">
              Recovered Memories
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {claimedLoreItems.map((loreItem) => {
                const nft =
                  userNfts.find(
                    (n) =>
                      n.tokenId === loreItem.nftId || n.id === loreItem.nftId
                  ) || loreItem.nftData;

                return (
                  <LoreCard
                    key={loreItem.id}
                    lore={loreItem}
                    nft={nft}
                    onClick={() => handleLoreClick(loreItem)}
                  />
                );
              })}
            </div>
          </>
        )}

        {/* Empty State */}
        {!loreLoading && connected && isAuthenticated && allLoreItems.length === 0 && (
          <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-12 text-center">
            <h3 className="font-orbitron text-2xl font-bold text-gray-500 mb-4">
              NO LORE AVAILABLE YET
            </h3>
            <p className="font-space-mono text-base text-gray-400 mb-6">
              Lore fragments will appear here as your Proxim8 agents recover
              memories.
            </p>
            <button
              onClick={() => {
                track('view_agents_clicked', { from_page: 'lore_empty_state' });
                router.push("/my-proxim8s");
              }}
              className="font-space-mono px-8 py-3 bg-gray-800/50 border border-gray-700 rounded hover:bg-gray-700/50 hover:border-gray-600 transition-all text-gray-300"
            >
              VIEW YOUR AGENTS
            </button>
          </div>
        )}
      </div>

      {/* Lore Modal for viewing existing lore */}
      {selectedLore && !isNewClaim && (
        <LoreModal
          lore={selectedLore}
          nft={selectedNft || undefined}
          isOpen={showLoreModal}
          onClose={() => {
            track('lore_modal_closed', {
              lore_id: selectedLore.id,
              modal_type: 'view'
            });
            setShowLoreModal(false);
            setSelectedLore(null);
            setSelectedNft(null);
          }}
        />
      )}

      {/* Reveal Modal for newly claimed lore */}
      {selectedLore && isNewClaim && (
        <LoreRevealModal
          lore={selectedLore}
          nft={selectedNft || undefined}
          isOpen={showRevealModal}
          onClose={() => {
            track('lore_modal_closed', {
              lore_id: selectedLore.id,
              modal_type: 'reveal'
            });
            setShowRevealModal(false);
            setSelectedLore(null);
            setSelectedNft(null);
            setIsNewClaim(false);
          }}
        />
      )}
    </div>
  );
}
