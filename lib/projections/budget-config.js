/**
 * Budget & Seller Configuration for the Marketplace
 *
 * Each seller has:
 * - monthlyTarget: GMV target for March 2026 (ARS)
 * - takeRate: Commission percentage the marketplace earns
 * - category: Primary category for context
 * - historicalAvg: Average monthly GMV from last 4 months (Nov 2025 - Feb 2026)
 * - avgConversionRate: Historical conversion/participation rate (0-1)
 * - slaDeliveryDays: Average delivery SLA in days
 */

export const SELLERS_CONFIG = {
  'carrefourar': {
    name: 'Carrefour Argentina',
    shortName: 'Carrefour',
    monthlyTarget: 185000000,
    takeRate: 0.12,
    category: 'Supermercado / Retail',
    historicalAvg: 162000000,
    avgConversionRate: 0.72,
    slaDeliveryDays: 3,
    brandColor: '#1e429f',
  },
  'fravega': {
    name: 'Frávega',
    shortName: 'Frávega',
    monthlyTarget: 140000000,
    takeRate: 0.10,
    category: 'Electro / Hogar',
    historicalAvg: 128000000,
    avgConversionRate: 0.68,
    slaDeliveryDays: 4,
    brandColor: '#7526d9',
  },
  'aremsaprod': {
    name: 'OnCity (Aremsa)',
    shortName: 'OnCity',
    monthlyTarget: 52000000,
    takeRate: 0.14,
    category: 'Electro / Tecnología',
    historicalAvg: 45000000,
    avgConversionRate: 0.55,
    slaDeliveryDays: 5,
    brandColor: '#00c3e3',
  },
  'jumboargentinaio': {
    name: 'Jumbo Argentina',
    shortName: 'Jumbo',
    monthlyTarget: 95000000,
    takeRate: 0.11,
    category: 'Supermercado Premium',
    historicalAvg: 88000000,
    avgConversionRate: 0.65,
    slaDeliveryDays: 2,
    brandColor: '#009e0f',
  },
  'musimundo': {
    name: 'Musimundo',
    shortName: 'Musimundo',
    monthlyTarget: 38000000,
    takeRate: 0.13,
    category: 'Electro / Entretenimiento',
    historicalAvg: 33000000,
    avgConversionRate: 0.48,
    slaDeliveryDays: 6,
    brandColor: '#e11d48',
  },
  'dexter': {
    name: 'Dexter',
    shortName: 'Dexter',
    monthlyTarget: 28000000,
    takeRate: 0.15,
    category: 'Deportes / Calzado',
    historicalAvg: 24500000,
    avgConversionRate: 0.60,
    slaDeliveryDays: 4,
    brandColor: '#f59e0b',
  },
  'cetrogar': {
    name: 'Cetrogar',
    shortName: 'Cetrogar',
    monthlyTarget: 42000000,
    takeRate: 0.12,
    category: 'Electro / Hogar',
    historicalAvg: 37000000,
    avgConversionRate: 0.52,
    slaDeliveryDays: 5,
    brandColor: '#0891b2',
  },
  'simpleat': {
    name: 'SimplEat',
    shortName: 'SimplEat',
    monthlyTarget: 15000000,
    takeRate: 0.18,
    category: 'Alimentos / Viandas',
    historicalAvg: 12500000,
    avgConversionRate: 0.74,
    slaDeliveryDays: 1,
    brandColor: '#84cc16',
  },
};

/** Total marketplace GMV target for March 2026 */
export const MARKETPLACE_TARGET = Object.values(SELLERS_CONFIG)
  .reduce((sum, s) => sum + s.monthlyTarget, 0);

/** Current month reference date */
export const CURRENT_MONTH = '2026-03';
export const MONTH_START = '2026-03-01';
export const MONTH_END = '2026-03-31';
export const TODAY = '2026-03-23';
export const DAYS_IN_MONTH = 31;
export const DAYS_ELAPSED = 23;
export const DAYS_REMAINING = 8;
