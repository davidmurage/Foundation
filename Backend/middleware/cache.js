import { redis } from "../lib/redis.js";

export function cacheGet(ttlSeconds = 60) {
  return async (req, res, next) => {
    if (req.method !== "GET") return next();

    const key = `cache:${req.originalUrl}`;
    const cached = await redis.get(key);

    if (cached) {
      res.setHeader("X-Cache", "HIT");
      return res.json(JSON.parse(cached));
    }

    // Monkey-patch res.json to store response
    const originalJson = res.json.bind(res);
    res.json = async (data) => {
      try {
        await redis.set(key, JSON.stringify(data), "EX", ttlSeconds);
        res.setHeader("X-Cache", "MISS");
      } catch {}
      return originalJson(data);
    };

    next();
  };
}
