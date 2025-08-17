import { BaseRenderer } from '../../studio/rendering/IRenderer';

/**
 * Simple flag renderer - no dependencies
 */
export class DirectFlagRenderer extends BaseRenderer {
  constructor() {
    super('direct-flag-renderer', 10);
  }

  update(): void {
    // Minimal no-op for TDD API check
  }

  dispose(): void {
    // Minimal no-op for TDD API check
  }
}
