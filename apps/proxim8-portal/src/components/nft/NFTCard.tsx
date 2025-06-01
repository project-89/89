import React from "react";
import NFTCardStatic from "@/components/nft/NFTCardStatic";
// import Link from "next/link";
// import Image from "next/image";
import { NFTMetadata } from "@/types/nft";

const NFTCard = React.memo(
  ({
    name,
    image,
    description,
    attributes = [],
    tokenId,
    mint,
    id,
    collection,
    owner,
  }: NFTMetadata) => {
    return (
      <div className="relative h-full flex flex-col">
        <NFTCardStatic
          id={id}
          owner={owner}
          mint={mint}
          collection={collection}
          tokenId={tokenId}
          name={name}
          image={image}
          description={description || ""}
          attributes={attributes}
        />
      </div>
    );
  }
);

NFTCard.displayName = "NFTCard";

export default NFTCard;
