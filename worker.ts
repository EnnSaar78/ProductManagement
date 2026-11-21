/**
 * Cloudflare Workeri sisendpunkt: Next.js (OpenNext) + cron + Workflow.
 * `.open-next/worker.js` genereeritakse käsuga `npx opennextjs-cloudflare build`.
 */
import { default as nextHandler } from "./.open-next/worker.js";
import { dbFor } from "./src/mapping/pipeline";
import { runDueSchedules } from "./src/mapping/jobs";
import type { MappingEnv } from "./src/mapping/env";

export { MapCompanyWorkflow } from "./src/mapping/workflow";

export default {
  fetch: nextHandler.fetch,
  async scheduled(_controller: ScheduledController, env: CloudflareEnv, ctx: ExecutionContext) {
    const mappingEnv = env as unknown as MappingEnv;
    ctx.waitUntil(
      runDueSchedules(dbFor(mappingEnv), mappingEnv).then((ids) => {
        console.log(`Ajastatud kaardistusi käivitatud: ${ids.length}`);
      }),
    );
  },
} satisfies ExportedHandler<CloudflareEnv>;
