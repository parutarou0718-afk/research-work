# Official Plugin Framework v0.1

## Goal

Add a minimal official built-in plugin framework to LLM Wiki so future optional modules can be enabled without coupling core startup, navigation, or page rendering to their business implementation.

## Scope

The framework is TypeScript/React only. It adds no PandaWiki API calls, chat changes, Rust/Tauri commands, SQLite tables, network access, file-system access, or dynamic third-party code loading.

## Architecture

`PluginRegistry` owns registered official plugin definitions and enabled identifiers. It persists enabled IDs under `llm-wiki.enabled-plugins.v0.1` in localStorage. `PluginProvider` supplies the registry to React; `usePlugins` exposes enabled plugins and safe lifecycle operations.

Plugins are capability declarations, not isolated applications. A plugin can register navigation entries, commands, and a React page component. The core application renders enabled plugin navigation entries after its existing navigation and resolves an enabled plugin route through a single plugin-content branch.

Lifecycle errors are caught and sent to `console.error`; they never prevent the core application from starting. Disabling hides an entry but never deletes plugin data.

## Plugin API

`PluginManifest` identifies an official plugin. `PluginNavigationItem` defines a label, route, optional icon, and order. `LlmWikiPlugin` optionally defines `activate`, `deactivate`, navigation entries, commands, and a page component. IDs are unique and duplicate registration throws a clear error.

## Built-in Example

`official.submission-management` is registered at startup, is disabled by default, and contributes a single “Submission Management” navigation item. Its page is a placeholder only. It does not reuse or import existing submission stores, components, persistence, or business logic.

## UI Integration

The existing `activeView` union gains a generic `plugin` view. A `pluginRoute` field identifies the selected plugin page. Existing navigation order, routes, icons, and pages stay unchanged. The settings page gains a compact “Feature modules” section using existing settings styling; it lists official plugins and toggles their enabled state.

## Verification

Unit tests cover registration, duplicate rejection, enabled-state persistence, lifecycle activation/deactivation, lifecycle-error isolation, and navigation visibility. TypeScript checks, mock tests, and the Vite build must pass.
