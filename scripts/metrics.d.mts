type GaRow = { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] };
export function byRange(report: { rows?: GaRow[] }, metricIndex: number): { this_week: number; last_week: number };
