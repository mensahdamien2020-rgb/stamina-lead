const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// 1. Servir vos fichiers web (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// 2. Vos services
const circularityService = require('./services/circularityService');

// 3. Votre route d'audit
app.post('/audit', (req, res) => {
    try {
        const report = circularityService.runMultiSpeculationAudit(req.body);
        return res.json({ status: 'ok', report: report });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = app;

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Serveur lancé sur http://localhost:${PORT}`));
}  