export function maskApiKey(apiKey: string) {
  if (apiKey.length <= 4) {
    return "*".repeat(apiKey.length);
  }

  return `${"*".repeat(apiKey.length - 4)}${apiKey.slice(-4)}`;
}
