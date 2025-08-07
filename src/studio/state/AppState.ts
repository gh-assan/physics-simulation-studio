/**
 * Global Application State - Single Source of Truth
 * This immutable state contains all important application data
 */

export interface PluginInfo {
  readonly name: string;
  readonly version: string;
  readonly dependencies: readonly string[];
  readonly isRegistered: boolean;
  readonly isActive: boolean;
  readonly metadata: {
    readonly displayName: string;
    readonly description: string;
    readonly author: string;
  };
}

export interface SystemInfo {
  readonly name: string;
  readonly priority: number;
  readonly isActive: boolean;
  readonly componentDependencies: readonly string[];
}

export interface ComponentInfo {
  readonly name: string;
  readonly type: string;
  readonly isRegistered: boolean;
  readonly entityCount: number;
}

export interface UIState {
  readonly activePanels: readonly string[];
  readonly visiblePanels: readonly string[];
  readonly selectedEntity: string | null;
  readonly inspectorMode: 'component' | 'system' | 'plugin';
  readonly theme: 'light' | 'dark';
}

export interface SimulationState {
  readonly currentSimulation: string | null;
  readonly isRunning: boolean;
  readonly isPaused: boolean;
  readonly frameCount: number;
  readonly deltaTime: number;
  readonly frameRate: number;
}

export interface ViewportState {
  readonly camera: {
    readonly position: { readonly x: number; readonly y: number; readonly z: number };
    readonly target: { readonly x: number; readonly y: number; readonly z: number };
    readonly zoom: number;
  };
  readonly rendering: {
    readonly showGrid: boolean;
    readonly showAxes: boolean;
    readonly wireframe: boolean;
    readonly shadows: boolean;
  };
  readonly controls: {
    readonly snapToGrid: boolean;
    readonly gridSize: number;
  };
}

export interface AppConfiguration {
  readonly version: string;
  readonly buildDate: string;
  readonly environment: 'development' | 'production' | 'test';
  readonly features: {
    readonly debugMode: boolean;
    readonly performanceMonitoring: boolean;
    readonly experimentalFeatures: boolean;
  };
  readonly limits: {
    readonly maxEntities: number;
    readonly maxPlugins: number;
    readonly maxSystems: number;
  };
}

export interface PerformanceState {
  readonly metrics: {
    readonly frameRate: number;
    readonly averageFrameRate: number;
    readonly renderTime: number;
    readonly updateTime: number;
    readonly memoryUsage: number;
  };
  readonly entityCount: number;
  readonly systemUpdateTimes: readonly { readonly name: string; readonly time: number }[];
}

export interface ErrorState {
  readonly errors: readonly {
    readonly id: string;
    readonly message: string;
    readonly level: 'warning' | 'error' | 'critical';
    readonly timestamp: number;
    readonly source: string;
    readonly acknowledged: boolean;
  }[];
  readonly maxErrors: number;
}

export interface EntityState {
  readonly entities: readonly {
    readonly id: string;
    readonly name?: string;
    readonly components: readonly string[];
    readonly isVisible: boolean;
    readonly isSelected: boolean;
  }[];
  readonly selectedEntities: readonly string[];
  readonly totalCount: number;
}

export interface UserPreferencesState {
  readonly theme: 'light' | 'dark' | 'auto';
  readonly autoSave: boolean;
  readonly gridSettings: {
    readonly enabled: boolean;
    readonly size: number;
    readonly color: string;
  };
  readonly debugPanelsVisible: boolean;
}

/**
 * The complete application state
 * This is immutable and can only be changed through actions
 */
export interface AppState {
  readonly configuration: AppConfiguration;
  readonly plugins: readonly PluginInfo[];
  readonly systems: readonly SystemInfo[];
  readonly components: readonly ComponentInfo[];
  readonly ui: UIState;
  readonly simulation: SimulationState;
  readonly viewport: ViewportState;
  readonly performance: PerformanceState;
  readonly errors: ErrorState;
  readonly entities: EntityState;
  readonly userPreferences: UserPreferencesState;
  readonly lastUpdated: number;
}

/**
 * Initial application state
 * This represents the clean startup state of the application
 */
export const createInitialAppState = (): AppState => ({
  configuration: {
    version: "1.0.0",
    buildDate: new Date().toISOString(),
    environment: process.env.NODE_ENV as 'development' | 'production' | 'test' || 'development',
    features: {
      debugMode: process.env.NODE_ENV === 'development',
      performanceMonitoring: true,
      experimentalFeatures: false,
    },
    limits: {
      maxEntities: 10000,
      maxPlugins: 50,
      maxSystems: 100,
    },
  },
  plugins: [],
  systems: [],
  components: [],
  ui: {
    activePanels: ['global-controls', 'simulation-selector'],
    visiblePanels: ['global-controls', 'simulation-selector'],
    selectedEntity: null,
    inspectorMode: 'component',
    theme: 'light',
  },
  simulation: {
    currentSimulation: null,
    isRunning: false,
    isPaused: false,
    frameCount: 0,
    deltaTime: 0,
    frameRate: 60,
  },
  viewport: {
    camera: {
      position: { x: 10, y: 10, z: 10 },
      target: { x: 0, y: 0, z: 0 },
      zoom: 1,
    },
    rendering: {
      showGrid: true,
      showAxes: true,
      wireframe: false,
      shadows: true,
    },
    controls: {
      snapToGrid: false,
      gridSize: 1,
    },
  },
  performance: {
    metrics: {
      frameRate: 60,
      averageFrameRate: 60,
      renderTime: 0,
      updateTime: 0,
      memoryUsage: 0,
    },
    entityCount: 0,
    systemUpdateTimes: [],
  },
  errors: {
    errors: [],
    maxErrors: 100,
  },
  entities: {
    entities: [],
    selectedEntities: [],
    totalCount: 0,
  },
  userPreferences: {
    theme: 'light',
    autoSave: true,
    gridSettings: {
      enabled: true,
      size: 1,
      color: '#cccccc',
    },
    debugPanelsVisible: false,
  },
  lastUpdated: Date.now(),
});
