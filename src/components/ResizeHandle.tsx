import type { ComponentPropsWithoutRef } from 'react';

import styles from './ResizeHandle.module.css';

type ResizeHandleProps = Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'title'>;

export const ResizeHandle = (props: ResizeHandleProps) => (
  <div className={styles.handle} title="Resize" {...props} />
);
