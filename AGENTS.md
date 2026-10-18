# AGENTS.md

Guidance for AI coding agents working on this repository.

## Project

Single-page **Sticky Notes** web app, built as a front-end hiring assignment. The reviewers weigh, in this order of attention: **architecture and design, performance, code quality, accuracy of static typing, usability.**

Time budget is 3-4 hours. Do not over-engineer, but do not cut corners on the five criteria above.

## Hard constraints (do not violate)

- **Language:** TypeScript, `strict` mode on. No `any`, no `@ts-ignore`, no non-null assertions (`!`) unless there is a comment explaining why it is safe. Prefer `unknown` plus narrowing.
- **UI:** React with function components and hooks only.
- **No stock components or ready-made solutions.** Do NOT add UI kits (MUI, Chakra, Ant, etc.), drag-and-drop libraries (react-dnd, dnd-kit, react-draggable, react-rnd, etc.), or state libraries. Drag, resize, and drop-to-trash must be implemented by hand with Pointer Events. Build tooling and test tooling are fine.
- **Target:** desktop only, minimum 1024x768. Latest Chrome (Windows/Mac), Firefox (all platforms), Edge. Do not use APIs that are not supported in all three.
- **Comments:** English only, and only where they materially help reading the code. No comments that restate the code.
- **No backend required.** Any REST API must be mocked, and the mock must be asynchronous (returns Promises with simulated latency).

## Required features

Implement at least 3 of 4; the goal here is all 4:

1. Create a note of a specified size at a specified position.
2. Resize a note by dragging.
3. Move a note by dragging.
4. Delete a note by dragging it over a "trash" zone.

## Optional features (bonus)

- I. Edit note text
- II. Bring note to front on interaction (overlapping notes)
- III. Persist notes to localStorage and restore on load
- IV. Note colors
- V. Save notes via a (mocked, async) REST API

Build the required features first, then add bonuses in the order II, I, III, IV, V. Each bonus must fit the existing architecture without rewrites.

## Suggested stack

- Vite + React + TypeScript (`strict`)
- Plain CSS Modules or a single CSS file with custom properties. No CSS framework.
- Vitest + React Testing Library for unit tests (optional, but reducer and geometry logic should be tested)
- ESLint (`@typescript-eslint`) and Prettier

## Architecture guidelines

Keep a clear separation between state, interaction logic, and presentation.

- **State:** a single reducer (`useReducer`) with a discriminated-union action type (`CREATE_NOTE`, `MOVE_NOTE`, `RESIZE_NOTE`, `DELETE_NOTE`, `BRING_TO_FRONT`, ...). Reducer is pure and has no DOM knowledge. Expose it through context, split state and dispatch contexts to avoid needless re-renders.
- **Model:** `Note` is an immutable plain object: `id`, `x`, `y`, `width`, `height`, `zIndex`, plus optional `text` and `color`. Use branded or string-literal types where it prevents misuse (e.g. `NoteId`, a `NoteColor` union).
- **Interaction:** drag, resize, and create-by-drag each live in their own custom hook built on Pointer Events (`setPointerCapture`, `pointermove`, `pointerup`, `pointercancel`). Hooks take callbacks and return handlers; they do not read or mutate global state directly.
- **Geometry:** pure functions in a separate module (clamping to the board, min/max note size, rectangle intersection for trash hit testing). These are the primary unit-test targets.
- **Persistence and API:** put behind a small interface (e.g. `NotesRepository` with async `load()` and `save()`), with localStorage and mock-REST implementations. UI code depends on the interface, never on a concrete implementation. Debounce saves.
- **Components:** small and presentational where possible: `Board`, `Note`, `ResizeHandle`, `TrashZone`, `Toolbar`. `Note` is wrapped in `React.memo` with stable props.

Suggested layout:

```
src/
  components/    Board, Note, ResizeHandle, TrashZone, Toolbar
  hooks/         useDrag, useResize, useCreateNote
  state/         notesReducer, actions, NotesContext
  domain/        types, geometry (pure)
  services/      NotesRepository, localStorageRepository, mockApiRepository
  styles/
  main.tsx
```

