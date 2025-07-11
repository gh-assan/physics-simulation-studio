export class PhysicsParameter {
  private _value: number;

  constructor(public initialValue: number, public min: number, public max: number, public step: number) {
    this._value = this.clamp(initialValue);
  }

  get value(): number {
    return this._value;
  }

  set value(newValue: number) {
    this._value = this.clamp(newValue);
  }

  private clamp(val: number): number {
    return Math.max(this.min, Math.min(val, this.max));
  }

  // Method to get the raw value (useful for calculations)
  get(): number {
    return this._value;
  }

  // Method to set the value with clamping
  set(newValue: number): void {
    this.value = newValue;
  }
}
