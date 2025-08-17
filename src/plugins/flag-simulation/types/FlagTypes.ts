/**
 * Flag Simulation Type Definitions
 *
 * Core types and interfaces used throughout the flag simulation system.
 * Extracted from FlagAlgorithm.ts for better modularity.
 */

import { Vector3 } from '../utils/Vector3';

/**
 * Type for subscription cleanup
 */
export interface Subscription {
  unsubscribe(): void;
}

/**
 * Internal types for cloth physics
 */
export interface ClothPoint {
  id: number;
  position: Vector3;
  previousPosition: Vector3;
  forces: Vector3;
  pinned: boolean;
  mass: number;
}

export interface ClothSpring {
  p1: number; // Point index
  p2: number; // Point index
  restLength: number;
  stiffness: number;
}

/**
 * Physics simulation configuration
 */
export interface FlagPhysicsConfig {
  gravity: Vector3;
  wind: Vector3;
  damping: number;
  timestep: number;
  stiffness: number;
  flagWidth: number;
  flagHeight: number;
  spacing: number;
}

/**
 * Parameter update event data
 */
export interface ParameterUpdateEvent {
  parameter: string;
  value: any;
  timestamp: number;
}

/**
 * Visual feedback configuration
 */
export interface VisualFeedbackConfig {
  animationEnabled: boolean;
  throttleEnabled: boolean;
  throttleDelay: number;
  showIndicators: boolean;
  showPreview: boolean;
}
