// TDD: Failing test for FlagAlgorithm physics update
// This test ensures that after several update() calls, at least one unpinned point moves.

import { FlagAlgorithm } from '../FlagAlgorithm';
import { SimulationManager } from '../../../studio/simulation/SimulationManager';

describe('FlagAlgorithm Physics - TDD', () => {
  it('should move at least one unpinned point after several updates', () => {
    const algorithm = new FlagAlgorithm();
    // Use legacy test-compatible initialization
    algorithm.initializeWithManager(new SimulationManager());
    const initialState = algorithm.getState() as any;
    // Clone initial positions of all unpinned points
    const initialPositions = initialState.points.map((pt: any) =>
      pt.pinned ? null : { x: pt.position.x, y: pt.position.y, z: pt.position.z }
    );

    // For debug: print the first unpinned point
    const firstUnpinnedIndex = initialState.points.findIndex((pt: any) => !pt.pinned);
    const initPt = initialState.points[firstUnpinnedIndex];
    console.log('Initial unpinned point:', initPt.position);

    // Run multiple steps
    for (let i = 0; i < 20; i++) {
      algorithm.update(1 / 60);
    }
    const updatedState = algorithm.getState() as any;
    const updatedPt = updatedState.points[firstUnpinnedIndex];
    console.log('Updated unpinned point:', updatedPt.position);

    // Find if any unpinned point moved by comparing to the cloned initial positions
    const moved = updatedState.points.some((pt: any, i: number) => {
      const initPos = initialPositions[i];
      return !pt.pinned && initPos && (
        pt.position.x !== initPos.x ||
        pt.position.y !== initPos.y ||
        pt.position.z !== initPos.z
      );
    });
    expect(moved).toBe(true);
  });
});
