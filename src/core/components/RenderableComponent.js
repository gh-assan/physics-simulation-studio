"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RenderableComponent = void 0;
class RenderableComponent {
    constructor(geometry = 'box', color = '#ffffff') {
        this.geometry = geometry;
        this.color = color;
    }
}
exports.RenderableComponent = RenderableComponent;
