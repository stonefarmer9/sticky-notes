import type { ComponentPropsWithoutRef, MouseEvent } from 'react';

import styles from './ResizeHandle.module.css';

type ResizeHandleProps = Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'title'>;

// Double-clicking the handle must not bubble up and start editing the note.
const stopDoubleClick = (event: MouseEvent<HTMLDivElement>) => event.stopPropagation();

export const ResizeHandle = (props: ResizeHandleProps) => (
  <div className={styles.handle} title="Resize" onDoubleClick={stopDoubleClick} {...props} />
);
