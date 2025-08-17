// Debug script to check module imports
console.log('Testing imports...');

try {
  console.log('1. Checking built IRenderer...');
  const irenderer = require('./build/src/studio/rendering/IRenderer');
  console.log('IRenderer keys:', Object.keys(irenderer));
  console.log('IRenderer:', irenderer);
} catch (error) {
  console.log('IRenderer error:', error.message);
}

try {
  console.log('2. Checking built RenderSystem...');
  const rendersystem = require('./build/src/studio/rendering/RenderSystem');
  console.log('RenderSystem keys:', Object.keys(rendersystem));
  console.log('RenderSystem:', rendersystem);
} catch (error) {
  console.log('RenderSystem error:', error.message);
}

try {
  console.log('3. Checking built DirectFlagRenderer...');
  const directflagrenderer = require('./build/src/plugins/flag-simulation/DirectFlagRenderer');
  console.log('DirectFlagRenderer keys:', Object.keys(directflagrenderer));
  console.log('DirectFlagRenderer:', directflagrenderer);
} catch (error) {
  console.log('DirectFlagRenderer error:', error.message);
}
