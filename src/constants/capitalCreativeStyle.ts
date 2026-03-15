export const CAPITAL_CREATIVE = {
  name: "Capital Creative",
  backgrounds: {
    deepGreen: "#0B2B26",
    navy: "#0A1628",
    charcoal: "#1A1A2E",
    darkTeal: "#0D3B3B",
    pureBlack: "#0A0A0A"
  },
  gold: {
    primary: "#C5A55A",
    light: "#D4B96E",
    dark: "#A8893E"
  },
  text: {
    white: "#FFFFFF",
    offWhite: "#F0EDED",
    lightGray: "#B8B8B8",
    gold: "#C5A55A"
  },
  cta: {
    gold: { bg: "#C5A55A", text: "#0A0A0A" },
    red: { bg: "#E74C3C", text: "#FFFFFF" },
    blue: { bg: "#2980B9", text: "#FFFFFF" }
  },
  gradients: {
    verticalGreen: "linear-gradient(180deg, rgba(11,43,38,0.95) 0%, rgba(11,43,38,0.7) 60%, rgba(11,43,38,0.95) 100%)",
    diagonalNavy: "linear-gradient(135deg, rgba(10,22,40,0.92) 0%, rgba(26,26,46,0.85) 100%)",
    cinematicBlack: "linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.9) 100%)"
  },
  typography: {
    qualifier: { size: "13px", weight: 700, letterSpacing: "5px", transform: "uppercase" as const },
    heroReturn: { size: "56-72px", weight: 900 },
    headline: { family: "Playfair Display, serif", size: "24-32px", weight: 900, transform: "uppercase" as const },
    benefit: { size: "14-16px", weight: 600, letterSpacing: "2-3px", transform: "uppercase" as const },
    cta: { size: "13-15px", weight: 800, letterSpacing: "3-4px", transform: "uppercase" as const },
    disclaimer: { size: "7-9px", weight: 400, opacity: 0.35 }
  },
  compliance: {
    qualifierText: "ACCREDITED INVESTORS",
    returnPrefix: "Target",
    disclaimer: "This opportunity is for accredited investors only. All investments carry risk, including the potential loss of principal. Past performance does not guarantee future results. Any sale of securities will be made solely via our Private Placement Memorandum. Please consult your financial advisor before investing."
  },
  powerWords: ["ACCREDITED", "PROJECTED", "TARGETED", "SECURED", "ASSET-BACKED", "PAID MONTHLY", "QUARTERLY PAYOUTS", "PREFERRED RETURNS", "HIGH-YIELD", "IRR", "TAX ADVANTAGES", "CASH FLOW", "ZERO MISSED PAYMENTS", "AUM", "VERTICALLY INTEGRATED", "HUD-INSURED"]
};
