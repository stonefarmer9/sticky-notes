import type { Rect } from '../domain/types';
import { toTranslate3d } from '../styles/transform';

export const applyRect = (element: HTMLElement, rect: Rect): void => {
  element.style.transform = toTranslate3d(rect);
  element.style.width = `${rect.width}px`;
  element.style.height = `${rect.height}px`;
};
