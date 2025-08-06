import { MaterialDisposer } from '../utils/MaterialDisposer';

// Example showing how to refactor material disposal patterns
// This replaces patterns like:

// OLD PATTERN:
// if (mesh.material.dispose) {
//   mesh.material.dispose();
// } else if (Array.isArray(mesh.material)) {
//   mesh.material.forEach(m => m.dispose());
// }

// NEW PATTERN:
export function refactorMaterialDisposal(mesh: any) {
  MaterialDisposer.dispose(mesh.material);
}

// Example showing how to refactor component type chains
export class ComponentHandlerRegistry {
  private handlers = new Map<string, () => void>();

  constructor() {
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.handlers.set('Flag', this.handleFlagComponent.bind(this));
    this.handlers.set('Water', this.handleWaterComponent.bind(this));
    this.handlers.set('Solar', this.handleSolarComponent.bind(this));
    this.handlers.set('Celestial', this.handleSolarComponent.bind(this)); // Same as solar
    this.handlers.set('Pole', this.handlePoleComponent.bind(this));
    this.handlers.set('Body', this.handlePoleComponent.bind(this)); // Same as pole
  }

  public handleComponent(componentType: string): void {
    const handler = this.handlers.get(this.getHandlerKey(componentType));
    if (handler) {
      handler();
      return;
    }
    
    this.handleDefaultComponent();
  }

  private getHandlerKey(componentType: string): string {
    // Extract the key type from component name
    if (componentType.includes('Flag')) return 'Flag';
    if (componentType.includes('Water')) return 'Water';
    if (componentType.includes('Solar') || componentType.includes('Celestial')) return 'Solar';
    if (componentType.includes('Pole') || componentType.includes('Body')) return 'Pole';
    return 'Default';
  }

  private handleFlagComponent(): void {
    // Flag-specific logic
  }

  private handleWaterComponent(): void {
    // Water-specific logic  
  }

  private handleSolarComponent(): void {
    // Solar/Celestial-specific logic
  }

  private handlePoleComponent(): void {
    // Pole/Body-specific logic
  }

  private handleDefaultComponent(): void {
    // Default handling
  }
}

// This eliminates patterns like:
// if (componentType.includes('Flag')) {
//   // handle flag
// } else if (componentType.includes('Water')) {
//   // handle water
// } else if (componentType.includes('Solar') || componentType.includes('Celestial')) {
//   // handle solar
// } else {
//   // default
// }
