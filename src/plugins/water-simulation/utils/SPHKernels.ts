export class SPHKernels {
  // Smoothing length (h)
  private h: number;
  private h2: number;
  private h3: number;
  private h4: number;
  private h5: number;
  private h6: number;
  private h9: number;

  constructor(smoothingLength: number) {
    this.h = smoothingLength;
    this.h2 = this.h * this.h;
    this.h3 = this.h2 * this.h;
    this.h4 = this.h3 * this.h;
    this.h5 = this.h4 * this.h;
    this.h6 = this.h5 * this.h;
    this.h9 = this.h6 * this.h3;
  }

  // Poly6 Kernel (for density and pressure)
  W_poly6(r: number): number {
    if (r < 0 || r > this.h) return 0;
    const term = this.h2 - r * r;
    return (315 / (64 * Math.PI * this.h9)) * term * term * term;
  }

  // Spiky Kernel (for pressure force)
  W_spiky(r: number): number {
    if (r < 0 || r > this.h) return 0;
    const term = this.h - r;
    return (15 / (Math.PI * this.h4)) * term * term;
  }

  // Spiky Kernel Gradient (for pressure force)
  grad_W_spiky(
    r: number,
    rVec: { x: number; y: number; z: number }
  ): { x: number; y: number; z: number } {
    if (r < 0 || r > this.h) return { x: 0, y: 0, z: 0 };
    const term = this.h - r;
    const factor = (15 / (Math.PI * this.h4)) * term * term * (-1 / r);
    return { x: rVec.x * factor, y: rVec.y * factor, z: rVec.z * factor };
  }

  // Viscosity Kernel (for viscosity force)
  W_viscosity(r: number): number {
    if (r < 0 || r > this.h) return 0;
    const term = this.h - r;
    return (15 / (2 * Math.PI * this.h3)) * term * term * term; // Corrected formula
  }

  // Viscosity Kernel Laplacian (for viscosity force)
  laplacian_W_viscosity(r: number): number {
    if (r < 0 || r > this.h) return 0;
    const term = this.h - r;
    return (45 / (Math.PI * this.h5)) * term;
  }
}
