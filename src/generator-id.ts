/**
 * Maps a generator id (as returned by `list_generators`, e.g. `pl.pesel` or
 * `any.email`) to the API URL path segment that serves it.
 *
 * The registry ids are dot-separated by locale; the HTTP routes are
 * slash-separated, and the locale-agnostic `any.*` generators are mounted at
 * the bare name (`any.email` → `/v1/email`, not `/v1/any/email`). Already
 * slash-formed input (a raw path like `pl/pesel`) passes through unchanged, so
 * the `generate` tool accepts either form.
 */
export const generatorIdToPath = (generator: string): string => {
  const path = generator.replaceAll('.', '/');
  return path.startsWith('any/') ? path.slice('any/'.length) : path;
};
