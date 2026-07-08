const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── CONNEXION MONGODB ───
const dbURI = 'mongodb://mensahdamien2020_db_user:cifK8PxW1zu8L6uI@ac-wg0rfth-shard-00-00.pclhxt4.mongodb.net:27017,ac-wg0rfth-shard-00-01.pclhxt4.mongodb.net:27017,ac-wg0rfth-shard-00-02.pclhxt4.mongodb.net:27017/?ssl=true&replicaSet=atlas-yqz4qb-shard-0&authSource=admin&appName=Cluster0';

mongoose.connect(dbURI)
    .then(() => console.log('✅ Connecté à MongoDB Atlas avec succès !'))
    .catch((err) => console.error('❌ Erreur MongoDB :', err));

// ─── MODÈLE ───
const Audit = mongoose.model('Audit', new mongoose.Schema({
    farmName: String,
    region: String,
    auditorName: String,
    formData: Object,
    report: Object,
    date: { type: Date, default: Date.now }
}));

// ─── UTILITAIRES ───
function parseNum(val) {
    if (!val) return 0;
    return parseFloat(String(val).replace(/\s/g, '').replace(',', '.')) || 0;
}

// ─── ROUTE AUDIT ───
app.post('/audit', async (req, res) => {
    try {
        const data = req.body;

        // === EXTRACTION DES DONNÉES ===

        // Général
        const farmName = data.farmName || 'Non spécifiée';
        const region = data.region || '';
        const farmType = data.farmType || '';
        const totalArea = parseNum(data.totalArea);

        // Végétal
        const cropArea = parseNum(data.vegetation?.area);
        const cropYield = parseNum(data.vegetation?.yield);
        const cropPrice = parseNum(data.vegetation?.price);
        const harvestLoss = parseNum(data.vegetation?.harvestLoss);
        const transportCost = parseNum(data.vegetation?.transportCost);
        const inputCost = parseNum(data.vegetation?.inputCost);
        const inputType = data.vegetation?.inputType || 'chimique';
        const marketCircuit = data.vegetation?.marketCircuit || '';
        const cropCycle = parseNum(data.vegetation?.cropCycle);

        // Élevage
        const livestockType = data.livestock?.type || '';
        const livestockCount = parseNum(data.livestock?.count);
        const mortalityRate = parseNum(data.livestock?.mortalityRate);
        const feedCost = parseNum(data.livestock?.feedCostMonthly);
        const feedSource = data.livestock?.feedSource || 'achetee';
        const manureKg = parseNum(data.livestock?.manure);
        const livestockRevenue = parseNum(data.livestock?.revenue);

        // Circularité
        const residueVolume = parseNum(data.circularity?.residueVolume);
        const valorisationType = data.circularity?.valorisationType || '';
        const circularRevenue = parseNum(data.circularity?.circularRevenue);
        const waterAccess = data.circularity?.waterAccess || 'aucun';
        const msnSynergy = data.circularity?.msnLivestockSynergy || false;
        const compostCultures = data.circularity?.compostCultures || false;
        const eauRecyclee = data.circularity?.eauRecyclee || false;
        const agroforesterie = data.circularity?.agroforesterie || false;
        const venteSousProduits = data.circularity?.venteSousProduits || false;
        const semencesLocales = data.circularity?.semencesLocales || false;

        // Économique
        const labourCost = parseNum(data.economic?.labourCost);
        const fertiliserCost = parseNum(data.economic?.fertiliserCost);
        const debtAmount = parseNum(data.economic?.debtAmount);
        const interestRate = parseNum(data.economic?.interestRate);
        const cropRevenueSaisi = parseNum(data.economic?.cropRevenue);
        const otherRevenue = parseNum(data.economic?.otherRevenue);
        const accesCredit = data.economic?.accesCredit || false;
        const acesMarchePrime = data.economic?.acesMarchePrime || false;
        const assurance = data.economic?.assurance || false;
        const groupement = data.economic?.groupement || false;

        // === CALCULS PRODUCTION VÉGÉTALE ===
        const productionBrute = cropArea * cropYield * 1000; // kg
        const productionNette = productionBrute * (1 - harvestLoss / 100);
        const revenuBrutVegetal = productionNette * cropPrice;

        // Bonus marché premium
        const bonusMarche = marketCircuit === 'export' ? 1.3 :
                            marketCircuit === 'agro-industry' ? 1.15 :
                            marketCircuit === 'supermarche' ? 1.1 : 1.0;
        const revenuVegetalAjuste = revenuBrutVegetal * bonusMarche;

        // === CALCULS ÉLEVAGE ===
        // Réduction coût alimentation si synergie BSF
        const feedCostEffectif = msnSynergy ? feedCost * 0.65 : feedCost;
        const economiesBSF = msnSynergy ? Math.round(feedCost * 0.35) : 0;

        // === CALCULS ÉCONOMIQUES ===
        const revenusTotal = revenuVegetalAjuste + livestockRevenue + circularRevenue + otherRevenue;
        const chargesTotal = transportCost + labourCost + (fertiliserCost / 12) + feedCostEffectif + inputCost;
        const chargeDette = debtAmount > 0 ? (debtAmount * interestRate / 100) / 12 : 0;
        const chargesAvecDette = chargesTotal + chargeDette;

        // Réduction engrais si compost utilisé
        const economieFertilisants = compostCultures ? Math.round(fertiliserCost * 0.6 / 12) : 0;
        const chargesReelles = chargesAvecDette - economieFertilisants;

        const netRealMargin = Math.round(revenusTotal - chargesReelles);
        const logisticLosses = Math.round(transportCost * 0.25);

        const economicSovereigntyIndex = chargesReelles > 0
            ? Math.min(100, Math.round((revenusTotal / chargesReelles) * 50))
            : 50;

        // === SCORE DE RÉSILIENCE (sur 100) ===
        let resilienceScore = 0;

        // Rentabilité (25 pts)
        if (netRealMargin > 0) resilienceScore += 15;
        if (netRealMargin > 100000) resilienceScore += 10;

        // Santé animale (15 pts)
        if (mortalityRate < 5) resilienceScore += 15;
        else if (mortalityRate < 10) resilienceScore += 8;

        // Pertes végétales (15 pts)
        if (harvestLoss < 10) resilienceScore += 15;
        else if (harvestLoss < 20) resilienceScore += 8;

        // Pratiques circulaires (30 pts)
        if (msnSynergy) resilienceScore += 8;
        if (compostCultures) resilienceScore += 6;
        if (residueVolume > 0) resilienceScore += 5;
        if (agroforesterie) resilienceScore += 5;
        if (eauRecyclee) resilienceScore += 3;
        if (semencesLocales) resilienceScore += 3;

        // Accès marchés & sécurité (15 pts)
        if (accesCredit) resilienceScore += 4;
        if (acesMarchePrime) resilienceScore += 5;
        if (assurance) resilienceScore += 3;
        if (groupement) resilienceScore += 3;

        resilienceScore = Math.min(100, resilienceScore);

        // === RECOMMANDATIONS STRATÉGIQUES ===
        const recommendations = [];

        if (harvestLoss > 15) {
            recommendations.push(`🌾 Réduction des pertes post-récolte : Vos pertes de ${harvestLoss}% représentent ${Math.round(productionBrute * harvestLoss / 100)} kg perdus par saison. Investissez dans des sacs hermétiques PICS ou un petit silo métallique — retour sur investissement en moins de 2 saisons.`);
        }

        if (mortalityRate > 10) {
            recommendations.push(`🐐 Santé animale critique : Un taux de mortalité de ${mortalityRate}% dépasse le seuil acceptable. Mettez en place un calendrier vaccinal et un partenariat avec un technicien d'élevage — chaque animal sauvé est un revenu préservé.`);
        }

        if (!msnSynergy && manureKg > 100) {
            recommendations.push(`🪲 Innovation BSF (Économie Bleue) : Vos ${manureKg} kg/mois de déjections peuvent nourrir des larves de Mouche Soldat Noire. Ces larves remplacent 35% des aliments achetés — économie potentielle estimée : ${Math.round(feedCost * 0.35).toLocaleString('fr-FR')} FCFA/mois sur votre facture d'alimentation.`);
        }

        if (residueVolume === 0) {
            recommendations.push(`♻️ Résidus agricoles non valorisés : Vos tiges, pailles et déchets organiques sont une ressource inexploitée. Lancez un compostage simple en 3 étapes : collecte → fermentation 45 jours → épandage. Économie sur engrais : jusqu'à ${Math.round(fertiliserCost * 0.7).toLocaleString('fr-FR')} FCFA/an.`);
        }

        if (!compostCultures && fertiliserCost > 50000) {
            recommendations.push(`🌿 Réduction des intrants chimiques : Vous dépensez ${fertiliserCost.toLocaleString('fr-FR')} FCFA/an en engrais chimiques. Un compost de qualité peut remplacer 60 à 80% de cet apport — économie de ${Math.round(fertiliserCost * 0.65).toLocaleString('fr-FR')} FCFA/an tout en améliorant la structure de votre sol.`);
        }

        if (netRealMargin < 0) {
            recommendations.push(`💰 Rentabilité négative (${netRealMargin.toLocaleString('fr-FR')} FCFA) : Action prioritaire — réduisez les 3 premiers postes de charges et diversifiez avec une culture à cycle court (niébé, légumes-feuilles) pour générer des revenus mensuels complémentaires dès la prochaine saison.`);
        }

        if (waterAccess === 'aucun' || waterAccess === 'pluie') {
            recommendations.push(`💧 Sécurité hydrique : Sans accès fiable à l'eau, votre exploitation est vulnérable aux aléas climatiques. Explorez les options de forage groupé avec des voisins, ou la mise en place de demi-lunes de rétention d'eau — technique simple, coût quasi nul.`);
        }

        if (!groupement) {
            recommendations.push(`🤝 Rejoindre un groupement : L'adhésion à une coopérative ou groupement agricole permet d'accéder à des intrants moins chers (achat groupé), des marchés collectifs, et des formations. Dans votre zone, recherchez les groupements labellisés ANSAT ou ICAT.`);
        }

        if (marketCircuit === 'farm-gate' || marketCircuit === '') {
            recommendations.push(`🛒 Améliorer le circuit de vente : La vente en bord de champ vous prive de 15 à 30% du prix marché. Explorez les marchés locaux hebdomadaires ou les contrats directs avec des restaurateurs — même un seul client régulier stabilise votre revenu.`);
        }

        if (venteSousProduits) {
            recommendations.push(`✅ Bonne pratique : Vous vendez déjà vos sous-produits. Pour maximiser ce revenu, standardisez votre présentation (sacs identifiés, poids fixe) et prospectez les jardiniers urbains ou maraîchers de votre région.`);
        }

        if (recommendations.length === 0) {
            recommendations.push(`🏆 Exploitation modèle : Votre score de résilience est excellent. Envisagez une certification Agriculture Biologique ou Agroécologique pour accéder à des marchés premium et augmenter vos prix de vente de 20 à 40%.`);
        }

        // === CONSTRUCTION DU RAPPORT ===
        const report = {
            title: `${farmName}${region ? ' — ' + region : ''}`,
            resilienceScore,
            netRealMargin,
            logisticLosses,
            economicSovereigntyIndex,
            vegetalLossRate: harvestLoss,
            livestockMortalityRate: mortalityRate,

            vegetalAnalysis: `Production estimée : ${Math.round(productionNette).toLocaleString('fr-FR')} kg nets après ${harvestLoss}% de pertes. Revenu brut cultures : ${Math.round(revenuVegetalAjuste).toLocaleString('fr-FR')} FCFA${bonusMarche > 1 ? ` (avec bonus circuit ${marketCircuit})` : ''}. Intrants ${inputType === 'organique' ? '100% organiques ✅' : inputType === 'mixte' ? 'mixtes (optimisable)' : 'chimiques — coût à réduire par compostage'}.`,

            livestockAnalysis: `${livestockCount > 0 ? livestockCount + ' ' + (livestockType || 'animaux') : 'Élevage non renseigné'}. Taux de mortalité : ${mortalityRate}%${mortalityRate < 5 ? ' ✅ Excellent' : mortalityRate < 10 ? ' ⚠️ Acceptable' : ' 🚨 Critique'}. Coût alimentation effectif : ${Math.round(feedCostEffectif).toLocaleString('fr-FR')} FCFA/mois${msnSynergy ? ` (économie BSF : ${economiesBSF.toLocaleString('fr-FR')} FCFA)` : ''}. Déjections produites : ${manureKg} kg/mois — ${manureKg > 0 ? 'potentiel de valorisation réel' : 'non renseigné'}.`,

            circularityAnalysis: `Résidus valorisés : ${residueVolume} kg/mois. Mode de valorisation : ${valorisationType || 'non défini'}. Synergies actives : ${[msnSynergy && 'BSF', compostCultures && 'compost sur cultures', eauRecyclee && 'eau recyclée', agroforesterie && 'agroforesterie', semencesLocales && 'semences locales'].filter(Boolean).join(', ') || 'aucune — fort potentiel à développer'}. Revenu circulaire additionnel : ${circularRevenue.toLocaleString('fr-FR')} FCFA/mois.`,

            economicAnalysis: `Revenus totaux estimés : ${Math.round(revenusTotal).toLocaleString('fr-FR')} FCFA/mois. Charges totales : ${Math.round(chargesReelles).toLocaleString('fr-FR')} FCFA/mois${economieFertilisants > 0 ? ` (économie compost incluse : ${economieFertilisants.toLocaleString('fr-FR')} FCFA)` : ''}. Marge nette réelle : ${netRealMargin.toLocaleString('fr-FR')} FCFA/mois. Indice de souveraineté économique : ${economicSovereigntyIndex}%${debtAmount > 0 ? `. Charge de dette mensuelle : ${Math.round(chargeDette).toLocaleString('fr-FR')} FCFA` : ''}.`,

            recommendations
        };

        // Sauvegarde en arrière-plan
        new Audit({ farmName, region, auditorName: data.auditorName, formData: data, report })
            .save()
            .catch(err => console.error('Sauvegarde échouée (non bloquant):', err.message));

        res.json({ status: 'ok', message: 'Diagnostic généré avec succès.', report });

    } catch (error) {
        console.error('Erreur lors du traitement:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ─── LANCEMENT ───
app.listen(3000, () => console.log('🚀 Serveur STAMINA LEAD prêt sur le port 3000'));