/**
 * ANALYTICS ENGINE - Business Intelligence Calculations
 *
 * Implements 5 commercial intelligence "motors":
 * 1. Run Rate & Gap to Target (Sprint Daily)
 * 2. Opportunity Score (0-100) with cancellation penalty
 * 3. Pareto Risk Alert (80/20 rule)
 * 4. Profitability Matrix (Revenue vs GMV via Take Rate)
 * 5. What-If Sprint Simulator data
 *
 * ═══════════════════════════════════════════════════════════
 * OPPORTUNITY SCORE ALGORITHM DOCUMENTATION
 * ═══════════════════════════════════════════════════════════
 *
 * The Opportunity Score (0-100) evaluates each seller's potential
 * to contribute meaningfully in the remaining sprint days.
 *
 * FORMULA: Score = Base × Multiplier − Penalty
 *
 * BASE (0-50 points):
 *   - Ticket Score (0-20): Higher avg ticket = more GMV per order
 *     Formula: min(20, (avgTicket / maxAvgTicket) × 20)
 *
 *   - Conversion Score (0-15): Historical participation rate
 *     Formula: min(15, conversionRate × 20)
 *
 *   - Momentum Score (0-15): Current month pace vs historical
 *     Formula: min(15, (currentDailyRate / historicalDailyRate) × 15)
 *
 * MULTIPLIER (0.8 - 1.5):
 *   - Target proximity bonus: sellers close to target get boosted
 *     Formula: 1.0 + min(0.5, completionRate × 0.5)
 *   - Floored at 0.8 for sellers way behind
 *
 * PENALTY (0-40 points, AGGRESSIVE):
 *   - Cancel Rate Penalty:
 *     • cancelRate > 10%: −40 points (critical)
 *     • cancelRate > 7%:  −25 points (high)
 *     • cancelRate > 5%:  −15 points (moderate)
 *     • cancelRate > 3%:  −5 points  (low)
 *
 *   - SLA Risk Penalty (if SLA > 5 days with 8 days remaining):
 *     • −10 additional points
 *
 * FINAL: Clamped to [0, 100]
 * ═══════════════════════════════════════════════════════════
 */

import { SELLERS_CONFIG, DAYS_IN_MONTH, DAYS_ELAPSED, DAYS_REMAINING } from './budget-config.js';
import { getSellerAverage } from './historical-cache.js';

/**
 * Motor 1: Run Rate & Gap to Target
 */
export function calculateRunRate(sellerId, currentMonthData) {
  const config = SELLERS_CONFIG[sellerId];
  if (!config) return null;

  const { gmv, orders, cancelledOrders, avgTicket } = currentMonthData;
  const target = config.monthlyTarget;

  const currentDailyRate = DAYS_ELAPSED > 0 ? gmv / DAYS_ELAPSED : 0;
  const projectedGmv = currentDailyRate * DAYS_IN_MONTH;
  const gap = target - gmv;
  const gapPercent = target > 0 ? (gap / target) * 100 : 0;

  const dailyTargetRemaining = DAYS_REMAINING > 0 ? gap / DAYS_REMAINING : 0;
  const onTrack = dailyTargetRemaining <= currentDailyRate * 1.15; // 15% tolerance

  // Cancel rate for current month
  const cancelRate = orders > 0 ? cancelledOrders / orders : 0;

  return {
    sellerId,
    sellerName: config.shortName,
    target,
    currentGmv: gmv,
    projectedGmv: Math.round(projectedGmv),
    gap: Math.round(gap),
    gapPercent: Math.round(gapPercent * 10) / 10,
    currentDailyRate: Math.round(currentDailyRate),
    dailyTargetRemaining: Math.round(dailyTargetRemaining),
    onTrack,
    orders,
    cancelledOrders,
    cancelRate: Math.round(cancelRate * 1000) / 10, // percentage with 1 decimal
    avgTicket: Math.round(avgTicket),
    daysRemaining: DAYS_REMAINING,
    daysElapsed: DAYS_ELAPSED,
    completionPercent: Math.round((gmv / target) * 1000) / 10,
  };
}

