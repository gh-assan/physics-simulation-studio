// Export the new clean architecture water simulation plugin
export { WaterSimulationPlugin } from './WaterSimulationPlugin';
export { WaterAlgorithm } from './WaterAlgorithm';
export { WaterRenderer } from './WaterRenderer';

// Legacy exports for backward compatibility (can be removed later)
export { WaterBodyComponent, WaterDropletComponent } from './WaterComponents';

// Default export for backward compatibility
export { WaterSimulationPlugin as default } from './WaterSimulationPlugin';
