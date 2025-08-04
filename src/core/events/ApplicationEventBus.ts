import { EventEmitter } from "./EventEmitter";

export enum ApplicationEvent {
  SIMULATION_PLAY = "simulation:play",
  SIMULATION_PAUSE = "simulation:pause",
  SIMULATION_LOADED = "simulation:loaded",
}

import { IApplicationEventBus } from "./IApplicationEventBus";

class ApplicationEventBus extends EventEmitter implements IApplicationEventBus {
  private static instance: ApplicationEventBus;

  private constructor() {
    super();
  }

  public static getInstance(): ApplicationEventBus {
    if (!ApplicationEventBus.instance) {
      ApplicationEventBus.instance = new ApplicationEventBus();
    }
    return ApplicationEventBus.instance;
  }

  public dispatch(event: ApplicationEvent, detail?: any): void {
    this.emit(event, detail);
  }
}

export const eventBus = ApplicationEventBus.getInstance();
