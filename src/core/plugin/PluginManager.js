"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginManager = void 0;
class PluginManager {
    constructor() {
        this.availablePlugins = new Map();
        this.activePlugins = new Map();
    }
    registerPlugin(plugin) {
        this.availablePlugins.set(plugin.getName(), plugin);
    }
    activatePlugin(pluginName, world) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.activePlugins.has(pluginName)) {
                return; // Already active
            }
            const plugin = this.availablePlugins.get(pluginName);
            if (!plugin) {
                throw new Error(`Plugin "${pluginName}" not found. Make sure it is registered.`);
            }
            // Resolve and activate dependencies recursively
            const dependencies = plugin.getDependencies();
            for (const depName of dependencies) {
                yield this.activatePlugin(depName, world);
            }
            // Register the plugin itself
            plugin.register(world);
            this.activePlugins.set(pluginName, plugin);
            console.log(`Plugin "${pluginName}" activated.`);
        });
    }
    deactivatePlugin(pluginName) {
        const plugin = this.activePlugins.get(pluginName);
        if (plugin) {
            plugin.unregister();
            this.activePlugins.delete(pluginName);
            console.log(`Plugin "${pluginName}" deactivated.`);
        }
    }
}
exports.PluginManager = PluginManager;
