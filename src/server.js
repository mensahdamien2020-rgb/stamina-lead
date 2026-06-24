const express = require('express');
const fs = require('fs');
const path = require('path');
const { runMultiSpeculationAudit, parseDecimal } = require('./controllers/auditController');

const app = express();
const PORT = process.env.PORT || 3000;
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/audit', (req, res) => {
  try {
    const { farmName, date, vegetation, livestock, circularity, economic } = req.body;

    // Sanitize and clean all inputs with parseDecimal - RIGOROUS FCFA HANDLING
    const cleanedAuditData = {
      farmName: (farmName || '').trim(),
      date: date || null,
      vegetation: {
        cropName: (vegetation?.cropName || '').trim(),
        area: parseDecimal(vegetation?.area),
        yield: parseDecimal(vegetation?.yield),
        price: parseDecimal(vegetation?.price),
        harvestLoss: parseDecimal(vegetation?.harvestLoss),
        marketCircuit: (vegetation?.marketCircuit || 'local-market').trim(),
        transportCost: parseDecimal(vegetation?.transportCost),
      },
      livestock: {
        type: (livestock?.type || '').trim(),
        count: parseDecimal(livestock?.count),
        feedCostMonthly: parseDecimal(livestock?.feedCostMonthly),
        mortalityRate: parseDecimal(livestock?.mortalityRate),
        manure: parseDecimal(livestock?.manure),
      },
      circularity: {
        residueVolume: parseDecimal(circularity?.residueVolume),
        valorisationType: (circularity?.valorisationType || '').trim(),
        msnLivestockSynergy: circularity?.msnLivestockSynergy === true,
      },
      economic: {
        labourCost: parseDecimal(economic?.labourCost),
        fertiliserCost: parseDecimal(economic?.fertiliserCost),
      },
    };

    // Save audit data to file
    const fileName = `audit-${Date.now()}.json`;
    fs.writeFileSync(
      path.join(dataDir, fileName),
      JSON.stringify(cleanedAuditData, null, 2),
      'utf8'
    );

    // Generate comprehensive audit report
    const report = runMultiSpeculationAudit(cleanedAuditData);

    return res.json({
      status: 'ok',
      message: 'Audit agoéconomique Togo enregistré avec succès',
      fileName,
      report,
    });
  } catch (error) {
    console.error('Error in /audit endpoint:', error);
    return res.status(500).json({
      status: 'error',
      message: `Erreur serveur: ${error.message}`,
    });
  }
});

app.listen(PORT, () => {
  console.log(`STAMINA LEAD server démarré: http://localhost:${PORT}`);
});

module.exports = app;
