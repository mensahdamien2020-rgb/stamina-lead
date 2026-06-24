class Process {
  constructor({ id, name, inputs = [], outputs = [], transformation = null }) {
    this.id = id || `${name}-${Date.now()}`;
    this.name = name;
    this.inputs = inputs;
    this.outputs = outputs;
    this.transformation = transformation;
  }

  getOutputByResource(resourceName) {
    return this.outputs.find(o => o.resourceName === resourceName);
  }
}

module.exports = Process;
