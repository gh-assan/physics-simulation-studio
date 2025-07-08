import { RenderableComponent } from '@core/components';
import * as THREE from 'three';

describe('RenderableComponent', () => {
    it('should create a renderable component with a Three.js Mesh', () => {
        const mockMesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
        const component = new RenderableComponent(mockMesh);
        expect(component.mesh).toBe(mockMesh);
    });
});