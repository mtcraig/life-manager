export const ACCOUNT_TYPES = ['current', 'savings', 'credit_card', 'other'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const INGESTION_MODES = ['manual', 'watched'] as const;
export type IngestionMode = (typeof INGESTION_MODES)[number];

export const CATEGORY_SOURCES = ['rule', 'manual'] as const;
export type CategorySource = (typeof CATEGORY_SOURCES)[number];

export const RULE_SOURCES = ['bulk_import', 'manual'] as const;
export type RuleSource = (typeof RULE_SOURCES)[number];

export const MATCH_TYPES = ['exact', 'fuzzy'] as const;
export type MatchType = (typeof MATCH_TYPES)[number];

export const PREMIUM_FREQUENCIES = ['monthly', 'annually'] as const;
export type PremiumFrequency = (typeof PREMIUM_FREQUENCIES)[number];

export const METER_TYPES = ['electricity', 'gas', 'water'] as const;
export type MeterType = (typeof METER_TYPES)[number];

export const ENERGY_UNITS = ['kWh', 'm3', 'litres'] as const;
export type EnergyUnit = (typeof ENERGY_UNITS)[number];

export const INGESTION_EVENT_SOURCES = ['manual', 'watch'] as const;
export type IngestionEventSource = (typeof INGESTION_EVENT_SOURCES)[number];

export const INGESTION_EVENT_STATUSES = ['success', 'warning', 'error'] as const;
export type IngestionEventStatus = (typeof INGESTION_EVENT_STATUSES)[number];
