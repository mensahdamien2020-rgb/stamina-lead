const Resource = require('./Resource');

class Farm {
  constructor({ id, name, location = {}, resources = [], processes = [], externalInputs = [] }) {
    this.id = id || `${name}-${Date.now()}`;
    this.name = name;
    this.location = location;
    this.resources = resources.map(r => (r instanceof Resource ? r : new Resource(r)));
    this.processes = processes;
    this.externalInputs = externalInputs;
  }

  getLocalResources() {
    return this.resources.filter(r => r.type === 'local');
  }

  getExternalInputs() {
    return this.resources.filter(r => r.type === 'external' || this.externalInputs.some(e => e.name === r.name));
  }
}

module.exports = Farm;
