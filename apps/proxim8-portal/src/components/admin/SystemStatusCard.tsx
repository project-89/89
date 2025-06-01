"use server";

interface SystemStatusCardProps {
  title: string;
  status: "operational" | "degraded" | "down";
  description: string;
}

export default async function SystemStatusCard({
  title,
  status,
  description,
}: SystemStatusCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case "operational":
        return "bg-green-900/20 text-green-400";
      case "degraded":
        return "bg-yellow-900/20 text-yellow-400";
      case "down":
        return "bg-red-900/20 text-red-400";
      default:
        return "bg-gray-900/20 text-gray-400";
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
      <div>
        <h4 className="font-medium text-sm">{title}</h4>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor()}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    </div>
  );
}
