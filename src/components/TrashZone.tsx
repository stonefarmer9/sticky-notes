import { TRASH_ZONE_SIZE } from '../domain/constants';
import styles from './TrashZone.module.css';

// Positioned by CSS to match `trashRect` in domain/geometry.
export const TrashZone = () => (
  <aside
    className={styles.trash}
    aria-label="Trash zone"
    style={{ width: TRASH_ZONE_SIZE.width, height: TRASH_ZONE_SIZE.height }}
  >
    Drop here to delete
  </aside>
);
