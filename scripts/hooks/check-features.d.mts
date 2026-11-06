export const FEATURES_SUFFIX: string;
export function specPath(id: string): string;
export function validateShape(list: unknown): string | null;
export function checkFeaturesChange(
  oldText: string | null,
  newText: string,
  agentType?: string,
  hasSpec?: (id: string) => boolean,
): string | null;
export function applyEdit(
  text: string,
  edit: { old_string: string; new_string: string; replace_all?: boolean },
): string;
