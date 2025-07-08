"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIManager = void 0;
const tweakpane_1 = require("tweakpane");
class UIManager {
    constructor() {
        this.folders = new Map();
        this.pane = new tweakpane_1.Pane();
    }
    registerComponentControls(componentName, data) {
        // Tweakpane's addFolder is a method of the Pane instance
        const folder = this.pane.addFolder({ title: componentName }); // Type assertion to any
        this.folders.set(componentName, folder);
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                folder.addBinding(data, key);
            }
        }
    }
    clearControls() {
        // Tweakpane's dispose method on the Pane instance removes all controls
        this.pane.dispose();
        this.pane = new tweakpane_1.Pane(); // Re-initialize the pane after disposing
        this.folders.clear();
    }
}
exports.UIManager = UIManager;
