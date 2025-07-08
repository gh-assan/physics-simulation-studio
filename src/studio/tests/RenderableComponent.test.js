"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const components_1 = require("@core/components");
describe('RenderableComponent', () => {
    it('should create a renderable component with default values', () => {
        const component = new components_1.RenderableComponent();
        expect(component.geometry).toBe('box');
        expect(component.color).toBe('#ffffff');
    });
    it('should create a renderable component with specified values', () => {
        const component = new components_1.RenderableComponent('sphere', '#ff0000');
        expect(component.geometry).toBe('sphere');
        expect(component.color).toBe('#ff0000');
    });
});
