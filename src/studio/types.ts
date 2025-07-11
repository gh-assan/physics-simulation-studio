// src/studio/types.ts

export interface ComponentControlProperty {
  property: string;
  type: string;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  options?: { text: string; value: string | number | null }[];
}

export interface ComponentPropertyMap {
  [componentName: string]: ComponentControlProperty[];
}

export interface StudioEntity {
  entityId: number;
  components: { [key: string]: any };
}

export interface SerializedScene {
  entities: StudioEntity[];
}
