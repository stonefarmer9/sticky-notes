# PLAN

Status file for agents. Read this at the start of every session.

## Current focus

Domain complete. Next: state reducer with discriminated-union actions + tests.

## Milestones

- [x] Scaffold (Vite, React, TS strict), oxlint, Vitest, hooks, `verify` script
- [x] Domain: `Note` types, constants, pure geometry functions + tests
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

- NoteId is a branded string generated with crypto.randomUUID().
- Note has flat x, y, width, height fields.
- NoteColor is a string-literal union.
- DEFAULT_NOTE_SIZE is 200×200.
- Double-clicking the board creates a note centered on the pointer, clamped to the board and focused for text editing.
- Before the Board and Note rendering step, add @testing-library/react, @testing-library/jest-dom and jsdom, plus a jsdom test config in vite.config.ts.
- Board-dependent actions (CREATE_NOTE, MOVE_NOTE, RESIZE_NOTE) carry a `board: Size` payload and the reducer clamps with geometry, so the reducer stays pure and enforces layout invariants in one place.

<!-- One line each: what was decided and why. -->

## Open questions / blockers

<!-- Anything needing the user's input. -->
