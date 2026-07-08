/**
 * Calcule l'impact logistique sur la résilience
 * @param {number} transportCost - Coût total de transport
 * @param {string} circuit - Type de circuit (local, regional, export)
 */
function calculateLogisticImpact(transportCost, circuit) {
    let circuitMultiplier = 1.0;

    // Ajustement du multiplicateur selon le circuit
    if (circuit === 'local') circuitMultiplier = 1.2;
    else if (circuit === 'regional') circuitMultiplier = 0.9;
    else if (circuit === 'export') circuitMultiplier = 0.7;

    // Plus le coût est élevé, plus l'impact est négatif
    const impactScore = (100000 / (transportCost + 1000)) * circuitMultiplier;

    return {
        impactScore: Math.min(impactScore, 100).toFixed(2),
        circuit: circuit
    };
}

module.exports = { calculateLogisticImpact };
