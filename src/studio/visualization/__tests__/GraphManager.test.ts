/**
 * GraphManager Tests - Phase 6
 *
 * Comprehensive tests for the GraphManager visualization system.
 */

import { GraphManager, IGraphConfig, IDataPoint } from '../GraphManager';

// Mock Chart.js for testing
jest.mock('chart.js', () => ({
  Chart: class MockChart {
    data: any;
    options: any;

    constructor(canvas: any, config: any) {
      this.data = config.data;
      this.options = config.options;
    }

    update = jest.fn();
    resize = jest.fn();
    destroy = jest.fn();
    toBase64Image = jest.fn().mockReturnValue('data:image/png;base64,mock');

    static register = jest.fn();
  },
  registerables: [],
  ChartConfiguration: {},
  ChartOptions: {},
  ChartData: {},
  ChartType: {},
  ChartDataset: {}
}));

// Mock canvas element
const createMockCanvas = (): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  return canvas;
};

describe('GraphManager', () => {
  let graphManager: GraphManager;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    graphManager = new GraphManager({
      defaultMaxDataPoints: 100,
      defaultUpdateFrequency: 10,
      enableAnimations: false,
      theme: 'light'
    });
    mockCanvas = createMockCanvas();
  });

  afterEach(() => {
    graphManager.dispose();
  });

  describe('Graph Registration', () => {
    it('should register a new graph', () => {
      const config: IGraphConfig = {
        id: 'test-graph',
        title: 'Test Graph',
        type: 'line',
        container: mockCanvas
      };

      const result = graphManager.registerGraph(config);
      expect(result).toBe(true);

      const graph = graphManager.getGraph('test-graph');
      expect(graph).toBeTruthy();
      expect(graph?.id).toBe('test-graph');
    });

    it('should not register duplicate graphs', () => {
      const config: IGraphConfig = {
        id: 'test-graph',
        title: 'Test Graph',
        type: 'line',
        container: mockCanvas
      };

      graphManager.registerGraph(config);
      const result = graphManager.registerGraph(config);
      expect(result).toBe(false);
    });

    it('should unregister a graph', () => {
      const config: IGraphConfig = {
        id: 'test-graph',
        title: 'Test Graph',
        type: 'line',
        container: mockCanvas
      };

      graphManager.registerGraph(config);
      const result = graphManager.unregisterGraph('test-graph');
      expect(result).toBe(true);

      const graph = graphManager.getGraph('test-graph');
      expect(graph).toBeNull();
    });
  });

  describe('Data Management', () => {
    beforeEach(() => {
      const config: IGraphConfig = {
        id: 'test-graph',
        title: 'Test Graph',
        type: 'line',
        container: mockCanvas
      };
      graphManager.registerGraph(config);
    });

    it('should add data points', () => {
      const dataPoint: IDataPoint = {
        x: 1,
        y: 10,
        timestamp: Date.now()
      };

      const result = graphManager.addDataPoint('test-graph', 'dataset1', dataPoint);
      expect(result).toBe(true);
    });

    it('should handle invalid graph ID', () => {
      const dataPoint: IDataPoint = {
        x: 1,
        y: 10,
        timestamp: Date.now()
      };

      const result = graphManager.addDataPoint('invalid-graph', 'dataset1', dataPoint);
      expect(result).toBe(false);
    });

    it('should maintain buffer size limits', () => {
      const maxPoints = 5;
      const config: IGraphConfig = {
        id: 'limited-graph',
        title: 'Limited Graph',
        type: 'line',
        container: createMockCanvas(),
        maxDataPoints: maxPoints
      };

      graphManager.registerGraph(config);

      // Add more points than the limit
      for (let i = 0; i < maxPoints + 3; i++) {
        const dataPoint: IDataPoint = {
          x: i,
          y: i * 2,
          timestamp: Date.now() + i
        };
        graphManager.addDataPoint('limited-graph', 'dataset1', dataPoint);
      }

      const graph = graphManager.getGraph('limited-graph');
      const buffer = graph?.dataBuffer.get('dataset1');
      expect(buffer?.length).toBe(maxPoints);
    });

    it('should clear graph data', () => {
      // Add some data first
      const dataPoint: IDataPoint = {
        x: 1,
        y: 10,
        timestamp: Date.now()
      };
      graphManager.addDataPoint('test-graph', 'dataset1', dataPoint);

      const result = graphManager.clearGraph('test-graph');
      expect(result).toBe(true);

      const graph = graphManager.getGraph('test-graph');
      expect(graph?.dataBuffer.size).toBe(0);
    });
  });

  describe('Graph Updates', () => {
    beforeEach(() => {
      const config: IGraphConfig = {
        id: 'test-graph',
        title: 'Test Graph',
        type: 'line',
        container: mockCanvas
      };
      graphManager.registerGraph(config);
    });

    it('should update a single graph', () => {
      const dataPoint: IDataPoint = {
        x: 1,
        y: 10,
        timestamp: Date.now()
      };
      graphManager.addDataPoint('test-graph', 'dataset1', dataPoint);

      const result = graphManager.updateGraph('test-graph');
      expect(result).toBe(true);

      const graph = graphManager.getGraph('test-graph');
      expect(graph?.chart.update).toHaveBeenCalled();
    });

    it('should update all graphs', () => {
      // Register another graph
      const config2: IGraphConfig = {
        id: 'test-graph-2',
        title: 'Test Graph 2',
        type: 'bar',
        container: createMockCanvas()
      };
      graphManager.registerGraph(config2);

      // Add data to both graphs
      const dataPoint: IDataPoint = {
        x: 1,
        y: 10,
        timestamp: Date.now()
      };
      graphManager.addDataPoint('test-graph', 'dataset1', dataPoint);
      graphManager.addDataPoint('test-graph-2', 'dataset1', dataPoint);

      graphManager.updateAllGraphs();

      const graph1 = graphManager.getGraph('test-graph');
      const graph2 = graphManager.getGraph('test-graph-2');

      expect(graph1?.chart.update).toHaveBeenCalled();
      expect(graph2?.chart.update).toHaveBeenCalled();
    });
  });

  describe('Graph Control', () => {
    beforeEach(() => {
      const config: IGraphConfig = {
        id: 'test-graph',
        title: 'Test Graph',
        type: 'line',
        container: mockCanvas
      };
      graphManager.registerGraph(config);
    });

    it('should start and stop graph updates', () => {
      graphManager.start();
      expect(graphManager.getStatus().isRunning).toBe(true);

      graphManager.stop();
      expect(graphManager.getStatus().isRunning).toBe(false);
    });

    it('should export graph as image', () => {
      const result = graphManager.exportGraph('test-graph', 'png');
      expect(result).toBe('data:image/png;base64,mock');
    });

    it('should handle export of non-existent graph', () => {
      const result = graphManager.exportGraph('invalid-graph', 'png');
      expect(result).toBeNull();
    });
  });

  describe('Status and Monitoring', () => {
    it('should return correct status', () => {
      const status = graphManager.getStatus();

      expect(status).toHaveProperty('graphCount');
      expect(status).toHaveProperty('activeGraphs');
      expect(status).toHaveProperty('memoryUsage');
      expect(status).toHaveProperty('averageRenderTime');
      expect(status).toHaveProperty('frameCount');
      expect(status).toHaveProperty('isRunning');
    });

    it('should track memory usage', () => {
      const config: IGraphConfig = {
        id: 'memory-test-graph',
        title: 'Memory Test Graph',
        type: 'line',
        container: createMockCanvas()
      };
      graphManager.registerGraph(config);

      // Add many data points
      for (let i = 0; i < 100; i++) {
        const dataPoint: IDataPoint = {
          x: i,
          y: Math.random() * 100,
          timestamp: Date.now() + i
        };
        graphManager.addDataPoint('memory-test-graph', 'dataset1', dataPoint);
      }

      const status = graphManager.getStatus();
      // Memory usage should be tracked (even if minimal in test environment)
      expect(status.memoryUsage).toBeGreaterThanOrEqual(0);

      // Verify that the graph has data
      const graph = graphManager.getGraph('memory-test-graph');
      const buffer = graph?.dataBuffer.get('dataset1');
      expect(buffer?.length).toBe(100);
    });
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const defaultManager = new GraphManager();
      const status = defaultManager.getStatus();

      expect(status.graphCount).toBe(0);
      expect(status.isRunning).toBe(false);

      defaultManager.dispose();
    });

    it('should use custom configuration', () => {
      const customManager = new GraphManager({
        defaultMaxDataPoints: 500,
        defaultUpdateFrequency: 60,
        enableAnimations: true,
        theme: 'dark',
        memoryLimit: 50
      });

      expect(customManager).toBeDefined();
      customManager.dispose();
    });
  });

  describe('Error Handling', () => {
    it('should handle canvas element not found', () => {
      const config: IGraphConfig = {
        id: 'invalid-canvas-graph',
        title: 'Invalid Canvas Graph',
        type: 'line',
        container: 'non-existent-canvas-id'
      };

      const result = graphManager.registerGraph(config);
      expect(result).toBe(false);
    });

    it('should handle data point errors gracefully', () => {
      const config: IGraphConfig = {
        id: 'error-test-graph',
        title: 'Error Test Graph',
        type: 'line',
        container: mockCanvas
      };
      graphManager.registerGraph(config);

      // Add invalid data point
      const invalidDataPoint = {
        x: 'invalid',
        y: NaN,
        timestamp: 'invalid'
      } as any;

      // Should not crash
      expect(() => {
        graphManager.addDataPoint('error-test-graph', 'dataset1', invalidDataPoint);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const config: IGraphConfig = {
        id: 'performance-graph',
        title: 'Performance Graph',
        type: 'line',
        container: createMockCanvas(),
        maxDataPoints: 1000
      };
      graphManager.registerGraph(config);

      const startTime = performance.now();

      // Add 1000 data points
      for (let i = 0; i < 1000; i++) {
        const dataPoint: IDataPoint = {
          x: i,
          y: Math.sin(i * 0.1) * 100,
          timestamp: Date.now() + i
        };
        graphManager.addDataPoint('performance-graph', 'dataset1', dataPoint);
      }

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Should complete within reasonable time (1 second)
      expect(executionTime).toBeLessThan(1000);
    });

    it('should maintain performance with multiple graphs', () => {
      const graphCount = 10;
      const dataPointsPerGraph = 100;

      // Create multiple graphs
      for (let i = 0; i < graphCount; i++) {
        const config: IGraphConfig = {
          id: `perf-graph-${i}`,
          title: `Performance Graph ${i}`,
          type: 'line',
          container: createMockCanvas()
        };
        graphManager.registerGraph(config);
      }

      const startTime = performance.now();

      // Add data to all graphs
      for (let i = 0; i < graphCount; i++) {
        for (let j = 0; j < dataPointsPerGraph; j++) {
          const dataPoint: IDataPoint = {
            x: j,
            y: Math.random() * 100,
            timestamp: Date.now() + j
          };
          graphManager.addDataPoint(`perf-graph-${i}`, 'dataset1', dataPoint);
        }
      }

      // Update all graphs
      graphManager.updateAllGraphs();

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Should complete within reasonable time
      expect(executionTime).toBeLessThan(2000);
    });
  });
});
