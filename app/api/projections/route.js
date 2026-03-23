/**
 * API Route: /api/projections
 *
 * Hybrid Cache Architecture:
 * ┌─────────────────────────────────────────────┐
 * │  Closed Months (Aug 2025 – Feb 2026)        │
 * │  → Static JS object (instant, 0ms)          │
 * │  → Never hits VTEX API                      │
 * ├─────────────────────────────────────────────┤
 * │  Current Month (March 2026)                 │
 * │  → VTEX OMS via Promise.all (parallel)      │
 * │  → _fields: value,status,creationDate,seller│
 * │  → 5-minute in-memory cache                 │
 * └─────────────────────────────────────────────┘
 *
 * Query params:
 *   ?refresh=true  → Force cache invalidation
 *   ?whatif=N      → Include what-if simulation at N%
 */

export const dynamic = 'force-dynamic';

import { fetchCurrentMonthData, invalidateCurrentMonthCache } from '../../../lib/projections/vtex-orders.js';
import { buildFullAnalytics, simulateWhatIf, calculateRunRate, calculateOpportunityScore, calculateProfitability } from '../../../lib/projections/analytics-engine.js';
import { getSellerHistory } from '../../../lib/projections/historical-cache.js';
import { SELLERS_CONFIG } from '../../../lib/projections/budget-config.js';

export async function GET(request) {
  const start = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    const whatIfPercent = parseInt(searchParams.get('whatif') || '0', 10);

    // Force cache clear if requested
    if (forceRefresh) {
      invalidateCurrentMonthCache();
    }

    // STEP 1: Fetch current month data (cached or fresh via Promise.all)
    const currentMonthData = await fetchCurrentMonthData();

    // STEP 2: Build full analytics (uses static historical cache internally)
    const analytics = buildFullAnalytics(currentMonthData);

    // STEP 3: Add historical data for each seller
    analytics.sellers = analytics.sellers.map(seller => ({
      ...seller,
      history: getSellerHistory(seller.id),
    }));

    // STEP 4: Custom what-if simulation if requested
    if (whatIfPercent > 0 && whatIfPercent <= 100) {
      const runRates = {};
      const scores = {};
      const profitabilityMap = {};

      for (const seller of analytics.sellers) {
        runRates[seller.id] = seller.runRate;
        scores[seller.id] = seller.opportunityScore;
        profitabilityMap[seller.id] = seller.profitability;
      }

      analytics.customWhatIf = simulateWhatIf(
        runRates, scores, profitabilityMap, whatIfPercent
      );
    }

    const elapsed = Date.now() - start;

    return Response.json({
      success: true,
      responseTimeMs: elapsed,
      ...analytics,
    }, {
      headers: {
        'Cache-Control': 'private, max-age=300', // 5 min browser cache
      },
    });
  } catch (err) {
    console.error('[Projections API Error]', err);
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
