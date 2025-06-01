"use server";

/**
 * This file contains server-side functions for the pipeline service.
 * These functions are used for server components and can make direct API calls.
 */

import { revalidatePath } from "next/cache";

/**
 * Revalidate the pipeline page to refresh data
 */
export async function revalidatePipelinePage() {
  revalidatePath("/pipeline");
  console.log("[serverPipeline] Revalidated pipeline page");
}
