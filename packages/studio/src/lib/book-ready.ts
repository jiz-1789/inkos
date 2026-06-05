export interface StudioBookDetail {
  readonly book: { readonly id: string };
  readonly chapters: ReadonlyArray<unknown>;
  readonly nextChapter: number;
}

export interface WaitForStudioBookReadyOptions {
  readonly fetchImpl?: typeof fetch;
  readonly wait?: (delayMs: number) => Promise<void>;
  readonly maxAttempts?: number;
  readonly retryDelayMs?: number;
}

function defaultWait(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

export async function waitForStudioBookReady(
  bookId: string,
  options: WaitForStudioBookReadyOptions = {},
): Promise<StudioBookDetail> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const wait = options.wait ?? defaultWait;
  const maxAttempts = options.maxAttempts ?? 5;
  const retryDelayMs = options.retryDelayMs ?? 150;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetchImpl(`/api/v1/books/${encodeURIComponent(bookId)}`);
    if (response.ok) {
      return await response.json() as StudioBookDetail;
    }

    if (attempt < maxAttempts && response.status === 404) {
      await wait(retryDelayMs);
      continue;
    }

    break;
  }

  throw new Error(`Book "${bookId}" was not ready after ${maxAttempts} attempts.`);
}
