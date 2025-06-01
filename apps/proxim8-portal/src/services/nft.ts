"use client";

import { NFTMetadata } from "@/types/nft";
import * as apiClient from "@/utils/apiClient";
import {
  getNFTsByWalletImpl,
  getNFTByIdImpl,
  checkNFTOwnershipImpl,
  getEligibleNFTsImpl,
  getPublicNFTsImpl,
  getNFTImpl,
  ApiClient,
} from "./nftService";

// Create client implementation that satisfies the ApiClient interface
const clientApiAdapter: ApiClient = {
  get: apiClient.get,
  post: apiClient.post,
  put: apiClient.put,
  del: apiClient.del,
};

// Common options for all API calls
const API_OPTIONS: RequestInit = {
  credentials: "include" as RequestCredentials, // Include cookies for auth
  headers: {
    "Content-Type": "application/json",
  },
};

/**
 * Get all NFTs for a wallet address
 */
export const getNFTsByWallet = async (
  walletAddress: string
): Promise<NFTMetadata[]> => {
  return getNFTsByWalletImpl(clientApiAdapter, walletAddress);
};

/**
 * Get specific NFT details by ID
 */
export const getNFTById = async (
  walletAddress: string,
  nftId: string
): Promise<NFTMetadata | null> => {
  return getNFTByIdImpl(clientApiAdapter, walletAddress, nftId);
};

/**
 * Check if the user owns a specific NFT
 */
export const checkNFTOwnership = async (
  walletAddress: string,
  nftId: string
): Promise<{ owned: boolean }> => {
  return checkNFTOwnershipImpl(clientApiAdapter, walletAddress, nftId);
};

/**
 * Get eligible NFTs for video generation
 */
export const getEligibleNFTs = async (
  walletAddress: string
): Promise<NFTMetadata[]> => {
  return getEligibleNFTsImpl(clientApiAdapter, walletAddress);
};

/**
 * Get public NFTs that are available to all users
 */
export async function getPublicNFTs(): Promise<NFTMetadata[]> {
  return getPublicNFTsImpl(clientApiAdapter);
}

/**
 * Get a single NFT by ID
 */
export async function getNFT(id: string): Promise<NFTMetadata | null> {
  return getNFTImpl(clientApiAdapter, id);
}