/**
 * Motor 2: Opportunity Score (0-100)
 */
export function calculateOpportunityScore(sellerId, currentMonthData) {
  const config = SELLERS_CONFIG[sellerId];
  if (!config) return { score: 0, badge: '', details: {} };

  const { gmv, orders, cancelledOrders, avgTicket } = currentMonthData;
  const cancelRate = orders > 0 ? cancelledOrders / orders : 0;

  // Find max avg ticket across all sellers for normalization
  const allTickets = Object.values(SELLERS_CONFIG).map(s => s.historicalAvg / (s.historicalAvg / 8500));
  const maxAvgTicket = Math.max(...allTickets, avgTicket, 1);

  // BASE SCORES
  const ticketScore = Math.min(20, (avgTicket / maxAvgTicket) * 20);
  const conversionScore = Math.min(15, config.avgConversionRate * 20);

  const historicalDailyRate = config.historicalAvg / DAYS_IN_MONTH;
  const currentDailyRate = DAYS_ELAPSED > 0 ? gmv / DAYS_ELAPSED : 0;
  const momentumRatio = historicalDailyRate > 0 ? currentDailyRate / historicalDailyRate : 0;
  const momentumScore = Math.min(15, momentumRatio * 15);

  const baseScore = ticketScore + conversionScore + momentumScore;

  // MULTIPLIER
  const completionRate = gmv / config.monthlyTarget;
  const multiplier = Math.max(0.8, 1.0 + Math.min(0.5, completionRate * 0.5));

  // PENALTIES
  let cancelPenalty = 0;
  if (cancelRate > 0.10) cancelPenalty = 40;
  else if (cancelRate > 0.07) cancelPenalty = 25;
  else if (cancelRate > 0.05) cancelPenalty = 15;
  else if (cancelRate > 0.03) cancelPenalty = 5;

  let slaPenalty = 0;
  if (config.slaDeliveryDays > 5 && DAYS_REMAINING <= 8) {
    slaPenalty = 10;
  }

  const totalPenalty = cancelPenalty + slaPenalty;

  // FINAL SCORE
  const rawScore = (baseScore * multiplier) - totalPenalty;
  const score = Math.round(Math.max(0, Math.min(100, rawScore)));

  // Generate badge
  const badge = generateBadge(score, cancelRate, config, completionRate);

  return {
    score,
    badge,
    details: {
      ticketScore: Math.round(ticketScore * 10) / 10,
      conversionScore: Math.round(conversionScore * 10) / 10,
      momentumScore: Math.round(momentumScore * 10) / 10,
      baseScore: Math.round(baseScore * 10) / 10,
      multiplier: Math.round(multiplier * 100) / 100,
      cancelPenalty,
      slaPenalty,
      totalPenalty,
    },
  };
}

function generateBadge(score, cancelRate, config, completionRate) {
  const warnings = [];

  if (cancelRate > 0.07) {
    warnings.push('Cancelaciones altas: revisar SLA/stock');
  }
  if (config.slaDeliveryDays > 4) {
    warnings.push('SLA de entrega limite');
  }

  if (score >= 80) {
    return {
      level: 'high',
      label: 'Alta Oportunidad',
      action: `Fomentar cupon de descuento / envio gratis.${warnings.length ? ' ' + warnings.join('. ') + '.' : ''}`,
      color: '#10b981',
    };
  } else if (score >= 60) {
    return {
      level: 'medium',
      label: 'Oportunidad Media',
      action: `Activar campaña push con incentivos moderados.${warnings.length ? ' ' + warnings.join('. ') + '.' : ''}`,
      color: '#f59e0b',
    };
  } else if (score >= 40) {
    return {
      level: 'low',
      label: 'Oportunidad Baja',
      action: `Monitorear. Enfocarse en sellers de mayor score.${warnings.length ? ' ' + warnings.join('. ') + '.' : ''}`,
      color: '#f97316',
    };
  } else {
    return {
      level: 'critical',
      label: 'Riesgo / Sin Oportunidad',
      action: `No invertir recursos. Revisar problemas operativos.${warnings.length ? ' ' + warnings.join('. ') + '.' : ''}`,
      color: '#ef4444',
    };
  }
}

