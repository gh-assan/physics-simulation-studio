/**
 * ViewportToolbar.ts
 *
 * A toolbar component for the 3D viewport that provides quick access to common tools
 * and settings, including transformation tools, grid and snap settings, and camera controls.
 */

import { ToolbarButton } from "./ToolbarButton";
import { CameraControls, CameraMode } from "./CameraControls";
import { ThreeGraphicsManager } from "../graphics/ThreeGraphicsManager";

// Define the available tools
export enum ToolType {
  SELECT = "select",
  MOVE = "move",
  ROTATE = "rotate",
  SCALE = "scale"
}

// Define the toolbar options
export interface ViewportToolbarOptions {
  container?: HTMLElement; // Container element for the toolbar
  graphicsManager: ThreeGraphicsManager; // Graphics manager for camera controls
}

export class ViewportToolbar {
  private element: HTMLElement;
  private dragHandle: HTMLElement;
  private toolButtons: Map<ToolType, ToolbarButton> = new Map();
  private cameraButtons: Map<string, ToolbarButton> = new Map();
  private settingsButtons: Map<string, ToolbarButton> = new Map();
  private activeTool: ToolType = ToolType.SELECT;
  private cameraControls: CameraControls;
  private graphicsManager: ThreeGraphicsManager;

  // Settings state
  private showGrid = true;
  private snapToGrid = false;

  // Drag state
  private isDragging = false;
  private hasMoved = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private initialX = 0;
  private initialY = 0;

  constructor(options: ViewportToolbarOptions) {
    this.graphicsManager = options.graphicsManager;
    this.cameraControls = new CameraControls(this.graphicsManager);

    // Create toolbar element
    this.element = document.createElement('div');
    this.element.className = 'viewport-toolbar';

    // Create drag handle
    this.dragHandle = document.createElement('div');
    this.dragHandle.className = 'toolbar-drag-handle';
    this.dragHandle.title = 'Drag to move toolbar';

    // Create toolbar sections
    const toolsSection = this.createToolsSection();
    const cameraSection = this.createCameraSection();
    const settingsSection = this.createSettingsSection();

    // Add sections to toolbar
    this.element.appendChild(this.dragHandle);
    this.element.appendChild(toolsSection);
    this.element.appendChild(this.createDivider());
    this.element.appendChild(cameraSection);
    this.element.appendChild(this.createDivider());
    this.element.appendChild(settingsSection);

    // Set up drag functionality
    this.setupDragFunctionality();

    // Add toolbar to container if provided, otherwise to document body
    if (options.container) {
      options.container.appendChild(this.element);
    } else {
      document.body.appendChild(this.element);
    }

    // Set up keyboard shortcuts
    this.setupKeyboardShortcuts();
  }

  /**
   * Creates a section divider
   */
  private createDivider(): HTMLElement {
    const divider = document.createElement('div');
    divider.className = 'toolbar-divider';
    return divider;
  }

  /**
   * Creates the tools section of the toolbar
   */
  private createToolsSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'toolbar-section';

    // Create tool buttons
    const selectButton = new ToolbarButton({
      icon: this.getToolIcon(ToolType.SELECT),
      tooltip: 'Select',
      shortcut: 'Q',
      active: this.activeTool === ToolType.SELECT,
      onClick: () => this.setActiveTool(ToolType.SELECT)
    });

    const moveButton = new ToolbarButton({
      icon: this.getToolIcon(ToolType.MOVE),
      tooltip: 'Move',
      shortcut: 'W',
      active: this.activeTool === ToolType.MOVE,
      onClick: () => this.setActiveTool(ToolType.MOVE)
    });

    const rotateButton = new ToolbarButton({
      icon: this.getToolIcon(ToolType.ROTATE),
      tooltip: 'Rotate',
      shortcut: 'E',
      active: this.activeTool === ToolType.ROTATE,
      onClick: () => this.setActiveTool(ToolType.ROTATE)
    });

    const scaleButton = new ToolbarButton({
      icon: this.getToolIcon(ToolType.SCALE),
      tooltip: 'Scale',
      shortcut: 'R',
      active: this.activeTool === ToolType.SCALE,
      onClick: () => this.setActiveTool(ToolType.SCALE)
    });

    // Store buttons for later reference
    this.toolButtons.set(ToolType.SELECT, selectButton);
    this.toolButtons.set(ToolType.MOVE, moveButton);
    this.toolButtons.set(ToolType.ROTATE, rotateButton);
    this.toolButtons.set(ToolType.SCALE, scaleButton);

