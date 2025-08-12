# 🎯 **Simplified Rendering System Design**

## **Core Problem**
The current rendering system has too many interfaces, patterns, and responsibilities scattered across multiple classes. This creates confusion, bugs, and maintenance issues.

## **🏗️ New Simple Architecture**

### **Single Renderer Interface**
```typescript
interface IRenderer {
  readonly name: string;
  
  // Core methods
  render(context: RenderContext): void;
  canRender(entityId: number, world: World): boolean;
  
  // Lifecycle
  initialize?(): void;
  dispose?(): void;
  
  // Performance
  needsRender?(): boolean; // Dirty flag support
}
```

### **Single Render Manager**
```typescript
class RenderManager {
  private renderers: Map<string, IRenderer> = new Map();
  private dirtyRenderers: Set<string> = new Set();
  
  registerRenderer(renderer: IRenderer): void
  render(): void // Only renders dirty renderers
  markDirty(rendererName: string): void
}
```

### **Entity-Component-Renderer Pattern**
- Each renderer handles specific components
- No complex registration logic
- Simple component queries
- Direct mesh management

## **🎯 Benefits**

### **Simplicity**
- One interface to rule them all
- Clear responsibility separation
- No complex orchestration patterns

### **Performance**
- Dirty flag system (render only when needed)
- Direct component access
- Minimal memory allocations

### **Reliability**
- Single point of truth
- Predictable lifecycle
- Easy debugging

### **Maintainability**
- Less code duplication
- Clear patterns
- Easy to extend

## **📋 Implementation Plan**

1. **Create unified renderer interface**
2. **Implement simple render manager**
3. **Convert existing renderers**
4. **Remove old complex systems**
5. **Add dirty flag optimizations**

Would you like me to implement this simplified design?
