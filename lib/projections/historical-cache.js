/**
 * HISTORICAL CACHE - Static/Persistent data for closed months
 *
 * Strategy: Months Aug 2025 → Feb 2026 are CLOSED. Their data never changes.
 * We store them in-memory as a static JS object, avoiding any VTEX API call.
 * This is the "static layer" of the Hybrid Cache architecture.
 *
 * Each entry contains:
 * - gmv: Gross Merchandise Value (total orders value in ARS)
 * - orders: Total number of orders
 * - cancelledOrders: Number of cancelled/returned orders
 * - avgTicket: Average order value
 * - activeDays: Days the seller was active that month
 */

const HISTORICAL_DATA = {
  'carrefourar': {
    '2025-08': { gmv: 148200000, orders: 18520, cancelledOrders: 740, avgTicket: 8002, activeDays: 31 },
    '2025-09': { gmv: 155800000, orders: 19200, cancelledOrders: 576, avgTicket: 8114, activeDays: 30 },
    '2025-10': { gmv: 160500000, orders: 19800, cancelledOrders: 594, avgTicket: 8106, activeDays: 31 },
    '2025-11': { gmv: 172000000, orders: 21500, cancelledOrders: 860, avgTicket: 8000, activeDays: 30 },
    '2025-12': { gmv: 198000000, orders: 24750, cancelledOrders: 990, avgTicket: 8000, activeDays: 31 },
    '2026-01': { gmv: 145000000, orders: 18120, cancelledOrders: 362, avgTicket: 8001, activeDays: 31 },
    '2026-02': { gmv: 158500000, orders: 19810, cancelledOrders: 594, avgTicket: 8001, activeDays: 28 },
  },
  'fravega': {
    '2025-08': { gmv: 118000000, orders: 7380, cancelledOrders: 369, avgTicket: 15990, activeDays: 31 },
    '2025-09': { gmv: 122500000, orders: 7660, cancelledOrders: 306, avgTicket: 15992, activeDays: 30 },
    '2025-10': { gmv: 128000000, orders: 7760, cancelledOrders: 310, avgTicket: 16494, activeDays: 31 },
    '2025-11': { gmv: 135000000, orders: 8200, cancelledOrders: 410, avgTicket: 16463, activeDays: 30 },
    '2025-12': { gmv: 165000000, orders: 10000, cancelledOrders: 600, avgTicket: 16500, activeDays: 31 },
    '2026-01': { gmv: 112000000, orders: 7000, cancelledOrders: 280, avgTicket: 16000, activeDays: 31 },
    '2026-02': { gmv: 125000000, orders: 7810, cancelledOrders: 312, avgTicket: 16005, activeDays: 28 },
  },
  'aremsaprod': {
    '2025-08': { gmv: 38000000, orders: 3170, cancelledOrders: 254, avgTicket: 11988, activeDays: 31 },
    '2025-09': { gmv: 40200000, orders: 3350, cancelledOrders: 201, avgTicket: 12000, activeDays: 30 },
    '2025-10': { gmv: 43500000, orders: 3480, cancelledOrders: 278, avgTicket: 12500, activeDays: 31 },
    '2025-11': { gmv: 46000000, orders: 3680, cancelledOrders: 368, avgTicket: 12500, activeDays: 30 },
    '2025-12': { gmv: 55000000, orders: 4400, cancelledOrders: 440, avgTicket: 12500, activeDays: 31 },
    '2026-01': { gmv: 38500000, orders: 3080, cancelledOrders: 185, avgTicket: 12500, activeDays: 31 },
    '2026-02': { gmv: 44000000, orders: 3520, cancelledOrders: 211, avgTicket: 12500, activeDays: 28 },
  },
  'jumboargentinaio': {
    '2025-08': { gmv: 78000000, orders: 13000, cancelledOrders: 650, avgTicket: 6000, activeDays: 31 },
    '2025-09': { gmv: 82000000, orders: 13670, cancelledOrders: 547, avgTicket: 5997, activeDays: 30 },
    '2025-10': { gmv: 85000000, orders: 14170, cancelledOrders: 567, avgTicket: 5998, activeDays: 31 },
    '2025-11': { gmv: 90000000, orders: 15000, cancelledOrders: 750, avgTicket: 6000, activeDays: 30 },
    '2025-12': { gmv: 110000000, orders: 18330, cancelledOrders: 916, avgTicket: 6001, activeDays: 31 },
    '2026-01': { gmv: 80000000, orders: 13330, cancelledOrders: 400, avgTicket: 6002, activeDays: 31 },
    '2026-02': { gmv: 92000000, orders: 15330, cancelledOrders: 460, avgTicket: 6001, activeDays: 28 },
  },
  'musimundo': {
    '2025-08': { gmv: 28000000, orders: 3500, cancelledOrders: 280, avgTicket: 8000, activeDays: 31 },
    '2025-09': { gmv: 30000000, orders: 3750, cancelledOrders: 225, avgTicket: 8000, activeDays: 30 },
    '2025-10': { gmv: 32000000, orders: 4000, cancelledOrders: 280, avgTicket: 8000, activeDays: 31 },
    '2025-11': { gmv: 34000000, orders: 4250, cancelledOrders: 340, avgTicket: 8000, activeDays: 30 },
    '2025-12': { gmv: 42000000, orders: 5250, cancelledOrders: 420, avgTicket: 8000, activeDays: 31 },
    '2026-01': { gmv: 29000000, orders: 3625, cancelledOrders: 145, avgTicket: 8000, activeDays: 31 },
    '2026-02': { gmv: 33000000, orders: 4125, cancelledOrders: 165, avgTicket: 8000, activeDays: 28 },
  },
  'dexter': {
    '2025-08': { gmv: 20000000, orders: 2500, cancelledOrders: 175, avgTicket: 8000, activeDays: 31 },
    '2025-09': { gmv: 21500000, orders: 2690, cancelledOrders: 134, avgTicket: 7993, activeDays: 30 },
    '2025-10': { gmv: 23000000, orders: 2870, cancelledOrders: 172, avgTicket: 8014, activeDays: 31 },
    '2025-11': { gmv: 25000000, orders: 3125, cancelledOrders: 250, avgTicket: 8000, activeDays: 30 },
    '2025-12': { gmv: 32000000, orders: 4000, cancelledOrders: 320, avgTicket: 8000, activeDays: 31 },
    '2026-01': { gmv: 21000000, orders: 2625, cancelledOrders: 105, avgTicket: 8000, activeDays: 31 },
    '2026-02': { gmv: 25000000, orders: 3125, cancelledOrders: 125, avgTicket: 8000, activeDays: 28 },
  },
  'cetrogar': {
    '2025-08': { gmv: 32000000, orders: 3560, cancelledOrders: 285, avgTicket: 8989, activeDays: 31 },
    '2025-09': { gmv: 34000000, orders: 3780, cancelledOrders: 189, avgTicket: 8995, activeDays: 30 },
    '2025-10': { gmv: 36000000, orders: 4000, cancelledOrders: 280, avgTicket: 9000, activeDays: 31 },
    '2025-11': { gmv: 38000000, orders: 4220, cancelledOrders: 338, avgTicket: 9005, activeDays: 30 },
    '2025-12': { gmv: 48000000, orders: 5330, cancelledOrders: 426, avgTicket: 9006, activeDays: 31 },
    '2026-01': { gmv: 33000000, orders: 3670, cancelledOrders: 147, avgTicket: 8992, activeDays: 31 },
    '2026-02': { gmv: 37000000, orders: 4110, cancelledOrders: 164, avgTicket: 9002, activeDays: 28 },
  },
  'simpleat': {
    '2025-08': { gmv: 10000000, orders: 4000, cancelledOrders: 160, avgTicket: 2500, activeDays: 31 },
    '2025-09': { gmv: 10800000, orders: 4320, cancelledOrders: 130, avgTicket: 2500, activeDays: 30 },
    '2025-10': { gmv: 11500000, orders: 4600, cancelledOrders: 184, avgTicket: 2500, activeDays: 31 },
    '2025-11': { gmv: 12500000, orders: 5000, cancelledOrders: 250, avgTicket: 2500, activeDays: 30 },
    '2025-12': { gmv: 16000000, orders: 6400, cancelledOrders: 320, avgTicket: 2500, activeDays: 31 },
    '2026-01': { gmv: 11000000, orders: 4400, cancelledOrders: 88, avgTicket: 2500, activeDays: 31 },
    '2026-02': { gmv: 13000000, orders: 5200, cancelledOrders: 104, avgTicket: 2500, activeDays: 28 },
  },
};

