export const CONFIG = {
  POS_REFRESH_INTERVAL: parseInt(process.env.NEXT_PUBLIC_POS_REFRESH_INTERVAL || "600000", 10), // 10 min default
} as const;
