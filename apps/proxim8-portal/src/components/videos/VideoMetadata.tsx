import Image from "next/image";

interface VideoMetadataProps {
  title: string;
  description?: string;
  creator: {
    walletAddress: string;
    username?: string;
    profileImage?: string;
  };
}

export default function VideoMetadata({
  title,
  description,
  creator,
}: VideoMetadataProps) {
  const truncatedAddress = `${creator.walletAddress.slice(0, 4)}...${creator.walletAddress.slice(-4)}`;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{title}</h1>

      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-700">
          {creator.profileImage ? (
            <Image
              src={creator.profileImage}
              alt={creator.username || truncatedAddress}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg font-medium">
              {(creator.username || truncatedAddress).charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <p className="font-medium">{creator.username || truncatedAddress}</p>
        </div>
      </div>

      {description && (
        <div className="mt-4">
          <p className="text-gray-300 whitespace-pre-wrap">{description}</p>
        </div>
      )}
    </div>
  );
}