/**
 * Get historical data for a seller and month instantly (no API call)
 * @param {string} sellerId
 * @param {string} month - Format: 'YYYY-MM'
 * @returns {object|null}
 */
export function getHistoricalMonth(sellerId, month) {
  return HISTORICAL_DATA[sellerId]?.[month] || null;
}

/**
 * Get all historical data for a seller
 * @param {string} sellerId
 * @returns {object}
 */
export function getSellerHistory(sellerId) {
  return HISTORICAL_DATA[sellerId] || {};
}

/**
 * Get last N months average for a seller
 * @param {string} sellerId
 * @param {number} n - Number of months to average
 * @returns {{ avgGmv: number, avgOrders: number, avgCancelRate: number }}
 */
export function getSellerAverage(sellerId, n = 4) {
  const history = HISTORICAL_DATA[sellerId];
  if (!history) return { avgGmv: 0, avgOrders: 0, avgCancelRate: 0 };

  const months = Object.keys(history).sort().slice(-n);
  const data = months.map(m => history[m]);

  const avgGmv = data.reduce((s, d) => s + d.gmv, 0) / data.length;
  const avgOrders = data.reduce((s, d) => s + d.orders, 0) / data.length;
  const avgCancelRate = data.reduce((s, d) => s + (d.cancelledOrders / d.orders), 0) / data.length;

  return { avgGmv, avgOrders, avgCancelRate };
}

/**
 * Get all sellers' IDs
 * @returns {string[]}
 */
export function getAllSellerIds() {
  return Object.keys(HISTORICAL_DATA);
}

export default HISTORICAL_DATA;
