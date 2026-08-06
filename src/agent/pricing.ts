// Anthropic list prices, US dollars per million tokens (checked 2026-06-24).
// Cache reads bill at 0.1x the input rate; cache writes at 1.25x for the default
// 5-minute TTL. Prices are list rates, so a run's estimate is an upper bound for
// anyone on a discount.
const RATES: Readonly<Record<string, ModelRates>> = {
  'claude-fable-5': { inputPerMTok: 10, outputPerMTok: 50 },
  'claude-mythos-5': { inputPerMTok: 10, outputPerMTok: 50 },
  'claude-opus-5': { inputPerMTok: 5, outputPerMTok: 25 },
  'claude-opus-4-8': { inputPerMTok: 5, outputPerMTok: 25 },
  'claude-opus-4-7': { inputPerMTok: 5, outputPerMTok: 25 },
  'claude-opus-4-6': { inputPerMTok: 5, outputPerMTok: 25 },
  'claude-sonnet-5': { inputPerMTok: 3, outputPerMTok: 15 },
  'claude-sonnet-4-6': { inputPerMTok: 3, outputPerMTok: 15 },
  'claude-haiku-4-5': { inputPerMTok: 1, outputPerMTok: 5 },
};

// What an unpriced model id costs us to assume: the most expensive rate we know.
// Overestimating keeps the budget a real ceiling instead of a suggestion.
const UNKNOWN_MODEL_RATES: ModelRates = { inputPerMTok: 10, outputPerMTok: 50 };

const CACHE_READ_MULTIPLIER = 0.1;
const CACHE_WRITE_MULTIPLIER = 1.25;

export interface ModelRates {
  inputPerMTok: number;
  outputPerMTok: number;
}

export interface TokenUsage {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

export function modelIsPriced(model: string): boolean {
  return ratesEntry(model) !== null;
}

export function ratesForModel(model: string): ModelRates {
  return ratesEntry(model) ?? UNKNOWN_MODEL_RATES;
}

export function usageCostUsd(model: string, usage: TokenUsage | undefined): number {
  if (!usage) return 0;
  const rates = ratesForModel(model);
  const input = count(usage.input_tokens);
  const cacheWrite = count(usage.cache_creation_input_tokens) * CACHE_WRITE_MULTIPLIER;
  const cacheRead = count(usage.cache_read_input_tokens) * CACHE_READ_MULTIPLIER;
  const output = count(usage.output_tokens);
  return (
    ((input + cacheWrite + cacheRead) * rates.inputPerMTok + output * rates.outputPerMTok) / 1_000_000
  );
}

export function formatUsd(amount: number): string {
  return `$${amount.toFixed(amount < 1 ? 4 : 2)}`;
}

function ratesEntry(model: string): ModelRates | null {
  // Model ids may carry a date suffix (claude-haiku-4-5-20251001); the alias prefix prices it.
  const alias = Object.keys(RATES).find((each) => model === each || model.startsWith(`${each}-`));
  return alias ? (RATES[alias] ?? null) : null;
}

function count(raw: number | undefined): number {
  return typeof raw === 'number' && Number.isFinite(raw) && raw > 0 ? raw : 0;
}
