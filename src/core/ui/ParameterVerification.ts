/**
 * Quick Parameter System Verification
 *
 * Run this in the browser console to verify the parameter system is working
 */

console.log('🔍 Parameter System Verification');

// Check if systems are loaded
const systems = {
  parameterSystemIntegration: (window as any).parameterSystemIntegration,
  propertyInspectorUIManager: (window as any).propertyInspectorUIManager,
  ParameterSchemaRegistry: (window as any).ParameterSchemaRegistry
};

console.log('System availability:', systems);

// Check if schemas are registered
if (systems.parameterSystemIntegration) {
  console.log('✅ Parameter system integration available');

  // Try to show flag parameters
  try {
    console.log('🎯 Attempting to show flag parameters...');
    systems.parameterSystemIntegration.demoFlagSimulation();
    console.log('✅ Flag simulation demo triggered');
  } catch (error) {
    console.error('❌ Error showing flag parameters:', error);
  }

  // Try to show water parameters
  try {
    console.log('🎯 Attempting to show water parameters...');
    systems.parameterSystemIntegration.demoWaterSimulation();
    console.log('✅ Water simulation demo triggered');
  } catch (error) {
    console.error('❌ Error showing water parameters:', error);
  }

} else {
  console.error('❌ Parameter system integration not available');
}

// Check if UI panels exist
const leftPanel = document.getElementById('left-panel');
console.log('Left panel found:', !!leftPanel);

if (leftPanel) {
  const panels = leftPanel.querySelectorAll('.tp-fldv_t');
  console.log('Total UI panels:', panels.length);

  panels.forEach((panel, index) => {
    const title = panel.textContent;
    console.log(`Panel ${index + 1}: ${title}`);
  });
}

// Manual test functions
(window as any).testParameterSystem = {
  showFlag: () => {
    console.log('Manual test: Showing flag parameters');
    if (systems.parameterSystemIntegration) {
      systems.parameterSystemIntegration.demoFlagSimulation();
    }
  },

  showWater: () => {
    console.log('Manual test: Showing water parameters');
    if (systems.parameterSystemIntegration) {
      systems.parameterSystemIntegration.demoWaterSimulation();
    }
  },

  showMultiple: () => {
    console.log('Manual test: Showing multiple parameters');
    if (systems.parameterSystemIntegration) {
      systems.parameterSystemIntegration.demoMultiplePlugins();
    }
  },

  clear: () => {
    console.log('Manual test: Clearing parameters');
    if (systems.propertyInspectorUIManager) {
      systems.propertyInspectorUIManager.clearInspectorControls();
    }
  }
};

console.log('🧪 Manual test functions available on window.testParameterSystem:');
console.log('- testParameterSystem.showFlag()');
console.log('- testParameterSystem.showWater()');
console.log('- testParameterSystem.showMultiple()');
console.log('- testParameterSystem.clear()');

export {}; // Make this a module
