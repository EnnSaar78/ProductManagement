declare module "*/.open-next/worker.js" {
  const handler: ExportedHandler<CloudflareEnv> & { fetch: NonNullable<ExportedHandler<CloudflareEnv>["fetch"]> };
  export default handler;
}
