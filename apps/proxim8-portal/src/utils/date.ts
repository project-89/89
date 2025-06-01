/**
 * Date utility functions for formatting
 */

/**
 * Format a date string to a more readable format
 * @param dateString ISO date string or timestamp
 * @returns Formatted date string
 */
export function formatDate(dateString: string | number | Date): string {
  const date = new Date(dateString);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return "Invalid date";
  }

  // If less than 24 hours ago, show relative time
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return minutes <= 1 ? "just now" : `${minutes} minutes ago`;
    }
    const hours = Math.floor(diffInHours);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  // If within the last week, show day of week
  if (diffInHours < 7 * 24) {
    return date.toLocaleDateString("en-US", { weekday: "long" });
  }

  // Otherwise, show formatted date
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}
