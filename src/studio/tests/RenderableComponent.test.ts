import { RenderableComponent } from '@core/components';

describe('RenderableComponent', () => {
    it('should create a box renderable with default color', () => {
        const component = new RenderableComponent('box', undefined, 1, 2, 3);
        expect(component.geometryType).toBe('box');
        expect(component.color).toBe(0xffffff);
        expect(component.width).toBe(1);
        expect(component.height).toBe(2);
        expect(component.depth).toBe(3);
        expect(component.radius).toBeUndefined();
    });

    it('should create a sphere renderable with custom color', () => {
        const component = new RenderableComponent('sphere', 0x00ff00, undefined, undefined, undefined, 0.5);
        expect(component.geometryType).toBe('sphere');
        expect(component.color).toBe(0x00ff00);
        expect(component.radius).toBe(0.5);
        expect(component.width).toBeUndefined();
    });
});