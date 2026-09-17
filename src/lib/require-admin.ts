import "server-only";
import { headers } from "next/headers";
import { isAdminAuthorization } from "./admin-auth";

/**
 * Server actions can be invoked by POSTing their id to any URL, so the /admin
 * middleware check is not enough on its own: every admin action calls this first.
 */
export async function requireAdmin() {
  const h = await headers();
  if (!isAdminAuthorization(h.get("authorization"))) throw new Error("Unauthorized");
}
