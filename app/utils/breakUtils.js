/**
 * Break utility functions for formatting break messages and durations
 */

/**
 * Convert milliseconds to human readable format
 * @param {number} milliseconds - Duration in milliseconds
 * @returns {string} - Human readable duration
 */
function formatDuration(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days !== 1 ? "s" : ""} ${hours % 24} hour${
      hours % 24 !== 1 ? "s" : ""
    }`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? "s" : ""} ${minutes % 60} minute${
      minutes % 60 !== 1 ? "s" : ""
    }`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""} ${
      seconds % 60
    } second${seconds % 60 !== 1 ? "s" : ""}`;
  } else {
    return `${seconds} second${seconds !== 1 ? "s" : ""}`;
  }
}

/**
 * Get just the formatted duration string
 * @param {string} breakLength - Break length in milliseconds
 * @returns {string} - Human readable duration
 */
export function getFormattedBreakDuration(breakLength) {
  return formatDuration(parseInt(breakLength));
}
