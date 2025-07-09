/**
 * Entity Component System (ECS) module.
 *
 * This module exports all the classes and interfaces for the ECS architecture.
 */

// Interfaces
export { IComponent } from "./IComponent";

// Core ECS classes
export { Component } from "./Component";
export { ComponentManager } from "./ComponentManager";
export { ComponentRegistry } from "./ComponentRegistry";
export { EntityManager } from "./EntityManager";
export { System } from "./System";
export { SystemManager } from "./SystemManager";
export { World } from "./World";
