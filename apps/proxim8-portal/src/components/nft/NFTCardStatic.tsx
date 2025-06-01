"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import NFTImage from "../common/NFTImage";
import AttributeTag from "../common/AttributeTag";
import { useNftStore } from "@/stores/nftStore";
import { NFTMetadata } from "@/types/nft";
import NFTCardInteractive from "./NFTCardInteractive";

export default function NFTCardStatic({
  tokenId,
  name,
  image,
  description,
  attributes = [],
  mint,
  id,
  collection,
  owner,
}: NFTMetadata) {
  // For server component, we determine if we need to pass it to client component

  // Find the personality attribute if it exists
  const personalityAttr = attributes.find(
    (attr) => attr.trait_type?.toLowerCase() === "personality"
  );

  // If we need interactivity, use the client component

  return (
    <NFTCardInteractive
      tokenId={tokenId}
      name={name}
      image={image}
      description={description}
      attributes={attributes}
      mint={mint}
      id={id}
      collection={collection}
      owner={owner}
    />
  );
}
