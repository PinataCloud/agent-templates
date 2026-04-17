import { defineMiddleware } from "astro:middleware";
import { auth } from "./lib/auth";

export const onRequest = defineMiddleware(async (ctx, next) => {
  const result = await auth.api.getSession({ headers: ctx.request.headers });
  ctx.locals.user = result?.user ?? null;
  ctx.locals.session = result?.session ?? null;
  return next();
});
