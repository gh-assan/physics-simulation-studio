import { Logger } from '../../core/utils/Logger';

describe('Logger functionality', () => {
  it('should log messages to the console', () => {
    const logger = Logger.getInstance();
    logger.enable(); // Ensure logging is enabled
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {}); // Spy on console.log
    logger.log('Test message from LoggerTest.test.ts');
    expect(spy).toHaveBeenCalledWith('Test message from LoggerTest.test.ts');
    spy.mockRestore();
  });
});
