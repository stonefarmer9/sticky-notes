# Sticky Notes

A single-page sticky notes board built with React and TypeScript. Create, move, resize and delete notes entirely with hand-written Pointer Event logic. There are no UI kits, drag-and-drop libraries or state libraries.

> **Status:** work in progress. The domain model, geometry, reducer, state contexts and static board and note rendering are implemented and tested. Creating notes by double-click, moving them by dragging, resizing them by their corner handle, deleting them by dragging onto the trash zone and editing their text all work. Sections marked *(planned)* describe the intended design.

## Getting started

```bash
npm install
npm run dev        # start the dev server
npm run build      # type-check and production build
npm run preview    # serve the production build
npm run lint       # oxlint (type-aware, warnings are errors)
npm run typecheck  # tsc -b
npm run format     # prettier --write
npm run format:check
npm test           # vitest run
npm run verify     # typecheck, lint, format:check, test and build
```

Target: desktop, minimum 1024×768, latest Chrome, Firefox and Edge. Note IDs use `crypto.randomUUID()`, which needs HTTPS or `localhost`.

## Features

| Feature | Status |
|---|---|
| Render notes on a board (position, size, stacking, and a color field; there is no UI to change colors yet) | done |
| Create a note at a given size and position | done (double-click, default 200×200 size) |
| Move a note by dragging | done (Pointer Events, Escape/pointercancel safe) |
| Resize a note by dragging | done (bottom-right corner handle) |
| Delete a note by dragging it over a trash zone | done (highlight while hovering, delete on release) |
| Bring to front on press | done |
| Edit note text (double-click, or Enter on a focused note) | done |
| localStorage, colors, mocked REST save | planned |

## Architecture

**State and data flow.** All note state lives in a single `useReducer` with a discriminated-union action type (`CREATE_NOTE`, `MOVE_NOTE`, `RESIZE_NOTE`, `DELETE_NOTE`, `BRING_TO_FRONT`, `UPDATE_TEXT`). The reducer is pure and has no DOM knowledge: callers generate note IDs, and actions that depend on layout carry the board size so the reducer can clamp positions and sizes through the pure functions in `domain/geometry`. It returns the same state object when the target note does not exist or the value is unchanged for deletes, bring-to-front and text updates, so React can skip re-renders; moves and resizes always produce a new state, and the gesture hooks never commit an unchanged rect. State and dispatch are exposed through two separate contexts, so components that only dispatch don't re-render when the notes change.

**Interactions and performance.** Drag, resize and double-click creation each live in their own custom hook. Creation (`useCreateNote`) is implemented: it takes an `onCreate` callback, reads the board's bounds once per double-click and doesn't touch global state; `Board` supplies the callback, which generates the id and dispatches `CREATE_NOTE`. Dragging (`useDrag`) and resizing (`useResize`) are implemented as thin wrappers over one shared core, `usePointerGesture`, built on Pointer Events: `setPointerCapture`, `pointermove`, `pointerup`, `pointercancel` and `lostpointercapture`. Each wrapper only says how a pointer delta turns into a new rect. The gesture lives in a ref. On pointer down the board's bounds are read once, and each `pointermove` only records the clamped position. Once per animation frame the note's `transform: translate3d(...)` is written directly to the element, so React does not render during a drag. The result is committed to the reducer once on `pointerup`, and the note is also brought to front on `pointerdown` (for both drag and resize). Memoized notes keep the other notes from re-rendering; this is *(planned)* to be proven by a render-count test. Trash hit-testing uses `rectsIntersect` through `isOverTrash`. While a note is dragged, each frame toggles a `data-trash-active` attribute on the board, and CSS styles both the trash zone and the dragged note from it, so hovering the trash costs no React renders. Escape, `pointercancel` and lost pointer capture restore the previous position and never leave a drag stuck.

**Persistence and API** *(planned)*. Persistence will sit behind a small `NotesRepository` interface with async `load()` and `save()`. There will be a localStorage implementation and a mocked REST implementation that returns Promises with simulated latency. The UI depends only on the interface, and saves are debounced.

## Technical decisions

