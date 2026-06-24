const TOGO_SEASONS = {
  default: {
    '1': 0.6, '2': 0.5, '3': 0.4, '4': 0.7, '5': 0.9, '6': 0.9,
    '7': 0.8, '8': 0.6, '9': 0.7, '10': 0.8, '11': 0.6, '12': 0.5,
  }
};

function getAvailabilityFactor(resource, month, region = 'default') {
  if (resource.seasonality && resource.seasonality[String(month)] != null) {
    return resource.seasonality[String(month)];
  }
  return TOGO_SEASONS[region]?.[String(month)] ?? 0.5;
}

function simulateResourceAvailability(resource, month, region = 'default') {
  const factor = getAvailabilityFactor(resource, month, region);
  return resource.quantity * factor;
}

module.exports = { getAvailabilityFactor, simulateResourceAvailability };
