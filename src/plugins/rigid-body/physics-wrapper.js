"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhysicsWrapper = void 0;
const rapier3d_compat_1 = __importDefault(require("@dimforge/rapier3d-compat"));
class PhysicsWrapper {
    constructor() {
        const gravity = new rapier3d_compat_1.default.Vector3(0.0, -9.81, 0.0);
        this.world = new rapier3d_compat_1.default.World(gravity);
    }
    step(deltaTime) {
        // Use a fixed timestep for stability
        this.world.timestep = 1.0 / 60.0;
        this.world.step();
    }
}
exports.PhysicsWrapper = PhysicsWrapper;
