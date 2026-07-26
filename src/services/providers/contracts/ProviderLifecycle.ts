export interface ProviderLifecycle {
  initialize(): Promise<void>
  dispose(): Promise<void>
}
