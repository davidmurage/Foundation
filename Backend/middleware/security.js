import helmet from "helmet";
import cors from "cors";
//import compression from "compression";
//import mongoSanitize from "express-mongo-sanitize";
//import xss from "xss-clean";
import hpp from "hpp";

/**
 * Add security + performance middleware
 */
export function applySecurity(app) {
  app.set("trust proxy", 1); // IMPORTANT behind proxy/load balancer

  app.use(helmet());
  app.use(
    cors({
      origin: true, // or set to your frontend domain(s)
      credentials: true,
    })
  );

  //app.use(compression());

  // Prevent common NoSQL injection + XSS
  //app.use(mongoSanitize());
  //app.use(xss());

  // Prevent HTTP parameter pollution
  app.use(hpp());

  // Body size limits to prevent abuse
  app.use((req, res, next) => {
    // Stop extremely slow clients from tying up resources
    req.setTimeout(30_000);
    res.setTimeout(30_000);
    next();
  });
}
