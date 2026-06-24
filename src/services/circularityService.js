const EPS = 1e-6;

function calculateCircularityScore({ farm, month = null }) {
  let localTotal = 0;
  let externalTotal = 0;

  farm.resources.forEach(r => {
    const qty = month ? r.availableInMonth(month) : r.quantity;
    if (r.type === 'local') localTotal += qty;
    else externalTotal += qty;
  });

  const ratio = localTotal / (externalTotal + EPS);
  const score = Math.round(Math.min(100, (ratio / (1 + ratio)) * 100));

  const message = `Score d'autonomie circulaire: ${score}/100. Ratio ressources locales/intrants externes = ${ratio.toFixed(2)}.`;

  return { score, ratio, localTotal, externalTotal, message };
}

module.exports = { calculateCircularityScore };
