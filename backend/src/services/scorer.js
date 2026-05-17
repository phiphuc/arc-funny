/**
 * Provable Scoring Engine
 * Calculates wallet reputation score (0-100) and tier (0-4)
 */

/**
 * Calculate reputation score from wallet data
 * @param {Object} ethData - Ethereum mainnet data
 * @param {Object} arcData - Arc testnet data
 * @returns {Object} { score, tier, breakdown, isSybil }
 */
function calculateScore(ethData, arcData) {
  const breakdown = {
    ethereum: 0,
    usdc: 0,
    arc: 0,
    sybilPenalty: 0
  };

  // === ETHEREUM ACTIVITY (40 points) ===
  
  // Account age (0-10 pts)
  const accountAgeDays = ethData.accountAgeDays || 0;
  if (accountAgeDays > 730) breakdown.ethereum += 10;
  else if (accountAgeDays > 365) breakdown.ethereum += 7;
  else if (accountAgeDays > 180) breakdown.ethereum += 5;
  else if (accountAgeDays > 90) breakdown.ethereum += 3;
  
  // ETH balance (0-10 pts)
  const ethBalance = ethData.ethBalance || 0;
  if (ethBalance >= 10) breakdown.ethereum += 10;
  else if (ethBalance >= 1) breakdown.ethereum += 8;
  else if (ethBalance >= 0.1) breakdown.ethereum += 5;
  else if (ethBalance >= 0.01) breakdown.ethereum += 2;
  
  // Transaction count (0-10 pts)
  const txCount = ethData.txCount || 0;
  if (txCount > 1000) breakdown.ethereum += 10;
  else if (txCount > 500) breakdown.ethereum += 8;
  else if (txCount > 100) breakdown.ethereum += 6;
  else if (txCount > 10) breakdown.ethereum += 3;
  
  // Active days (0-10 pts) - estimate from tx count
  const activeDays = Math.min(txCount / 2, 365); // rough estimate
  if (activeDays > 365) breakdown.ethereum += 10;
  else if (activeDays > 180) breakdown.ethereum += 7;
  else if (activeDays > 90) breakdown.ethereum += 5;
  else if (activeDays > 30) breakdown.ethereum += 3;

  // === USDC ACTIVITY (30 points) ===
  
  // USDC volume (0-15 pts)
  const usdcVolume = ethData.usdcVolume || 0;
  if (usdcVolume > 100000) breakdown.usdc += 15;
  else if (usdcVolume > 10000) breakdown.usdc += 12;
  else if (usdcVolume > 1000) breakdown.usdc += 8;
  else if (usdcVolume > 100) breakdown.usdc += 4;
  
  // DeFi protocols (0-15 pts)
  const defiCount = (ethData.defiProtocols || []).length;
  if (defiCount > 10) breakdown.usdc += 15;
  else if (defiCount > 5) breakdown.usdc += 10;
  else if (defiCount > 3) breakdown.usdc += 7;
  else if (defiCount > 0) breakdown.usdc += 4;

  // === ARC ACTIVITY (30 points) ===
  
  // Arc tx count (0-10 pts)
  const arcTxCount = arcData.txCount || 0;
  if (arcTxCount > 500) breakdown.arc += 10;
  else if (arcTxCount > 100) breakdown.arc += 7;
  else if (arcTxCount > 50) breakdown.arc += 5;
  else if (arcTxCount > 10) breakdown.arc += 3;
  
  // Arc USDC volume (0-10 pts)
  const arcUsdcVolume = arcData.usdcVolume || 0;
  if (arcUsdcVolume > 10000) breakdown.arc += 10;
  else if (arcUsdcVolume > 1000) breakdown.arc += 7;
  else if (arcUsdcVolume > 100) breakdown.arc += 5;
  else if (arcUsdcVolume > 10) breakdown.arc += 2;
  
  // Unique contracts (0-10 pts)
  const uniqueContracts = arcData.uniqueContracts || 0;
  if (uniqueContracts > 20) breakdown.arc += 10;
  else if (uniqueContracts > 10) breakdown.arc += 7;
  else if (uniqueContracts > 5) breakdown.arc += 5;
  else if (uniqueContracts > 2) breakdown.arc += 3;

  // === SYBIL DETECTION (bonus/penalty) ===
  
  let sybilPenalty = 0;
  
  // Red flags
  if (accountAgeDays < 30) sybilPenalty += 20;
  if (ethBalance === 0) sybilPenalty += 10;
  if (txCount < 5) sybilPenalty += 15;
  if (uniqueContracts < 2) sybilPenalty += 10;
  
  // Green flags (bonus)
  if (accountAgeDays > 730 && txCount > 500) sybilPenalty -= 10;
  if (defiCount > 5) sybilPenalty -= 5;
  
  breakdown.sybilPenalty = sybilPenalty;

  // === CALCULATE FINAL SCORE ===
  
  let totalScore = breakdown.ethereum + breakdown.usdc + breakdown.arc - sybilPenalty;
  totalScore = Math.max(0, Math.min(100, totalScore)); // clamp 0-100

  // === DETERMINE TIER ===
  
  let tier;
  if (totalScore >= 80) tier = 4; // Diamond
  else if (totalScore >= 60) tier = 3; // Platinum
  else if (totalScore >= 40) tier = 2; // Gold
  else if (totalScore >= 20) tier = 1; // Silver
  else tier = 0; // Bronze

  // === SYBIL FLAG ===
  
  const isSybil = sybilPenalty > 30 || totalScore < 20;

  return {
    score: Math.round(totalScore),
    tier,
    breakdown,
    isSybil,
    tierName: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'][tier],
    sybilRisk: ['Very Low', 'Low', 'Medium', 'High', 'Very High'][4 - tier]
  };
}

module.exports = { calculateScore };
