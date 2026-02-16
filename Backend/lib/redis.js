let redis = null;

try {
  const Redis = (await import("ioredis")).default;
  redis = new Redis(process.env.REDIS_URL);
  redis.on("error", () => {});
} catch {
  redis = null;
}

export { redis };
