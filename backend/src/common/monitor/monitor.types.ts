/**
 * Wire shape for a single event POSTed to kathawachak's /api/ingest/events.
 * Mirrors @kathawachak/contracts MonitorEventInput. Kept as a local copy so
 * this project has no cross-repo dependency on the kathawachak workspace.
 */
export type MonitorLogType = 'request' | 'job' | 'system';

export type MonitorFlowStep =
  | 'entry'
  | 'auth'
  | 'validation'
  | 'service'
  | 'db'
  | 'external'
  | 'emit'
  | 'consume'
  | 'response'
  | 'error';

export interface MonitorEvent {
  time: string;
  service: string;
  environment: string;
  trace_id: string;
  request_id?: string;
  job_id?: string;
  span_id?: string;
  parent_span_id?: string;
  log_type: MonitorLogType;
  flow_step: MonitorFlowStep;
  method?: string;
  route?: string;
  raw_path?: string;
  msg: string;
  status_code?: number;
  duration_ms?: number;
  error_type?: string;
  version?: string;
  deploy_id?: string;
  attributes?: Record<string, unknown>;
}

export interface MonitorRequestContext {
  trace_id: string;
  request_id: string;
  service: string;
  environment: string;
  method?: string;
  route?: string;
  raw_path?: string;
  span_id?: string;
  start_time_ms: number;
}
