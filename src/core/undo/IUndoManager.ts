export interface IUndoManager {
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
}
