function calculateCircularity(data) {
    const localInputs = Number(data.localInputs) || 0;
    const externalInputs = Number(data.externalInputs) || 0;
    const valorisedWaste = Number(data.valorisedWaste) || 0;
    
    const EPS = 0.0001;
    const total = localInputs + externalInputs + EPS;
    const ratio = localInputs / total;
    const score = Math.round(ratio * 100);
    
    const message = `Score de circularité : ${score}/100`;
    
    return { score, ratio, localInputs, externalInputs, valorisedWaste, message };
}

module.exports = { calculateCircularity };
