export class MaterialDisposer {
  static dispose(material: any): void {
    if (!material) return;

    if (Array.isArray(material)) {
      material.forEach(m => m.dispose?.());
      return;
    }

    if (typeof material.dispose === 'function') {
      material.dispose();
    }
  }

  static disposeMesh(mesh: any): void {
    if (!mesh) return;

    // Dispose geometry
    mesh.geometry?.dispose?.();

    // Dispose material using our strategy
    this.dispose(mesh.material);
  }
}
