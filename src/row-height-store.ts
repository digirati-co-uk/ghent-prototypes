import { createStore } from "zustand/vanilla";

type RowHeightRange = {
  startIndex: number;
  length: number;
  height: number;
};

export interface RowHeightStore {
  defaultHeight: number;
  currentIndex: number;
  rowHeightRanges: Array<RowHeightRange>;
  setDefaultHeight(height: number): void;
  addCorrection(atIndex: number, delta: number): void;
  moveDown(): number;
  moveUp(): number;
  setIndex(index: number): number;
  findRangeAtIndex(index: number): readonly [RowHeightRange | undefined, number];
  calculateOffsetHeight(atIndex?: number): number;
  resolveHeight(): number;
}

export function createRowHeightStore() {
  const defaultHeight = 25;

  return createStore<RowHeightStore>((set, get) => {
    const resolveHeight = () => {
      const index = get().currentIndex;
      const [range] = findRangeAtIndex(index);
      return range?.height || getLastRange()?.height || get().defaultHeight;
    };

    const findRangeAtIndex = (atIndex: number) => {
      const { rowHeightRanges } = get();
      const index = rowHeightRanges.findIndex(
        ({ startIndex, length }) => startIndex <= atIndex && atIndex < startIndex + length,
      );

      return [rowHeightRanges[index], index] as const;
    };

    const getLastRange = () => {
      const rowHeightRanges = get().rowHeightRanges;
      if (rowHeightRanges.length === 0) return undefined;
      return rowHeightRanges[rowHeightRanges.length - 1];
    };

    const findPreviousRange = (atIndex: number) => {
      const { rowHeightRanges } = get();
      return rowHeightRanges.find(({ startIndex }) => startIndex < atIndex);
    };

    const addNewRange = (startIndex: number, length: number, height: number) => {
      set({
        rowHeightRanges: [...get().rowHeightRanges, { startIndex, length, height }].sort(
          (a, b) => a.startIndex - b.startIndex,
        ),
      });
    };

    const removeRangeAtIndex = (index: number) => {
      set({
        rowHeightRanges: get().rowHeightRanges.filter((_, i) => i !== index),
      });
    };

    const calculateOffsetHeight = (atIndex?: number) => {
      const { rowHeightRanges, currentIndex: _currentIndex, defaultHeight: defaultHeight_ } = get();
      const currentIndex = typeof atIndex === "undefined" ? _currentIndex : atIndex;
      // @todo margin?
      const margin = 440;
      let height = margin;

      if (currentIndex === 0) {
        return height;
      }

      const defaultHeight = getLastRange()?.height || defaultHeight_;

      let processedUpTo = 0;

      for (const range of rowHeightRanges) {
        // If there's a gap between processed items and this range, fill with default height
        if (range.startIndex > processedUpTo) {
          const gapEnd = Math.min(range.startIndex, currentIndex);
          height += (gapEnd - processedUpTo) * defaultHeight_;
          processedUpTo = gapEnd;
        }

        // If we've processed up to currentIndex, we're done
        if (processedUpTo >= currentIndex) break;

        // Process this range up to currentIndex
        const rangeEnd = range.startIndex + range.length;
        const processEnd = Math.min(rangeEnd, currentIndex);
        const itemsToProcess = processEnd - Math.max(range.startIndex, processedUpTo);

        if (itemsToProcess > 0) {
          height += itemsToProcess * range.height;
          processedUpTo = processEnd;
        }

        // If we've processed up to currentIndex, we're done
        if (processedUpTo >= currentIndex) break;
      }

      // If there are still items to process after all ranges, use default height
      if (processedUpTo < currentIndex) {
        height += (currentIndex - processedUpTo) * defaultHeight;
      }

      return height;
    };

    return {
      resolveHeight,
      findRangeAtIndex,
      calculateOffsetHeight,
      defaultHeight,
      currentIndex: 0,
      rowHeightRanges: [],
      setDefaultHeight(height: number) {
        set({ defaultHeight: height });
      },
      addCorrection(atIndex, delta) {
        const [existingRowRange, existingRowRangeIndex] = findRangeAtIndex(atIndex);
        if (existingRowRange) {
          const currentList = [...get().rowHeightRanges];

          const newLength = atIndex - existingRowRange.startIndex + 1;
          const newHeight = existingRowRange.height + delta / newLength;
          removeRangeAtIndex(existingRowRangeIndex);
          addNewRange(existingRowRange.startIndex, newLength, newHeight);
          addNewRange(atIndex + 1, currentList.length - existingRowRangeIndex - 1, newHeight);

          return;
        }

        const lastRange = getLastRange();
        if (lastRange && lastRange?.startIndex < atIndex) {
          const startIndex = lastRange.startIndex + lastRange.length;
          const length = atIndex - startIndex + 1;
          const newHeight = lastRange.height + delta / length;
          addNewRange(startIndex, length, newHeight);
          return;
        }

        const previous = findPreviousRange(atIndex);
        if (previous) {
          const startIndex = previous.startIndex + previous.length;
          const length = atIndex - startIndex + 1;
          // They moved down `length` times, and then corrected delta.
          // What's should the new height be?
          const newHeight = previous.height + delta / length;
          // Update the height of the existing range

          addNewRange(startIndex, length, newHeight);
          return;
        }

        // Otherwise correct as if it started at 0.

        const height = get().defaultHeight + delta / (atIndex + 1);

        addNewRange(0, atIndex + 1, height);
      },

      setIndex(index: number) {
        set({ currentIndex: index });
        return resolveHeight();
      },
      moveUp() {
        set({ currentIndex: get().currentIndex - 1 });
        return resolveHeight();
      },
      moveDown() {
        set({ currentIndex: get().currentIndex + 1 });
        return resolveHeight();
      },
    };
  });
}
