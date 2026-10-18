import { Board } from './components/Board';
import { NotesProvider } from './state/NotesContext';

const App = () => (
  <NotesProvider>
    <Board />
  </NotesProvider>
);

export default App;