## Performance rules

- During a drag or resize, update position with `transform: translate3d(...)` or direct style updates via `requestAnimationFrame`. Do not dispatch to the reducer on every `pointermove` if it re-renders the whole board. Commit to the store on `pointerup`, or throttle to one update per frame.
- Only the note being manipulated should re-render while dragging. Verify with React DevTools Profiler.
- Set `touch-action: none` on draggable elements, and `user-select: none` while dragging.
- No layout thrashing: do not read layout (`getBoundingClientRect`) inside move handlers more than once per frame, and cache the board rect at drag start.
- Use stable keys (note ids), never array indexes.

## Usability rules

- Visible affordances: grab cursor on notes, resize cursor on handles, trash zone highlights when a dragged note is over it.
- Dragging a note over the trash must give clear feedback before release (and the note should visibly change state).
- Notes cannot be dragged fully off-screen and cannot be resized below a usable minimum size.
- Interacted note comes to the front.
- Keyboard: Escape cancels an in-progress drag/resize and restores the previous position. Text editing must not trigger a drag.
- Handle `pointercancel` and lost pointer capture so a drag never gets stuck.

## Code quality rules

- Small, single-purpose modules and functions. No file over ~200 lines without a good reason.
- Exhaustive `switch` over discriminated unions, with a `never` check in the default branch.
- No magic numbers: name constants (`MIN_NOTE_SIZE`, `TRASH_ZONE_HEIGHT`, ...) in one place.
- No dead code, no commented-out code, no stray `console.log`.
- Consistent naming: `PascalCase` components and types, `camelCase` functions, `UPPER_SNAKE_CASE` constants.

## Commands

Update this section if scripts change.

```bash
npm install
npm run dev        # start dev server
npm run build      # type-check and production build
npm run preview    # serve production build
npm run lint
npm run typecheck  # tsc --noEmit
npm test
```

Before finishing any task, run `npm run typecheck`, `npm run lint`, and `npm test`. Do not report work as done if any of them fail.

## Deliverables

- Source code, with build/run instructions in `README.md`.
- A short architecture description (**2-3 paragraphs, English**) in `README.md` under an "Architecture" heading. It should cover: state management and data flow, how interactions (drag/resize/trash) are implemented and kept performant, and how persistence/API is abstracted. Keep it consistent with the actual code.

## Agent workflow

- Work in small steps and keep the app runnable after each one.
- Before adding a dependency, ask whether it is necessary. Runtime dependencies should be only `react` and `react-dom`.
- Do not refactor unrelated code or rename files without being asked.
- If a requirement is ambiguous, pick the simplest interpretation, note the assumption in the README, and move on.
- Never commit secrets or API keys.
- Never bypass git hooks (`--no-verify`, `-n`) and never edit `.husky/`. If a hook fails, fix the cause.
- A task is not done until `npm run verify` passes with no errors. Do not report work as complete, and do not stop, while it fails. If it fails, read the output, fix the cause in the code, and run it again. Never fix a failure by weakening a check, deleting a test, adding a lint-disable comment, or loosening a type.

- At the start of every session, read `PLAN.md`. Work on the current focus unless told otherwise.
- Tick a milestone only after `npm run verify` passes for that work. Never tick something that is partly done.
- Keep `PLAN.md` short. Update "Current focus", record non-obvious decisions as one line each, and list blockers. Do not log a history of what you did.
- Only the main agent edits `PLAN.md` and `README.md`. Subagents do not touch them.
- Keep `README.md` in step with the code. Before ticking a milestone, update the README in the same change:
  - add each non-obvious technical decision the milestone produced to "Technical decisions", one line each;
  - update the feature status table;
  - remove the *(planned)* marker from anything that is now implemented, and keep the Architecture section (2-3 paragraphs) consistent with the actual code.
- Do not describe anything in the README that is not implemented, other than clearly marked *(planned)* items. A milestone is not done if the README contradicts the code.
