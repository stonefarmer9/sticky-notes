import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';

import type { NotesAction } from './actions';
import { initialNotesState, notesReducer, type NotesState } from './notesReducer';

// State and dispatch live in separate contexts so components that only dispatch
// are not re-rendered when the notes change.
const NotesStateContext = createContext<NotesState | null>(null);
const NotesDispatchContext = createContext<Dispatch<NotesAction> | null>(null);

interface NotesProviderProps {
  // Read once on mount; later changes to this prop are ignored.
  readonly initialState?: NotesState;
  readonly children: ReactNode;
}

export const NotesProvider = ({
  initialState = initialNotesState,
  children,
}: NotesProviderProps) => {
  const [state, dispatch] = useReducer(notesReducer, initialState);

  return (
    <NotesDispatchContext value={dispatch}>
      <NotesStateContext value={state}>{children}</NotesStateContext>
    </NotesDispatchContext>
  );
};

export const useNotesState = (): NotesState => {
  const state = useContext(NotesStateContext);
  if (state === null) {
    throw new Error('useNotesState must be used within a NotesProvider');
  }
  return state;
};

export const useNotesDispatch = (): Dispatch<NotesAction> => {
  const dispatch = useContext(NotesDispatchContext);
  if (dispatch === null) {
    throw new Error('useNotesDispatch must be used within a NotesProvider');
  }
  return dispatch;
};
