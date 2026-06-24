function logisticProfitabilityAnalysis({ transportCostPerUnit = 0, distance = 0, substitutionSavingsPerUnit = 0, units = 0 }) {
  const totalTransportCost = transportCostPerUnit * distance * units;
  const totalSavings = substitutionSavingsPerUnit * units;
  const net = totalSavings - totalTransportCost;

  const recommendation = net >= 0 ? 'substitution_recommandee' : 'substitution_non_rentable';

  const message = net >= 0
    ? `Économies potentielles: ${totalSavings.toFixed(2)}. Coût transport: ${totalTransportCost.toFixed(2)}. Substitution rentable.`
    : `Économies potentielles: ${totalSavings.toFixed(2)}. Coût transport: ${totalTransportCost.toFixed(2)}. Substitution non rentable.`;

  return { totalTransportCost, totalSavings, net, recommendation, message };
}

module.exports = { logisticProfitabilityAnalysis };
