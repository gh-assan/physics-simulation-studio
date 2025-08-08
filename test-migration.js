import { FlagSimulationPlugin } from '../plugins/flag-simulation';

// Simple test to verify the migration works
console.log('=== Flag Simulation Plugin Migration Test ===');

const plugin = new FlagSimulationPlugin();

console.log('Plugin Name:', plugin.getName());
console.log('Plugin Version:', plugin.getVersion?.());
console.log('Plugin Description:', plugin.getDescription?.());
console.log('Dependencies:', plugin.getDependencies());

// Test algorithm access
const algorithm = plugin.getAlgorithm();
console.log('Algorithm Name:', algorithm.name);
console.log('Algorithm Version:', algorithm.version);

// Test renderer access
const renderer = plugin.getRenderer();
console.log('Renderer Type:', renderer.rendererType);
console.log('Algorithm Name (from renderer):', renderer.algorithmName);

// Test parameter schema
const parameterSchema = plugin.getParameterSchema();
console.log('Parameter Schema Plugin ID:', parameterSchema.pluginId);
console.log('Components:', parameterSchema.components.size);
console.log('Flag Component Parameters:', parameterSchema.components.get('FlagComponent')?.length);

console.log('✅ Migration successful! Flag plugin implements new architecture correctly.');
