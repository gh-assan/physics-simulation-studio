export interface ISimulationOrchestrator {
    loadSimulation(pluginName: string): Promise<void>;
    unloadSimulation(activePluginName: string): void;
    play(): void;
    pause(): void;
    reset(): void;
    stepSimulation(deltaTime: number): void;
    setRenderSystem(renderSystem: any): void;
}
