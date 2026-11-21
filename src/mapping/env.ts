/** Workeri keskkond, mida kaardistusmoodul vajab (sidumised + saladused). */
export type MappingEnv = {
  DB: D1Database;
  MAP_COMPANY: Workflow<{ jobId: string }>;
  ANTHROPIC_API_KEY?: string;
  LLM_MOCK?: string;
  ALLOW_PRIVATE_FETCH?: string;
  MAPPING_USER_AGENT?: string;
};
