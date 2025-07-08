import { Pane, FolderApi } from 'tweakpane';
import { UIManager as IUIManager } from '@core/plugin';

export class StudioUIManager implements IUIManager {
    private pane: Pane;
    private container: HTMLElement;
    private folders: Map<string, FolderApi> = new Map();

    constructor() {
        this.container = document.getElementById('tweakpane-container') as HTMLElement;
        if (!this.container) {
            console.error("Tweakpane container not found!");
            this.container = document.body; // Fallback
        }
        this.pane = new Pane({ container: this.container });
    }

    // This method will be expanded to register controls for components
    public registerComponentControls(componentName: string, obj: any): void {
        const folder: FolderApi = (this.pane as any).addFolder({ title: componentName });
        this.folders.set(componentName, folder);
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                // Basic control for numbers and booleans for now
                if (typeof obj[key] === 'number') {
                    folder.addBinding(obj, key);
                } else if (typeof obj[key] === 'boolean') {
                    folder.addBinding(obj, key);
                }
            }
        }
    }

    public clearControls(): void {
        this.folders.forEach(folder => folder.dispose());
        this.folders.clear();
    }
}