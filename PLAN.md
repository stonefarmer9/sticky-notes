# PLAN

Status file for agents. Read this at the start of every session.

## Current focus

Scaffold and harness complete. Next: domain types and geometry.

## Milestones

- [x] Scaffold (Vite, React, TS strict), oxlint, Vitest, hooks, `verify` script
- [ ] Domain: `Note` types, constants, pure geometry functions + tests
- [ ] State: reducer with discriminated-union actions + tests
- [ ] Board and Note rendering
- [ ] Create note (specified size and position)
- [ ] Move by dragging (`useDrag`)
- [ ] Resize by dragging (`useResize`)
- [ ] Delete by dragging over trash zone
- [ ] Bring to front
- [ ] Edit text
- [ ] localStorage persistence via `NotesRepository`
- [ ] Note colors
- [ ] Mock async REST repository
- [ ] Performance test: moving one note does not re-render the others
- [ ] README: build instructions + architecture (2-3 paragraphs)

## Decisions

<!-- One line each: what was decided and why. -->

## Open questions / blockers

<!-- Anything needing the user's input. -->
