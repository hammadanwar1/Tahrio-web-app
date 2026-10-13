/** "+92 300 1234567" / "0300-1234567" → "03001234567" */
export function normalizePhone(input: string) {
  let d = input.replace(/\D/g, '');
  if (d.startsWith('92')) d = `0${d.slice(2)}`;
  if (!d.startsWith('0')) d = `0${d}`;
  return d;
}
