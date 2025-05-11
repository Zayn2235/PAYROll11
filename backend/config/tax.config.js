module.exports = {
    // Personal allowance: no income tax up to this amount (per tax year)
    personalAllowance: 12_570,

    // Income tax bands (threshold and rate)
    bands: [
        { upTo: 50_270, rate: 0.20 },   // Basic rate
        { upTo: 125_140, rate: 0.40 },   // Higher rate
        { upTo: Infinity, rate: 0.45 }   // Additional rate
    ],

    // National Insurance (Class 1 employee contributions)
    ni: {
        lowerLimit: 12_570,   // no NI below this
        upperLimit: 50_270,   // primary threshold
        rateLower: 0.12,    // between lower & upper
        rateUpper: 0.02     // above upper
    },

    // Provident fund rate (example 5%)
    providentRate: 0.05
};