    // Add buttons to section
    section.appendChild(selectButton.getElement());
    section.appendChild(moveButton.getElement());
    section.appendChild(rotateButton.getElement());
    section.appendChild(scaleButton.getElement());

    return section;
  }

  /**
   * Creates the camera section of the toolbar
   */
  private createCameraSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'toolbar-section';

    // Create camera buttons
    const resetButton = new ToolbarButton({
      icon: this.getCameraIcon('reset'),
      tooltip: 'Reset Camera',
      shortcut: 'Shift+R',
      onClick: () => this.cameraControls.resetCamera()
    });

    const perspectiveButton = new ToolbarButton({
      icon: this.getCameraIcon('perspective'),
      tooltip: 'Perspective View',
      shortcut: 'P',
      active: this.cameraControls.getCameraMode() === CameraMode.PERSPECTIVE,
      onClick: () => this.toggleCameraMode()
    });

    const topButton = new ToolbarButton({
      icon: this.getCameraIcon('top'),
      tooltip: 'Top View',
      shortcut: '0',
      onClick: () => this.cameraControls.setTopView()
    });

    const frontButton = new ToolbarButton({
      icon: this.getCameraIcon('front'),
      tooltip: 'Front View',
      shortcut: '1',
      onClick: () => this.cameraControls.setFrontView()
    });

    const sideButton = new ToolbarButton({
      icon: this.getCameraIcon('side'),
      tooltip: 'Side View',
      shortcut: '2',
      onClick: () => this.cameraControls.setSideView()
    });

    // Store buttons for later reference
    this.cameraButtons.set('reset', resetButton);
    this.cameraButtons.set('perspective', perspectiveButton);
    this.cameraButtons.set('top', topButton);
    this.cameraButtons.set('front', frontButton);
    this.cameraButtons.set('side', sideButton);

    // Add buttons to section
    section.appendChild(resetButton.getElement());
    section.appendChild(perspectiveButton.getElement());
    section.appendChild(topButton.getElement());
    section.appendChild(frontButton.getElement());
    section.appendChild(sideButton.getElement());

    return section;
  }

  /**
   * Creates the settings section of the toolbar
   */
  private createSettingsSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'toolbar-section';

    // Create settings buttons
    const gridButton = new ToolbarButton({
      icon: this.getSettingsIcon('grid'),
      tooltip: 'Toggle Grid',
      shortcut: 'G',
      active: this.showGrid,
      onClick: () => this.toggleGrid()
    });

    const snapButton = new ToolbarButton({
      icon: this.getSettingsIcon('snap'),
      tooltip: 'Toggle Snap to Grid',
      shortcut: 'Shift+S',
      active: this.snapToGrid,
      onClick: () => this.toggleSnap()
    });

    // Store buttons for later reference
    this.settingsButtons.set('grid', gridButton);
    this.settingsButtons.set('snap', snapButton);

    // Add buttons to section
    section.appendChild(gridButton.getElement());
    section.appendChild(snapButton.getElement());

    return section;
  }

  /**
   * Sets up keyboard shortcuts for toolbar actions
   */
  private setupKeyboardShortcuts(): void {
    window.addEventListener('keydown', (event) => {
      // Ignore if modifier keys are pressed (except for Shift)
      if (event.ctrlKey || event.altKey || event.metaKey) {
        return;
      }

      // Handle tool shortcuts
      switch (event.key.toLowerCase()) {
        case 'q':
          this.setActiveTool(ToolType.SELECT);
          event.preventDefault();
          break;
        case 'w':
          this.setActiveTool(ToolType.MOVE);
          event.preventDefault();
          break;
        case 'e':
          this.setActiveTool(ToolType.ROTATE);
          event.preventDefault();
          break;
        case 'r':
          if (!event.shiftKey) {
            this.setActiveTool(ToolType.SCALE);
            event.preventDefault();
          }
          break;
        case 'g':
          this.toggleGrid();
          event.preventDefault();
          break;
        case 's':
          if (event.shiftKey) {
            this.toggleSnap();
            event.preventDefault();
          }
          break;
      }
    });
  }

  /**
   * Sets the active tool
   * @param tool The tool to activate
   */
  public setActiveTool(tool: ToolType): void {
    // Deactivate current tool
    const currentToolButton = this.toolButtons.get(this.activeTool);
    if (currentToolButton) {
      currentToolButton.setActive(false);
    }

    // Activate new tool
    this.activeTool = tool;
    const newToolButton = this.toolButtons.get(tool);
    if (newToolButton) {
      newToolButton.setActive(true);
    }

    // Dispatch event for tool change
    const event = new CustomEvent('tool-changed', {
      detail: { tool }
    });
    window.dispatchEvent(event);

    console.log(`Active tool set to: ${tool}`);
  }

  /**
   * Toggles the camera mode between perspective and orthographic
   */
  private toggleCameraMode(): void {
    this.cameraControls.toggleCameraMode();

    // Update button state
    const perspectiveButton = this.cameraButtons.get('perspective');
    if (perspectiveButton) {
      perspectiveButton.setActive(
        this.cameraControls.getCameraMode() === CameraMode.PERSPECTIVE
      );
    }
  }

  /**
   * Toggles the grid visibility
   */
  private toggleGrid(): void {
    this.showGrid = !this.showGrid;

    // Update button state
    const gridButton = this.settingsButtons.get('grid');
    if (gridButton) {
      gridButton.setActive(this.showGrid);
    }

    // Toggle grid visibility in the scene
    const scene = this.graphicsManager.getScene();
    scene.traverse((object) => {
      if (object.name === 'grid') {
        object.visible = this.showGrid;
      }
    });

    // Dispatch event for grid visibility change
    const event = new CustomEvent('grid-changed', {
      detail: { visible: this.showGrid }
    });
    window.dispatchEvent(event);

    console.log(`Grid visibility: ${this.showGrid}`);
  }

  /**
   * Toggles snap to grid
   */
  private toggleSnap(): void {
    this.snapToGrid = !this.snapToGrid;

    // Update button state
    const snapButton = this.settingsButtons.get('snap');
    if (snapButton) {
      snapButton.setActive(this.snapToGrid);
    }

    // Dispatch event for snap change
    const event = new CustomEvent('snap-changed', {
      detail: { snapToGrid: this.snapToGrid }
    });
    window.dispatchEvent(event);

    console.log(`Snap to grid: ${this.snapToGrid}`);
  }

  /**
   * Gets the icon for a tool
   * @param tool The tool to get the icon for
   */
  private getToolIcon(tool: ToolType): string {
    // Simple SVG icons for tools
    switch (tool) {
      case ToolType.SELECT:
        return '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M7,2l12,11.2l-5.8,0.5l3.3,7.3l-2.2,1l-3.2-7.4L7,18.5V2"/></svg>';
      case ToolType.MOVE:
        return '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M13,6v5h5V7.75L22.25,12L18,16.25V13h-5v5h3.25L12,22.25L7.75,18H11v-5H6v3.25L1.75,12L6,7.75V11h5V6H7.75L12,1.75L16.25,6H13z"/></svg>';
      case ToolType.ROTATE:
        return '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12,5C16.97,5,21,9.03,21,14h-2c0-3.87-3.13-7-7-7s-7,3.13-7,7s3.13,7,7,7c3.09,0,5.72-2.01,6.63-4.79l1.88,0.53 C19.42,19.99,16,23,12,23c-4.97,0-9-4.03-9-9S7.03,5,12,5z M21.79,13l-1.32-0.88L19.79,11h-1.56l1.32-0.88L21.79,9l0.88,1.32 L24,11h-1.56l-0.88,1.12L21.79,13z"/></svg>';
      case ToolType.SCALE:
        return '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M9,1v2h6V1H9z M9,5v2h6V5H9z M16,9h-2v6h2V9z M20,9h-2v6h2V9z M4,9H2v6h2V9z M8,9H6v6h2V9z M9,16v2h6v-2H9z M9,20v2h6v-2H9z"/></svg>';
      default:
        return '';
    }
  }

  /**
   * Gets the icon for a camera control
   * @param control The camera control to get the icon for
   */
  private getCameraIcon(control: string): string {
    // Simple SVG icons for camera controls
    switch (control) {
      case 'reset':
        return '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12,5V1L7,6l5,5V7c3.31,0,6,2.69,6,6s-2.69,6-6,6s-6-2.69-6-6H4c0,4.42,3.58,8,8,8s8-3.58,8-8S16.42,5,12,5z"/></svg>';
      case 'perspective':
        return '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M13.05,9.79L10,7.5v9l3.05-2.29L16,12L13.05,9.79z M13.05,9.79L10,7.5v9l3.05-2.29L16,12L13.05,9.79z"/></svg>';
      case 'top':
        return '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12,8l-6,6h12L12,8z"/></svg>';
      case 'front':
        return '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M4,10h16v4H4V10z"/></svg>';
      case 'side':
        return '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M10,4v16h4V4H10z"/></svg>';
      default:
        return '';
    }
  }

  /**
   * Gets the icon for a settings control
   * @param setting The setting to get the icon for
   */
  private getSettingsIcon(setting: string): string {
    // Simple SVG icons for settings
    switch (setting) {
      case 'grid':
        return '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M20,2H4C2.9,2,2,2.9,2,4v16c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V4C22,2.9,21.1,2,20,2z M8,20H4v-4h4V20z M8,14H4v-4h4V14z M8,8H4V4h4V8z M14,20h-4v-4h4V20z M14,14h-4v-4h4V14z M14,8h-4V4h4V8z M20,20h-4v-4h4V20z M20,14h-4v-4h4V14z M20,8h-4V4h4V8z"/></svg>';
      case 'snap':
        return '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M17,7h-4v4h4V7z M17,13h-4v4h4V13z M7,7H3v4h4V7z M7,13H3v4h4V13z M17,1H7C5.9,1,5,1.9,5,3v2h2V3h10v18H7v-2H5v2c0,1.1,0.9,2,2,2h10c1.1,0,2-0.9,2-2V3C19,1.9,18.1,1,17,1z"/></svg>';
      default:
        return '';
    }
  }

  /**
   * Gets the active tool
   */
  public getActiveTool(): ToolType {
    return this.activeTool;
  }

  /**
   * Gets the camera controls
   */
  public getCameraControls(): CameraControls {
    return this.cameraControls;
  }

  /**
   * Gets the toolbar element
   */
  public getElement(): HTMLElement {
    return this.element;
  }

  /**
   * Gets whether the grid is visible
   */
  public isGridVisible(): boolean {
    return this.showGrid;
  }

  /**
   * Gets whether snap to grid is enabled
   */
  public isSnapToGridEnabled(): boolean {
    return this.snapToGrid;
  }

  /**
   * Sets up drag functionality for the toolbar
   */
  private setupDragFunctionality(): void {
    // Common function to start dragging
    const startDrag = (clientX: number, clientY: number) => {
      // Get the current position of the toolbar
      const computedStyle = window.getComputedStyle(this.element);
      const top = parseInt(computedStyle.top, 10);
      const right = parseInt(computedStyle.right, 10);

      // Store the initial position
      this.initialX = right;
      this.initialY = top;

      // Store the start position
      this.dragStartX = clientX;
      this.dragStartY = clientY;

      // Start dragging
      this.isDragging = true;
      this.hasMoved = false;

      // Add a class to indicate dragging state
      this.element.classList.add('dragging');
    };

    // Common function to move during drag
    const moveDrag = (clientX: number, clientY: number) => {
      if (!this.isDragging) return;

      // Calculate the new position
      const dx = clientX - this.dragStartX;
      const dy = clientY - this.dragStartY;

      // Check if the mouse/touch has moved significantly
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        this.hasMoved = true;
      }

      // Update the position (note: right position decreases as we move right)
      this.element.style.right = `${this.initialX - dx}px`;
      this.element.style.top = `${this.initialY + dy}px`;
    };

    // Common function to end dragging
    const endDrag = () => {
      if (!this.isDragging) return;

      // Stop dragging
      this.isDragging = false;

      // Remove the dragging class
      this.element.classList.remove('dragging');
    };

    // Mouse events
    this.dragHandle.addEventListener('mousedown', (e) => {
      // Only start dragging if it's a left-click
      if (e.button !== 0) return;

      // Prevent default behavior
      e.preventDefault();

      startDrag(e.clientX, e.clientY);
    });

    window.addEventListener('mousemove', (e) => {
      moveDrag(e.clientX, e.clientY);
    });

    window.addEventListener('mouseup', (e) => {
      if (!this.isDragging) return;

      // If the mouse has moved, prevent the click event
      if (this.hasMoved) {
        e.stopPropagation();
        e.preventDefault();
      }

      endDrag();
    });

    window.addEventListener('mouseleave', endDrag);

    // Touch events for mobile devices
    this.dragHandle.addEventListener('touchstart', (e) => {
      // Prevent default behavior (scrolling, zooming)
      e.preventDefault();

      if (e.touches.length === 1) {
        const touch = e.touches[0];
        startDrag(touch.clientX, touch.clientY);
      }
    });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        moveDrag(touch.clientX, touch.clientY);
      }
    });

    window.addEventListener('touchend', () => {
      endDrag();
    });

    window.addEventListener('touchcancel', endDrag);
  }
}
