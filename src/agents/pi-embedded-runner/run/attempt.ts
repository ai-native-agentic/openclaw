export {
  isOllamaCompatProvider,
  resolveOllamaCompatNumCtxEnabled,
  shouldInjectOllamaCompatNumCtx,
  wrapOllamaCompatNumCtx,
} from "./attempt.ollama.js";
export {
  buildSessionsYieldContextMessage,
  createYieldAbortedResponse,
  queueSessionsYieldInterruptMessage,
  stripSessionsYieldArtifacts,
} from "./attempt.sessions.js";
export { wrapStreamFnTrimToolCallNames } from "./attempt.tool-call-trim.js";
export {
  shouldRepairMalformedAnthropicToolCallArguments,
  wrapStreamFnRepairMalformedToolCallArguments,
} from "./attempt.tool-call-repair.js";
export {
  buildAfterTurnRuntimeContext,
  composeSystemPromptWithHookContext,
  prependSystemPromptAddition,
  resolveAttemptFsWorkspaceOnly,
  resolvePromptBuildHookResult,
  resolvePromptModeForSession,
} from "./attempt.prompt-context.js";
export { decodeHtmlEntitiesInObject } from "./attempt.xai.js";
import type { EmbeddedRunAttemptParams, EmbeddedRunAttemptResult } from "./types.js";

export async function runEmbeddedAttempt(
  params: EmbeddedRunAttemptParams,
): Promise<EmbeddedRunAttemptResult> {
  const mod = await import("./attempt.run.js");
  return mod.runEmbeddedAttempt(params);
}
