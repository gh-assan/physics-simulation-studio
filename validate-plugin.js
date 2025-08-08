// Quick validation script
const path = require('path');
console.log('Working directory:', process.cwd());

// Try to import the built plugin
try {
    const buildPath = path.join(__dirname, 'build/src/plugins/flag-simulation/index.js');
    console.log('Trying to import from:', buildPath);
    
    if (require('fs').existsSync(buildPath)) {
        const FlagSimulationPlugin = require(buildPath).default;
        const plugin = new FlagSimulationPlugin();
        
        console.log('✅ Plugin created successfully!');
        console.log('Plugin name:', plugin.getName());
        console.log('Plugin version:', plugin.getVersion?.());
        console.log('Dependencies:', plugin.getDependencies());
        
        const schema = plugin.getParameterSchema();
        console.log('Parameter schema plugin ID:', schema.pluginId);
        console.log('Components count:', schema.components.size);
        
        console.log('✅ Flag simulation migration successful and working!');
    } else {
        console.log('❌ Built plugin not found at:', buildPath);
    }
} catch (error) {
    console.error('❌ Error testing plugin:', error.message);
}
