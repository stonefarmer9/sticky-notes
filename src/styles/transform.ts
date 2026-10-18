import type { Point } from '../domain/types';

export const toTranslate3d = ({ x, y }: Point): string => `translate3d(${x}px, ${y}px, 0)`;
