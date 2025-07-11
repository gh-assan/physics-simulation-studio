/**
 * ToolbarButton.ts
 *
 * A reusable button component for the viewport toolbar with support for
 * hover, active, and disabled states.
 */

export interface ToolbarButtonOptions {
  icon?: string;       // Icon URL or SVG content
  label?: string;      // Text label for the button
  tooltip?: string;    // Tooltip text
  shortcut?: string;   // Keyboard shortcut (displayed in tooltip)
  onClick?: () => void; // Click handler
  active?: boolean;    // Whether the button is active (toggled on)
  disabled?: boolean;  // Whether the button is disabled
}

export class ToolbarButton {
  private element: HTMLElement;
  private iconElement: HTMLElement | null = null;
  private labelElement: HTMLElement | null = null;
  private options: ToolbarButtonOptions;
  private _active = false;
  private _disabled = false;

  constructor(options: ToolbarButtonOptions) {
    this.options = options;
    this._active = options.active || false;
    this._disabled = options.disabled || false;

    // Create button element
    this.element = document.createElement('div');
    this.element.className = 'toolbar-button';

    // Add icon if provided
    if (options.icon) {
      this.iconElement = document.createElement('div');
      this.iconElement.className = 'toolbar-button-icon';

      // Check if the icon is an SVG string or a URL
      if (options.icon.trim().startsWith('<svg')) {
        this.iconElement.innerHTML = options.icon;
      } else {
        const img = document.createElement('img');
        img.src = options.icon;
        img.alt = options.label || '';
        this.iconElement.appendChild(img);
      }

      this.element.appendChild(this.iconElement);
    }

    // Add label if provided
    if (options.label) {
      this.labelElement = document.createElement('div');
      this.labelElement.className = 'toolbar-button-label';
      this.labelElement.textContent = options.label;
      this.element.appendChild(this.labelElement);
    }

    // Add tooltip if provided
    if (options.tooltip) {
      let tooltipText = options.tooltip;

      // Add shortcut to tooltip if provided
      if (options.shortcut) {
        tooltipText += ` (${options.shortcut})`;
      }

      this.element.title = tooltipText;
    }

    // Set initial states
    if (this._active) {
      this.element.classList.add('active');
    }

    if (this._disabled) {
      this.element.classList.add('disabled');
    } else {
      // Add click handler if not disabled
      this.element.addEventListener('click', this._handleClick.bind(this));
    }

    // Add hover effects
    this.element.addEventListener('mouseenter', this._handleMouseEnter.bind(this));
    this.element.addEventListener('mouseleave', this._handleMouseLeave.bind(this));
  }

  /**
   * Handles click events on the button
   */
  private _handleClick(event: MouseEvent): void {
    if (this._disabled) return;

    if (this.options.onClick) {
      this.options.onClick();
    }

    // Prevent event propagation
    event.stopPropagation();
  }

  /**
   * Handles mouse enter events for hover effects
   */
  private _handleMouseEnter(): void {
    if (!this._disabled) {
      this.element.classList.add('hover');
    }
  }

  /**
   * Handles mouse leave events for hover effects
   */
  private _handleMouseLeave(): void {
    this.element.classList.remove('hover');
  }

  /**
   * Gets the DOM element for the button
   */
  public getElement(): HTMLElement {
    return this.element;
  }

  /**
   * Sets the active state of the button
   */
  public setActive(active: boolean): void {
    this._active = active;

    if (active) {
      this.element.classList.add('active');
    } else {
      this.element.classList.remove('active');
    }
  }

  /**
   * Gets the active state of the button
   */
  public isActive(): boolean {
    return this._active;
  }

  /**
   * Sets the disabled state of the button
   */
  public setDisabled(disabled: boolean): void {
    this._disabled = disabled;

    if (disabled) {
      this.element.classList.add('disabled');
      this.element.removeEventListener('click', this._handleClick.bind(this));
    } else {
      this.element.classList.remove('disabled');
      this.element.addEventListener('click', this._handleClick.bind(this));
    }
  }

  /**
   * Gets the disabled state of the button
   */
  public isDisabled(): boolean {
    return this._disabled;
  }

  /**
   * Updates the button options
   */
  public updateOptions(options: Partial<ToolbarButtonOptions>): void {
    this.options = { ...this.options, ...options };

    // Update icon if provided
    if (options.icon && this.iconElement) {
      if (options.icon.trim().startsWith('<svg')) {
        this.iconElement.innerHTML = options.icon;
      } else {
        const img = this.iconElement.querySelector('img');
        if (img) {
          img.src = options.icon;
          img.alt = this.options.label || '';
        }
      }
    }

    // Update label if provided
    if (options.label && this.labelElement) {
      this.labelElement.textContent = options.label;
    }

    // Update tooltip if provided
    if (options.tooltip) {
      let tooltipText = options.tooltip;

      // Add shortcut to tooltip if provided
      if (this.options.shortcut) {
        tooltipText += ` (${this.options.shortcut})`;
      }

      this.element.title = tooltipText;
    }

    // Update active state if provided
    if (options.active !== undefined) {
      this.setActive(options.active);
    }

    // Update disabled state if provided
    if (options.disabled !== undefined) {
      this.setDisabled(options.disabled);
    }
  }
}
