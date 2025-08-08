/**
 * 🎯 Simplified Rendering System
 * 
 * Exports the complete simplified rendering solution:
 * - Single IRenderer interface
 * - BaseRenderer helper class  
 * - SimplifiedRenderManager
 * - SimplifiedRenderSystem (ECS integration)
 * - Example implementations
 */

// Core interfaces and base classes
export { IRenderer, RenderContext, BaseRenderer } from './SimplifiedInterfaces';

// Core render manager
export { SimplifiedRenderManager } from './SimplifiedRenderManager';

// ECS system integration
export { SimplifiedRenderSystem } from './SimplifiedRenderSystem';

// Example implementations
export { SimplifiedFlagRenderer } from './SimplifiedFlagRenderer';

/**
 * 🔄 Migration Guide:
 * 
 * 1. Replace your current renderer with IRenderer interface
 * 2. Use SimplifiedRenderSystem instead of RenderSystem + RenderOrchestrator
 * 3. Implement canRender() and render() methods
 * 4. Use markDirty() for performance optimizations
 * 
 * Benefits:
 * ✅ Single interface instead of 3+
 * ✅ Built-in dirty flag system
 * ✅ Automatic resource management
 * ✅ Clear separation of concerns
 * ✅ Easy debugging and monitoring
 */
