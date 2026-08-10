const USD_PER_MTOK: Readonly<Record<string, ModelRates>> = {
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

const DEAREST_KNOWN_RATES: ModelRates = { inputPerMTok: 10, outputPerMTok: 50 };

const CACHE_READ_MULTIPLIER = 0.1;
const CACHE_WRITE_MULTIPLIER = 1.25;

interface ModelRates {
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

function ratesForModel(model: string): ModelRates {
  return ratesEntry(model) ?? DEAREST_KNOWN_RATES;
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
  const alias = Object.keys(USD_PER_MTOK).find((each) => model === each || model.startsWith(`${each}-`));
  return alias ? (USD_PER_MTOK[alias] ?? null) : null;
}

function count(raw: number | undefined): number {
  return typeof raw === 'number' && Number.isFinite(raw) && raw > 0 ? raw : 0;
}
