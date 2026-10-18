import { Board } from './components/Board';
import { NotesProvider } from './state/NotesContext';

export const App = () => (
  <NotesProvider>
    <Board />
  </NotesProvider>
);
