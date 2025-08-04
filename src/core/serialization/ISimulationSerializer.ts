export interface ISimulationSerializer {
  serialize(simulation: any): string;
  deserialize(data: string): any;
}
