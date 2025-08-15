// Simple test module
exports.TestClass = class TestClass {
  constructor() {
    this.name = 'test';
  }
};

exports.testFunction = function() {
  return 'test';
};

console.log('Test module loaded!');
