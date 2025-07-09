// src/studio/types.ts

export interface ComponentControlProperty {
  property: string;
  type: string;
  label: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface IEntity {
  id: number;
  components: Record<string, any>;
}

export interface ISystem {
  update(deltaTime: number): void;
}

export interface IComponent {
  name: string;
}

export type ComponentMap = Record<string, IComponent>;
