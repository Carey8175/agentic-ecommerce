import { defineMiddlewares, authenticate } from "@medusajs/framework/http";

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/customers/me/password",
      middlewares: [authenticate("customer", ["bearer", "session"])],
    },
  ],
  errorHandler: (err, req, res, next) => {
    // Only intercept store/custom checkout routes — let admin and internal routes
    // use Medusa's default error handling so the admin UI works correctly.
    if (!req.url?.startsWith("/store") && !req.url?.startsWith("/custom")) {
      return next(err)
    }

    console.error("====== CHECKOUT ERROR START ======");
    console.error(`Route: ${req.url}`);
    console.error(`Method: ${req.method}`);
    console.error(err);
    console.error("====== CHECKOUT ERROR END ======");
    res.status(err.status || 500).json({
      message: err.message,
      type: err.type,
      code: err.code,
      stack: err.stack
    });
  }
});
