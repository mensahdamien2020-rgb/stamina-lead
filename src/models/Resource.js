class Resource {
  constructor({ id, name, type = 'local', quantity = 0, unit = 'kg', seasonality = null }) {
    this.id = id || `${name}-${Date.now()}`;
    this.name = name;
    this.type = type;
    this.quantity = quantity;
    this.unit = unit;
    this.seasonality = seasonality;
  }

  availableInMonth(month) {
    if (!this.seasonality) return this.quantity;
    const factor = this.seasonality[String(month)] ?? 0;
    return this.quantity * factor;
  }
}

module.exports = Resource;