**Model**
- `Note` is an immutable plain object with flat `x`, `y`, `width`, `height`, `zIndex` and optional `text` and `color`. It extends `Rect`, so every `Note` is a `Rect` but not the other way around.
- `NoteId` is a branded string (`string & { __brand: 'NoteId' }`) generated with `crypto.randomUUID()`.
- `NoteColor` is a string-literal union.
- Default note size is 200×200, the minimum is 120×100, the maximum is 600×600, and the trash zone is 160×96. All of these are named constants in one module.

**Geometry**
- Pure functions: `clamp`, `clampSize`, `maxSizeWithin`, `clampToBoard`, `resizeWithinBoard`, `rectsIntersect`, `originCenteredOn`, `trashRect`, `isOverTrash`.
- `clampToBoard` is generic (`<T extends Rect>`), so a `Note` stays a `Note`.
- When a limit is smaller than the minimum, the minimum wins. A rect larger than the board pins to the origin.
- Notes stay fully inside the board.
- Rects that only share an edge don't intersect, so touching the trash isn't a hit.

**State**
- `CREATE_NOTE`, `MOVE_NOTE` and `RESIZE_NOTE` carry a `board: Size` payload and the reducer clamps with geometry. This keeps the reducer pure and enforces layout rules in one place.
- `CREATE_NOTE` carries the id generated by the caller, so the reducer is deterministic. The reducer assigns `zIndex` as the current top plus one.
- Unknown ids, a note already on top, deleting an unknown id and an unchanged text update return the same state reference. Moves and resizes of an existing note always return a new state.
- The default case of the `switch` calls `assertNever`, so adding an action without handling it fails at compile time.
- Resize can't grow past the board edge or the maximum size, and can't shrink below the minimum.

**Rendering**
- Notes are absolutely positioned at the board origin and placed with `transform: translate3d(x, y, 0)`, so the drag step can update the same property per frame without layout work.
- Stacking uses CSS `z-index`, so DOM order stays creation order and bringing a note to front never reorders or remounts elements.
- `Note` is wrapped in `React.memo` and receives the immutable note object. The reducer keeps untouched notes referentially equal, so only a changed note re-renders.
- Colors come from `NOTE_COLOR_VALUES`, a `Record<NoteColor, string>` in `styles/noteColors.ts`, applied as an inline background. Adding a color to `NOTE_COLOURS` (in `domain/constants.ts`) without a value is a compile error. The default is yellow.
- The board shows a large light-gray hint, "Double click to create a new note", in the top-left. It is decorative (`aria-hidden`), sits behind notes, and has `pointer-events: none` so a double-click on it still reaches the board. jsdom has no layout, so that last part is checked in a browser, not in tests.
- The app font is Jura, self-hosted through `@fontsource/jura` (weights 400 and 600, imported in `main.tsx`) with `system-ui` as the fallback. It is a dev dependency because Vite bundles the font files at build time; the only runtime dependencies stay `react` and `react-dom`.
- Each note is an `<article>` with an accessible name, a grab cursor, `touch-action: none`, and while dragging a `data-dragging` attribute (grabbing cursor, no text selection, stronger shadow) set directly on the element.
- The board fills the window and applies `MIN_BOARD_SIZE` (1024×768) inline from the constant, so the number lives in one place.
- `NotesProvider` accepts an optional initial state, which tests use to seed notes and persistence will use to restore them.

