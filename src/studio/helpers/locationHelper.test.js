"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const locationHelper_1 = require("./locationHelper");
describe('getLocation', () => {
    it('should return window.location', () => {
        expect((0, locationHelper_1.getLocation)()).toBe(window.location);
    });
    it('should return a Location object', () => {
        expect((0, locationHelper_1.getLocation)()).toHaveProperty('href');
        expect(typeof (0, locationHelper_1.getLocation)().href).toBe('string');
    });
    it('should match window.location.href', () => {
        expect((0, locationHelper_1.getLocation)().href).toBe(window.location.href);
    });
});
