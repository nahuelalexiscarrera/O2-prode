/**
 * O2 PRODE — Cierre de predicción (lockout).
 *
 * Una predicción de partido se cierra N minutos ANTES del kickoff. Antes era 1h;
 * se relajó a 20 min (compensación: el candado de la tab Eliminatorias confundió
 * a los socios y no llegaron a predecir los 16avos).
 *
 * Fuente única de verdad del lado TS (server action + UI). El gate equivalente
 * en la DB vive en la RLS de `prediction` (migración 20260628_lockout_20min.sql)
 * con `kickoff_at - INTERVAL '20 minutes'`. Si cambia este número, actualizar
 * también esa migración — deben quedar en paridad.
 */

export const PREDICTION_LOCKOUT_MINUTES = 20;
export const PREDICTION_LOCKOUT_MS = PREDICTION_LOCKOUT_MINUTES * 60_000;