**Interaction**
- Double-clicking the empty board creates a note centered on the pointer. The hook reports the unclamped rect and the board size, and the reducer clamps it, so a click near an edge still yields a note fully on the board.
- Double-clicks that start on a note are ignored (`event.target` must be the board itself).
- The board's bounds are read once per double-click, never in a move handler.
- A note created by double-click opens straight in edit mode with its text field focused.
- Editing: double-clicking a note, or pressing Enter on a focused note (notes have `tabIndex=0`), swaps its text for a textarea (`NoteEditor`). Blur saves; Escape discards and returns focus to the note; Enter inserts a new line. Only one note is edited at a time, and `Board` owns which one (`editingId`), so only that note re-renders when editing starts or stops.
- Pressing inside the textarea stops propagation of `pointerdown`, so selecting text can never start a drag. Double-clicking the resize handle does not start editing either.
- The editor settles exactly once: Escape followed by the blur some browsers fire when a focused field is removed does not save the discarded text.
- `UPDATE_TEXT` returns the same state when the text is unchanged, and the note only dispatches it when the text actually changed. An emptied note keeps `text: ''`.
- `Note` receives its callbacks as one stable `NoteActions` object built once by `Board`, instead of a prop per callback.
- Resizing: each note has a single bottom-right `ResizeHandle`. `useResize` puts its handlers on the handle and resizes the note that contains it. Pressing the handle stops propagation, so it never also starts a drag.
- `usePointerGesture` restores `style.cssText` on cancel, so any property a gesture wrote is undone without per-gesture bookkeeping. `applyRect` (in `hooks/`, next to the gesture code) writes `transform`, `width` and `height` for both gestures.
- `resizeWithinBoard` in `domain/geometry` is the single definition of how a requested size is limited (min, max, board edge, shifting back inside). The reducer uses it, and `useResize` uses it for the live preview, so preview and commit cannot disagree.
- Trash: `trashRect` places the zone centered on the bottom edge of the board, and `TrashZone.module.css` positions it the same way. A note is over the trash when its rectangle intersects the zone; merely touching an edge does not count.
- The delete decision uses the final rect at release (`useDrag` calls `onTrash` instead of `onEnd`), not the last frame's flag. A press without movement never commits, so it cannot delete a note. Escape, `pointercancel` and lost capture clear the highlight and keep the note.
- The trash zone has `pointer-events: none` and a very high `z-index` (`--z-trash`), so it stays above notes whose `zIndex` keeps growing without blocking notes underneath it.
- Only dragging deletes: resizing a note over the trash does not.
- Gestures: the hook ignores non-primary buttons and pointers, and a second pointer while a gesture is active. It reads the latest `rect`, `onStart` and `onEnd` through a ref, so its handlers stay stable. The live rect uses the same geometry functions as the reducer (`clampToBoard`, `resizeWithinBoard`), and the reducer clamps again on commit. A gesture that ends where it started commits nothing.
- The element's parent must be the board: the hook reads the parent's bounds once at pointer down.
- Escape is a `keydown` listener on `window` that exists only while a drag or resize gesture is active.
- Unmounting during a drag tears the gesture down (listener, pending frame, capture).
- New notes always use the default size (200×200). There is no size input.
- Every note is resized by dragging a single handle in its bottom-right corner.
- The board fills the window with a 1024×768 minimum. Its size is read when an interaction starts and is not kept in state.

**Tooling**
- Vite, React 19, TypeScript with `strict` and `noUncheckedIndexedAccess`, set in the project tsconfigs because options in the root tsconfig aren't inherited by project references.
- oxlint with type-aware rules. Warnings fail the build, `any`, `@ts-ignore` and non-null assertions are errors, `switch` exhaustiveness is checked, and files are limited to 200 lines.
- Vitest for tests. Component tests run in jsdom (`src/test/setup.ts` registers the jest-dom matchers and cleanup) and use `@testing-library/react`, `@testing-library/jest-dom` and `@testing-library/user-event`. user-event is included for interaction tests such as typing; tests that need pointer coordinates (double-click to create) use `fireEvent` with a stubbed `getBoundingClientRect`, because jsdom has no layout. Pointer gesture tests dispatch `PointerEvent`s with `fireEvent` and control `requestAnimationFrame` with a manual queue (`installManualFrames`), because user-event's pointer support in jsdom is limited. `setup.ts` stubs the pointer-capture methods jsdom lacks.
- Test fixtures (`src/test/testHelpers.ts`) deep-freeze the states they build, so a reducer that mutates its input throws. The tests were checked by hand-mutating the code in a scratch copy (breaking it on purpose must make a test fail), and the gaps found that way were closed with new tests. That check is a manual process and is not part of the repository.
- Prettier owns formatting (single quotes, semicolons, trailing commas, print width 100) and `format:check` is part of `verify`. Markdown, `Design/` and `.opencode/` are not formatted, so the README and PLAN conventions are kept.
- Husky (installed by `npm install` through the `prepare` script): pre-commit runs typecheck, lint and tests, and pre-push runs the full `verify`.
- The only runtime dependencies are `react` and `react-dom`.

## Assumptions
- Notes are always kept fully inside the board, which is stricter than "not fully off-screen".
- Board size is passed with each action instead of being stored in state. Notes restored from storage may need to be re-clamped on load if the window is smaller.
