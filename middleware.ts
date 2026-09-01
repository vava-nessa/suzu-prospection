import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";
import { isAuthenticatedNextjs } from "@convex-dev/auth/nextjs/server";
import { nextjsMiddlewareRedirect } from "@convex-dev/auth/nextjs/server";
import { createRouteMatcher } from "@convex-dev/auth/nextjs/server";

const isPublicRoute = createRouteMatcher(["/api/auth(.*)"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  if (isPublicRoute(request)) return;
  // Toutes les autres routes nécessitent d'être authentifié pour voir le CRM
  // On laisse passer la page, mais le composant AuthedApp affichera SignInForm si non auth
  // Pas de redirect forcé ici pour garder UX simple (form inline)
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
