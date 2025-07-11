export interface IComponent<T = unknown> {
  simulationType?: string;
  clone(): T;
}