/**
 * Motor 3: Pareto Risk Alert (80/20)
 */
export function calculateParetoAlerts(allSellersData, allCurrentMonthData) {
  // Sort sellers by GMV (descending) using historical average
  const sellersWithGmv = Object.entries(SELLERS_CONFIG).map(([id, config]) => {
    const avg = getSellerAverage(id, 4);
    const current = allCurrentMonthData[id] || {};
    const currentDailyRate = DAYS_ELAPSED > 0 ? (current.gmv || 0) / DAYS_ELAPSED : 0;
    const projectedGmv = currentDailyRate * DAYS_IN_MONTH;

    return {
      sellerId: id,
      sellerName: config.shortName,
      historicalAvgGmv: avg.avgGmv,
      projectedGmv: Math.round(projectedGmv),
      dropPercent: avg.avgGmv > 0
        ? Math.round(((avg.avgGmv - projectedGmv) / avg.avgGmv) * 100 * 10) / 10
        : 0,
    };
  });

  sellersWithGmv.sort((a, b) => b.historicalAvgGmv - a.historicalAvgGmv);

  // Top 20% = core sellers (at least 2)
  const coreCount = Math.max(2, Math.ceil(sellersWithGmv.length * 0.2));
  const coreSellers = sellersWithGmv.slice(0, coreCount);

  const alerts = coreSellers
    .filter(s => s.dropPercent > 15)
    .map(s => ({
      ...s,
      alertLevel: 'RED',
      message: `ALERTA ROJA: ${s.sellerName} proyecta caer ${s.dropPercent}% vs promedio ultimos 4 meses`,
    }));

  return {
    coreSellers: coreSellers.map(s => s.sellerId),
    coreSellerNames: coreSellers.map(s => s.sellerName),
    alerts,
    allRanked: sellersWithGmv,
  };
}

/**
 * Motor 4: Profitability Matrix (Revenue = GMV × Take Rate)
 */
export function calculateProfitability(sellerId, currentMonthData) {
  const config = SELLERS_CONFIG[sellerId];
  if (!config) return null;

  const { gmv } = currentMonthData;
  const currentDailyRate = DAYS_ELAPSED > 0 ? gmv / DAYS_ELAPSED : 0;
  const projectedGmv = currentDailyRate * DAYS_IN_MONTH;

  const currentRevenue = gmv * config.takeRate;
  const projectedRevenue = projectedGmv * config.takeRate;
  const targetRevenue = config.monthlyTarget * config.takeRate;

  return {
    sellerId,
    sellerName: config.shortName,
    takeRate: config.takeRate,
    takeRatePercent: config.takeRate * 100,
    currentGmv: Math.round(gmv),
    projectedGmv: Math.round(projectedGmv),
    currentRevenue: Math.round(currentRevenue),
    projectedRevenue: Math.round(projectedRevenue),
    targetRevenue: Math.round(targetRevenue),
    revenueGapToTarget: Math.round(targetRevenue - currentRevenue),
    revenueCompletionPercent: Math.round((currentRevenue / targetRevenue) * 1000) / 10,
  };
}

/**
 * Motor 5: What-If Sprint Simulator
 * Calculates the impact of a campaign boost on star sellers (score > 80)
 */
