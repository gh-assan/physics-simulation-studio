import {
  calculateRelativePosition,
  calculateDistance,
  isPointInRectangle,
} from '../helpers/locationHelper';

describe('locationHelper', () => {
  describe('calculateRelativePosition', () => {
    it('should return the correct relative position string', () => {
      expect(calculateRelativePosition(10, 20)).toBe(
        'Relative position: (10, 20)',
      );
    });
  });

  describe('calculateDistance', () => {
    it('should calculate the correct distance between two points', () => {
      expect(calculateDistance(0, 0, 3, 4)).toBe(5);
    });
  });

  describe('isPointInRectangle', () => {
    it('should return true if the point is within the rectangle', () => {
      expect(isPointInRectangle(5, 5, 0, 0, 10, 10)).toBe(true);
    });

    it('should return false if the point is outside the rectangle', () => {
      expect(isPointInRectangle(15, 15, 0, 0, 10, 10)).toBe(false);
    });
  });
});
