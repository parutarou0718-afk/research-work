# Local Plugin Data and Export Design

## Goal

Keep LLM Wiki plugin state on the desktop while allowing plugins to read
authorized PandaWiki data and export their results.

## Boundaries

- Plugin records, analysis results, and export preferences remain local.
- PandaWiki remains a read-only, permission-enforcing knowledge source for
  remote projects.
- No complete remote document body is synchronized into plugin storage.
- Exported references contain only the title, stable node locator, link when
  available, and the plugin's own selected excerpt.

## Architecture

Every plugin produces a `PluginExportModel` containing a title, metadata,
sections, optional structured data, and references. Shared exporters render
this model to Markdown, JSON, DOCX, and PDF. The settings store owns a
user-selectable default export directory and default selected formats; the
export dialog may override both for a single action.

## Local and Remote Projects

The submission plugin persists through the local plugin storage API for both
project sources. Remote project storage stays namespaced by connection and
knowledge-base scope key, so it cannot collide with local project data or a
second PandaWiki server. Remote reading always goes through existing provider
APIs, which enforce PandaWiki authorization before data reaches the desktop.

## Testing

Tests cover export-model validation, each deterministic exporter, default
directory/format preference mapping, remote-project local storage isolation,
and failure paths when a destination cannot be written.
