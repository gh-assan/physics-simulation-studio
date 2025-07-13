export class ApplicationEventBus {
  dispatch(event: Event): void {
    window.dispatchEvent(event);
  }
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    window.addEventListener(type, listener);
  }
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    window.removeEventListener(type, listener);
  }
}
