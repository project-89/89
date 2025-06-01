import React from "react";

interface AttributeTagProps {
  trait: string;
  value: string;
}

export default function AttributeTag({ trait, value }: AttributeTagProps) {
  return (
    <div className="bg-gray-700 text-xs px-2 py-1 rounded">
      <span className="text-gray-400">{trait}:</span>{" "}
      <span className="text-indigo-300">{value}</span>
    </div>
  );
}
