class MicroTransformation {
  constructor({ id, name, capacity = 0, installationCost = 0, profitability = 0, inputs = [], outputs = [], energyRequirement = 0 }) {
    this.id = id || `${name}-${Date.now()}`;
    this.name = name;
    this.capacity = capacity;
    this.installationCost = installationCost;
    this.profitability = profitability;
    this.inputs = inputs;
    this.outputs = outputs;
    this.energyRequirement = energyRequirement;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      capacity: this.capacity,
      installationCost: this.installationCost,
      profitability: this.profitability,
      inputs: this.inputs,
      outputs: this.outputs,
      energyRequirement: this.energyRequirement,
    };
  }
}

module.exports = MicroTransformation;
