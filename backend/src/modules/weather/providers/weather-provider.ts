import type { Forecast } from '../domain/forecast';
import type { GridCell } from '../domain/grid-cell';

/** A weather source. Adapters map their own response to our Forecast and throw on anything else. */
export interface WeatherProvider {
  /** Shown to users as the credit ("Open-Meteo"). */
  readonly name: string;
  forecast(cell: GridCell, signal: AbortSignal): Promise<Forecast>;
}

export type Fetch = typeof fetch;
