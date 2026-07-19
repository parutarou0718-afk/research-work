# Modifications

This repository is a modified fork of:

[nashsu/llm_wiki](https://github.com/nashsu/llm_wiki)

Original license:

GPL-3.0

## Modification Summary

The following research workflow features were added in this fork.

### Submission Management

- Added a standalone Submission Management view.
- Added `Submission` and `SubmissionEvent` TypeScript models.
- Added `.llm-wiki/submissions.json` persistence.
- Added Zustand submission state management.
- Added create, edit, delete, filter, sort, and status statistics UI.
- Added status history events for submission changes.
- Added Chinese and English interface strings for the submission workflow.

### Idea Capture

- Added New Idea workflow.
- Added Quick Capture workflow.
- Saved ideas as Markdown pages under `wiki/ideas/`.
- Added idea frontmatter with `type: idea`.
- Added related knowledge links using normal Wiki link syntax.

### Knowledge Linking

- Added manual related knowledge selection when creating ideas.
- Added graph context-menu actions for creating ideas from graph nodes.
- Added graph context-menu actions for connecting and unlinking ideas.
- Added bidirectional link management:
  - from paper / source / term nodes to ideas
  - from idea nodes to paper / source / term nodes
- Improved graph link resolution for project-relative Wiki links.
- Added linked-idea visibility in graph node detail panels.

### Build and Packaging

- Added GitHub Actions branch artifact builds for testing.
- Preserved tag-based release behavior for real releases.
- Added Windows portable package generation workflow.

## Files and Storage Added by This Fork

Project data:

```text
.llm-wiki/submissions.json
wiki/ideas/*.md
```

Source-level additions include:

```text
src/types/submission.ts
src/lib/submission-persist.ts
src/stores/submission-store.ts
src/components/submissions/
src/components/ideas/
```

## Non-Goals

This fork does not claim to replace the original LLM Wiki project.

It does not add:

- a new database
- a new graph backend
- cloud sync
- email monitoring
- automatic journal submission
- automatic revision writing
- paid account infrastructure

## License

This modified fork remains under GPL-3.0.

When distributing binaries or modified copies, provide the corresponding source
code and preserve the original license and attribution notices.

