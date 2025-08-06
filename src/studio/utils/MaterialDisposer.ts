export class MaterialDisposer {
  static dispose(material: any): void {
    if (!material) return;

    if (Array.isArray(material)) {
      material.forEach(m => m.dispose?.());
    } else {
      material.dispose?.();
    }
  }

  static disposeMesh(mesh: any): void {
    if (!mesh) return;

    mesh.geometry?.dispose?.();
    this.dispose(mesh.material);
  }
}
