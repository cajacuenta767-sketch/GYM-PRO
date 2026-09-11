/** Genera un correlativo con prefijo: PREFIJO-AAAA-000123 */
export function sequential(prefix: string, n: number, date = new Date()) {
  return `${prefix}-${date.getFullYear()}-${String(n).padStart(6, '0')}`;
}
