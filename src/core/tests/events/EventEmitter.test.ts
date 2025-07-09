import { EventEmitter } from "../../events/EventEmitter";

describe("EventEmitter", () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  it("should register and trigger event listeners", () => {
    const mockListener = jest.fn();
    emitter.on("testEvent", mockListener);

    emitter.emit("testEvent", "arg1", "arg2");

    expect(mockListener).toHaveBeenCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith("arg1", "arg2");
  });

  it("should allow removing event listeners", () => {
    const mockListener = jest.fn();
    emitter.on("testEvent", mockListener);

    emitter.off("testEvent", mockListener);
    emitter.emit("testEvent");

    expect(mockListener).not.toHaveBeenCalled();
  });

  it("should not fail when emitting an event with no listeners", () => {
    // This should not throw an error
    expect(() => {
      emitter.emit("nonExistentEvent");
    }).not.toThrow();
  });
});
