export class WindowResizeHandler {
    private callback: () => void;

    constructor(callback: () => void) {
        this.callback = callback;
        window.addEventListener('resize', this.callback);
    }

    dispose() {
        window.removeEventListener('resize', this.callback);
    }
}
