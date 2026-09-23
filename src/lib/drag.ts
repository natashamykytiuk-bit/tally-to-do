import { Platform } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';

/**
 * A pan gesture for dragging whole rows (no grip icon). On the web it starts once the pointer has moved a few
 * pixels, so plain clicks still open things; on phones it starts after a short hold, so scrolling still works.
 */
export function rowDrag() {
  const pan = Gesture.Pan().runOnJS(true);
  return Platform.OS === 'web' ? pan.minDistance(6) : pan.activateAfterLongPress(300);
}

// Releasing a dragged row counts as a click on it in the browser; this lets rows ignore that one click.
let draggedAt = 0;

/** Call when a row drag ends. */
export const markDragged = () => {
  draggedAt = Date.now();
};

/** True right after a drag ended, when a press is really the end of that drag. */
export const justDragged = () => Date.now() - draggedAt < 400;
