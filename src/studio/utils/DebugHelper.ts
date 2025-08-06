// Debug helper for visibility issues
export class DebugHelper {
  static logDOMStructure() {
    console.log('=== DOM Structure Debug ===');
    console.log('Body children:', document.body.children.length);

    for (let i = 0; i < document.body.children.length; i++) {
      const child = document.body.children[i];
      console.log(`Child ${i}:`, child.tagName, child.id, child.className);
    }

    console.log('Left panel:', document.getElementById('left-panel'));
    console.log('Main content:', document.getElementById('main-content'));
    console.log('Tweakpane elements:', document.querySelectorAll('.tp-dfwv'));
    console.log('All elements with tp- classes:', document.querySelectorAll('[class*="tp-"]'));
  }

  static checkVisibility() {
    console.log('=== Visibility Check ===');
    const leftPanel = document.getElementById('left-panel');
    if (leftPanel) {
      console.log('Left panel computed style:', window.getComputedStyle(leftPanel));
      console.log('Left panel display:', leftPanel.style.display);
      console.log('Left panel children:', leftPanel.children.length);
    }
  }

  static logWindowObjects() {
    console.log('=== Window Objects ===');
    console.log('visibilityManager:', (window as any).visibilityManager);
    console.log('uiManager:', (window as any).uiManager);
    console.log('studio:', (window as any).studio);
  }
}

// Auto-run debug on load
setTimeout(() => {
  DebugHelper.logDOMStructure();
  DebugHelper.checkVisibility();
  DebugHelper.logWindowObjects();
}, 1000);
