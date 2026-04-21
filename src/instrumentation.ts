export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  console.log("[instrumentation] scheduling non-blocking database warm-up");
  import("@/lib/db")
    .then(async ({ ensureDatabaseReady }) => {
      const start = Date.now();
      try {
        await ensureDatabaseReady();
        console.log(`[instrumentation] database ready (${Date.now() - start}ms)`);
      } catch (error) {
        console.error(
          `[instrumentation] database warm-up FAILED after ${Date.now() - start}ms:`,
          error,
        );
      }
    })
    .catch((error) => {
      console.error("[instrumentation] failed to import @/lib/db:", error);
    });
}
