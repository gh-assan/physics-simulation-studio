// Simple CommonJS exports for testing

class BaseRenderer {
  constructor(name, priority = 10) {
    this.name = name;
    this.priority = priority;
  }

  update(scene, deltaTime) {
    // Override in subclasses
  }

  dispose() {
    // Override in subclasses
  }
}

module.exports = { BaseRenderer };
