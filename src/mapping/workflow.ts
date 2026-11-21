import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import type { MappingEnv } from "./env";
import { discover, finishJob, mergeAndUpsert, processPage, synthesizeProduct } from "./pipeline";

type Params = { jobId: string };

const RETRY = { retries: { limit: 2, delay: "30 seconds" as const, backoff: "exponential" as const }, timeout: "15 minutes" as const };

export class MapCompanyWorkflow extends WorkflowEntrypoint<MappingEnv, Params> {
  async run(event: Readonly<WorkflowEvent<Params>>, step: WorkflowStep) {
    const { jobId } = event.payload;
    const env = this.env;
    try {
      const pageIds = await step.do("discover", RETRY, () => discover(env, jobId));
      for (const pageId of pageIds) {
        await step.do(`page:${pageId}`, RETRY, async () => {
          await processPage(env, jobId, pageId);
          return null;
        });
      }
      const productIds = await step.do("merge", RETRY, () => mergeAndUpsert(env, jobId));
      for (const productId of productIds) {
        await step.do(`synthesize:${productId}`, RETRY, async () => {
          await synthesizeProduct(env, jobId, productId);
          return null;
        });
      }
      await step.do("finish", async () => {
        await finishJob(env, jobId, "done");
        return null;
      });
      return { jobId, pages: pageIds.length, products: productIds.length };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await step.do("fail", async () => {
        await finishJob(env, jobId, "failed", message);
        return null;
      });
      throw e;
    }
  }
}
