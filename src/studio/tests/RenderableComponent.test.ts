import { RenderableComponent } from '@core/components';

describe('RenderableComponent', () => {
    it('should create a renderable component with default values', () => {
        const component = new RenderableComponent();
        expect(component.geometry).toBe('box');
        expect(component.color).toBe('#ffffff');
    });

    it('should create a renderable component with specified values', () => {
        const component = new RenderableComponent('sphere', '#ff0000');
        expect(component.geometry).toBe('sphere');
        expect(component.color).toBe('#ff0000');
    });
});