export function simulateWhatIf(allRunRates, allScores, allProfitability, boostPercent) {
  const starSellers = Object.entries(allScores)
    .filter(([, s]) => s.score >= 80)
    .map(([id]) => id);

  let extraGmv = 0;
  let extraRevenue = 0;
  const sellerImpacts = [];

  for (const id of starSellers) {
    const runRate = allRunRates[id];
    const profitability = allProfitability[id];
    const config = SELLERS_CONFIG[id];

    if (!runRate || !profitability || !config) continue;

    // Boost applies to remaining days only
    const remainingGmv = runRate.currentDailyRate * DAYS_REMAINING;
    const boostGmv = remainingGmv * (boostPercent / 100);
    const boostRevenue = boostGmv * config.takeRate;

    extraGmv += boostGmv;
    extraRevenue += boostRevenue;

    sellerImpacts.push({
      sellerId: id,
      sellerName: config.shortName,
      score: allScores[id].score,
      extraGmv: Math.round(boostGmv),
      extraRevenue: Math.round(boostRevenue),
      newProjectedGmv: Math.round(runRate.projectedGmv + boostGmv),
    });
  }

  return {
    boostPercent,
    starSellersCount: starSellers.length,
    totalExtraGmv: Math.round(extraGmv),
    totalExtraRevenue: Math.round(extraRevenue),
    sellerImpacts,
  };
}

/**
 * Build complete analytics payload for all sellers
 */
export function buildFullAnalytics(currentMonthData) {
  const runRates = {};
  const scores = {};
  const profitability = {};

  for (const sellerId of Object.keys(SELLERS_CONFIG)) {
    const data = currentMonthData[sellerId] || { gmv: 0, orders: 0, cancelledOrders: 0, avgTicket: 0 };

    runRates[sellerId] = calculateRunRate(sellerId, data);
    scores[sellerId] = calculateOpportunityScore(sellerId, data);
    profitability[sellerId] = calculateProfitability(sellerId, data);
  }

  const pareto = calculateParetoAlerts(null, currentMonthData);

  // Pre-calculate what-if scenarios for 5%, 10%, 15%, 20%
  const whatIfScenarios = [5, 10, 15, 20].map(pct =>
    simulateWhatIf(runRates, scores, profitability, pct)
  );

  // Marketplace totals
  const totalCurrentGmv = Object.values(runRates).reduce((s, r) => s + (r?.currentGmv || 0), 0);
  const totalProjectedGmv = Object.values(runRates).reduce((s, r) => s + (r?.projectedGmv || 0), 0);
  const totalTarget = Object.values(SELLERS_CONFIG).reduce((s, c) => s + c.monthlyTarget, 0);
  const totalCurrentRevenue = Object.values(profitability).reduce((s, p) => s + (p?.currentRevenue || 0), 0);
  const totalProjectedRevenue = Object.values(profitability).reduce((s, p) => s + (p?.projectedRevenue || 0), 0);

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      currentMonth: '2026-03',
      daysElapsed: DAYS_ELAPSED,
      daysRemaining: DAYS_REMAINING,
      daysInMonth: DAYS_IN_MONTH,
      cacheStrategy: 'hybrid',
    },
    marketplace: {
      totalCurrentGmv: Math.round(totalCurrentGmv),
      totalProjectedGmv: Math.round(totalProjectedGmv),
      totalTarget: Math.round(totalTarget),
      totalGap: Math.round(totalTarget - totalCurrentGmv),
      completionPercent: Math.round((totalCurrentGmv / totalTarget) * 1000) / 10,
      totalCurrentRevenue: Math.round(totalCurrentRevenue),
      totalProjectedRevenue: Math.round(totalProjectedRevenue),
    },
    sellers: Object.keys(SELLERS_CONFIG).map(id => ({
      id,
      config: SELLERS_CONFIG[id],
      runRate: runRates[id],
      opportunityScore: scores[id],
      profitability: profitability[id],
    })),
    pareto,
    whatIfScenarios,
  };
}
