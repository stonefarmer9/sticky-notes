import { MIN_BOARD_SIZE } from '../domain/constants';
import { useNotesState } from '../state/NotesContext';
import styles from './Board.module.css';
import { Note } from './Note';

export const Board = () => {
  const { notes } = useNotesState();

  return (
    <main
      className={styles.board}
      aria-label="Sticky notes board"
      style={{ minWidth: MIN_BOARD_SIZE.width, minHeight: MIN_BOARD_SIZE.height }}
    >
      {notes.map((note) => (
        <Note key={note.id} note={note} />
      ))}
    </main>
  );
};
