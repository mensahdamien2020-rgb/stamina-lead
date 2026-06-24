const { calculateCircularityScore } = require('../services/circularityService');
const { logisticProfitabilityAnalysis } = require('../services/logisticService');

/**
 * Parse decimal values accepting both comma and dot as decimal separator
 * Rigorous cleaning for FCFA inputs
 * @param {*} value - Value to parse
 * @returns {number} - Parsed decimal number or 0
 */
function parseDecimal(value) {
  if (value === null || value === undefined || value === '') return 0;
  // Remove all spaces, then replace comma with dot
  let normalized = String(value).trim().replace(/\s+/g, '').replace(/,/g, '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format number as FCFA currency
 * @param {number} value - Value to format
 * @returns {string} - Formatted FCFA string
 */
function formatFCFA(value) {
  return Math.round(value).toLocaleString('fr-FR') + ' FCFA';
}

/**
 * Calculate market circuit logistics losses
 * @param {string} circuit - Market circuit type
 * @returns {number} - Loss percentage (0-100)
 */
function getCircuitLossPercentage(circuit) {
  const losses = {
    'farm-gate': 5,      // Minimal handling losses
    'local-market': 15,  // Transport + market handling
    'agro-industry': 8,  // Standardized handling
  };
  return losses[circuit] || 0;
}

/**
 * Calculate integrated ecosystem audit with FCFA Togolese context
 * @param {Object} auditData - Audit data from form
 * @returns {Object} - Comprehensive diagnostic report
 */
function runMultiSpeculationAudit(auditData) {
  const {
    farmName,
    vegetation,
    livestock,
    circularity,
    economic,
  } = auditData;

  // ========== PARSE ALL INPUTS WITH RIGOROUS DECIMAL HANDLING ==========
  const vegArea = parseDecimal(vegetation?.area);
  const vegYield = parseDecimal(vegetation?.yield);
  const vegPrice = parseDecimal(vegetation?.price);
  const vegHarvestLoss = parseDecimal(vegetation?.harvestLoss);
  const marketCircuit = vegetation?.marketCircuit || 'local-market';
  const transportCost = parseDecimal(vegetation?.transportCost);

  const livestockCount = parseDecimal(livestock?.count);
  const livestockFeedCostMonthly = parseDecimal(livestock?.feedCostMonthly);
  const livestockMortalityRate = parseDecimal(livestock?.mortalityRate);
  const livestockManure = parseDecimal(livestock?.manure);

  const residueVolume = parseDecimal(circularity?.residueVolume);
  const msnSynergy = circularity?.msnLivestockSynergy === true;

  const labourCost = parseDecimal(economic?.labourCost);
  const fertiliserCostAnnual = parseDecimal(economic?.fertiliserCost);

  // ============ VEGETABLE PRODUCTION ANALYSIS IN FCFA ============
  const totalProduction = vegArea * vegYield; // tonnes
  const productionKg = totalProduction * 1000; // kg
  
  // Calculate losses based on market circuit
  const circuitLossPercent = getCircuitLossPercentage(marketCircuit);
  const harvestedKgBeforeCircuit = productionKg * (1 - vegHarvestLoss / 100);
  const harvestedKgAfterCircuit = harvestedKgBeforeCircuit * (1 - circuitLossPercent / 100);
  
  const potentialRevenueBeforeCircuit = harvestedKgBeforeCircuit * vegPrice; // Per unit price
  const actualRevenue = harvestedKgAfterCircuit * vegPrice; // Per unit price
  
  // Logistic losses: field losses + circuit handling losses
  const fieldLossesKg = productionKg * (vegHarvestLoss / 100);
  const circuitLossesKg = harvestedKgBeforeCircuit * (circuitLossPercent / 100);
  const totalLogisticLossesValue = (fieldLossesKg + circuitLossesKg) * vegPrice; // Per unit
  
  const vegetalAnalysis = vegArea > 0
    ? `Production : ${totalProduction.toFixed(2)} t. Récolte vendable : ${harvestedKgAfterCircuit.toFixed(0)} kg. Circuit : ${marketCircuit === 'farm-gate' ? 'Bord de champ' : marketCircuit === 'local-market' ? 'Marché local' : 'Agro-industrie'}. Revenus potentiels : ${formatFCFA(actualRevenue)}.`
    : 'Aucune données sur la production végétale fournie.';

  // ============ LIVESTOCK ANALYSIS IN FCFA ============
  let livestockAnalysis = 'Aucune données sur l\'élevage fournie.';
  let livestockFoodAutonomy = 0;
  let livestockFeedCostAdjusted = livestockFeedCostMonthly;
  let annualLivestockFeedCost = livestockFeedCostMonthly * 12;
  let manureSavingsPotential = 0;

  if (livestockCount > 0) {
    // If MSN synergy is enabled, reduce feed costs by 35%
    if (msnSynergy) {
      livestockFeedCostAdjusted = livestockFeedCostMonthly * 0.65; // 35% reduction
      livestockFoodAutonomy = 35;
    }

    annualLivestockFeedCost = livestockFeedCostAdjusted * 12;
    
    // Potential savings from manure value (simplified: 10 FCFA/kg typical value)
    manureSavingsPotential = livestockManure * 12 * 10; // kg/month * 12 months * unit value
    
    livestockAnalysis = `Effectif : ${Math.round(livestockCount)} têtes. Déjections : ${livestockManure.toFixed(0)} kg/mois. Coût alimentaire mensuel : ${formatFCFA(livestockFeedCostAdjusted)} (${msnSynergy ? 'réduit 35% MSN' : 'standard'}). Coût annuel : ${formatFCFA(annualLivestockFeedCost)}. Mortalité : ${livestockMortalityRate}%.`;
  }

  // ============ CIRCULARITY ANALYSIS ============
  let circularityAnalysis = 'Aucune valorisation circulaire renseignée.';
  let circularityScore = 0;
  let potentialFertiliserSavings = 0;

  if (residueVolume > 0) {
    const valorisationType = circularity?.valorisationType || 'compost';
    const typeName = valorisationType === 'msn' ? 'Larves MSN' : 'Compost';
    
    const residueRatio = Math.min((residueVolume / (vegArea * 1000)) * 100, 100);
    circularityScore = Math.min(residueRatio * 0.8, 100);
    
    // Estimate fertiliser savings: assume 15 FCFA/kg compost value
    potentialFertiliserSavings = residueVolume * 15;
    
    circularityAnalysis = `Volume valorisé : ${residueVolume.toFixed(0)} kg en ${typeName}. Économies engrais potentielles : ${formatFCFA(potentialFertiliserSavings)}. Score circularité : ${circularityScore.toFixed(1)}/100.`;
  }

  // ============ ECONOMIC ANALYSIS IN FCFA ============
  // Calculate Economic Sovereignty Index based on fertiliser substitution
  const currentFertiliserSpend = fertiliserCostAnnual > 0 ? fertiliserCostAnnual : 0;
  const totalPotentialFertiliserSubstitution = potentialFertiliserSavings + manureSavingsPotential;
  const economicSovereigntyIndex = currentFertiliserSpend > 0
    ? Math.min((totalPotentialFertiliserSubstitution / currentFertiliserSpend) * 100, 100)
    : (totalPotentialFertiliserSubstitution > 0 ? 100 : 0);

  const economicAnalysis = `Revenu brut potentiel : ${formatFCFA(actualRevenue)}. Dépenses annuelles - Transport : ${formatFCFA(transportCost * 12)}, Main-d'oeuvre : ${formatFCFA(labourCost * 12)}, Engrais : ${formatFCFA(currentFertiliserSpend)}, Alimentation bétail : ${formatFCFA(annualLivestockFeedCost)}. Souveraineté économique (substitution engrais) : ${economicSovereigntyIndex.toFixed(1)}%.`;

  // ============ CALCULATE REAL NET MARGIN (FCFA) ============
  const totalAnnualTransportCost = transportCost * 12;
  const totalAnnualLabourCost = labourCost * 12;
  const totalCosts = totalAnnualTransportCost + totalAnnualLabourCost + currentFertiliserSpend + annualLivestockFeedCost;
  const netRealMargin = actualRevenue - totalCosts;

  // ============ CALCULATE TOTAL LOGISTIC LOSSES ============
  const logisticLosses = totalLogisticLossesValue + (transportCost * 12);

  // ============ RESILIENCE SCORE ============
  let resilienceScore = 50; // Base score

  if (vegArea >= 2) resilienceScore += 10;
  if (vegYield >= 1.5) resilienceScore += 8;
  if (vegHarvestLoss <= 15) resilienceScore += 12;
  if (circuitLossPercent <= 8) resilienceScore += 10; // Good circuit choice
  
  if (livestockCount > 0) {
    resilienceScore += 10;
    if (livestockMortalityRate <= 5) resilienceScore += 8;
    if (msnSynergy) resilienceScore += 15;
  }

  if (residueVolume > 0) resilienceScore += 10;
  if (economicSovereigntyIndex >= 50) resilienceScore += 15;
  if (netRealMargin > 0) resilienceScore += 10;

  resilienceScore = Math.min(resilienceScore, 100);

  // ============ RECOMMENDATIONS ============
  const recommendations = [];

  if (vegHarvestLoss > 20) {
    recommendations.push(`Réduire les pertes récolte (${vegHarvestLoss}%) : installer cellier ou Zeer. Impact : +${formatFCFA((productionKg * vegHarvestLoss / 100) * vegPrice)}.`);
  }

  if (circuitLossPercent > 10) {
    const betterCircuit = 'bord de champ';
    recommendations.push(`Optimiser le circuit (perte ${circuitLossPercent}%) : préférer ${betterCircuit} ou agro-industrie.`);
  }

  if (currentFertiliserSpend > 0 && economicSovereigntyIndex < 50) {
    recommendations.push(`Augmenter valorisation compost/déjections : réduire dépense engrais de ${formatFCFA(currentFertiliserSpend)}.`);
  }

  if (netRealMargin < 0) {
    recommendations.push(`URGENT : Marge négative (${formatFCFA(netRealMargin)}). Réduire coûts ou augmenter production.`);
  }

  if (livestockCount > 0 && !msnSynergy) {
    recommendations.push('Activer valorisation Larves MSN : économiser 35% coûts alimentaires.');
  }

  if (resilienceScore < 60) {
    recommendations.push('Priorité : diversifier productions et valoriser résidus agricoles.');
  }

  // ============ REPORT GENERATION ============
  const report = {
    title: `Audit Agroéconomique Togo — Ferme: ${farmName || 'Sans nom'}`,
    summary: `Score résilience: ${resilienceScore}/100. Marge nette réelle : ${formatFCFA(netRealMargin)}. Souveraineté économique : ${economicSovereigntyIndex.toFixed(1)}%.`,
    
    // Key FCFA indicators
    resilienceScore,
    netRealMargin,
    logisticLosses,
    economicSovereigntyIndex,
    vegetalLossRate: vegHarvestLoss,
    livestockMortalityRate,
    
    // Detailed analyses
    vegetalAnalysis,
    livestockAnalysis,
    circularityAnalysis,
    economicAnalysis,
    
    // Recommendations
    recommendations: recommendations.length > 0 
      ? recommendations 
      : ['Écosystème équilibré. Continuer monitoring et optimisations progressives.'],
    
    // Audit metadata
    language: 'fr',
    currency: 'XOF/FCFA',
    timestamp: new Date().toISOString(),
  };

  return report;
}

module.exports = { runMultiSpeculationAudit, parseDecimal, formatFCFA };
