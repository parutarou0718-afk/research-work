import type { ProviderBundle } from "../contracts/ProviderBundle"
import { localCapabilities } from "./capabilities"

export type LocalProviderSkeleton = Pick<
  ProviderBundle,
  "id" | "type" | "lifecycle" | "capabilities"
>

/** Phase 1A only prepares lifecycle ownership; Local adapters stay unchanged. */
export function createLocalProviderSkeleton(): LocalProviderSkeleton {
  return {
    id: "local",
    type: "local",
    capabilities: localCapabilities,
    lifecycle: {
      initialize: async () => {},
      dispose: async () => {},
    },
  }
}
