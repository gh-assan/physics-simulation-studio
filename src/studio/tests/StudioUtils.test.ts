import {extractComponentProperties} from '../utils/StudioUtils';
import {IComponent} from '../../core/ecs/IComponent';

interface MockComponent extends IComponent {
  x: number;
  y: number;
  isVisible: boolean;
  clone(): MockComponent;
}

describe('StudioUtils', () => {
  describe('extractComponentProperties', () => {
    it('should extract properties from a component', () => {
      const mockComponent: MockComponent = {
        x: 10,
        y: 20,
        isVisible: true,
        clone() {
          return {...this};
        },
      };

      const properties = extractComponentProperties(mockComponent);

      expect(properties).toEqual([
        {label: 'x', property: 'x', type: 'number', min: 0, max: 100, step: 1},
        {label: 'y', property: 'y', type: 'number', min: 0, max: 100, step: 1},
        {label: 'isVisible', property: 'isVisible', type: 'boolean'},
      ]);
    });
  });
});
