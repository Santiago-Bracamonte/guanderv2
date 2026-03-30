const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 segundo

export class CloudflareD1Error extends Error {
  public readonly statusCode?: number;
  public readonly retryable: boolean;

  constructor(
    message: string,
    statusCode?: number,
    retryable: boolean = false,
  ) {
    super(message);
    this.name = "CloudflareD1Error";
    this.statusCode = statusCode;
    this.retryable = retryable;
  }
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function queryD1<T = Record<string, unknown>>(
  sql: string,
  params: (string | number | null)[] = [],
  options?: { revalidate?: number | false },
): Promise<T[]> {
  if (!ACCOUNT_ID || !DATABASE_ID || !API_TOKEN) {
    throw new CloudflareD1Error(
      "No se pudo conectar a Cloudflare D1. Revisa que CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID y CLOUDFLARE_API_TOKEN esten bien configuradas en .env.local.",
      undefined,
      false,
    );
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`;

  const fetchOptions: RequestInit & { next?: { revalidate: number } } = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, params }),
  };

  if (options?.revalidate === false) {
    fetchOptions.cache = "no-store";
  } else {
    fetchOptions.next = { revalidate: options?.revalidate ?? 60 };
  }

  let lastError: CloudflareD1Error | null = null;

  // Reintentos para errores transitorios
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, fetchOptions);

      if (!res.ok) {
        const text = await res.text();
        const isRetryable =
          res.status === 429 || // Rate limit
          res.status === 500 || // Server error
          res.status === 502 || // Bad gateway
          res.status === 503 || // Service unavailable
          res.status === 504; // Gateway timeout

        const error = new CloudflareD1Error(
          `Error HTTP ${res.status}: ${text}`,
          res.status,
          isRetryable,
        );

        if (!isRetryable || attempt === MAX_RETRIES - 1) {
          throw error;
        }

        lastError = error;
        await delay(RETRY_DELAY * (attempt + 1)); // Backoff exponencial
        continue;
      }

      const json = await res.json();

      if (!json.success) {
        const msg =
          json.errors?.map((e: { message: string }) => e.message).join(", ") ??
          "Error desconocido";
        throw new CloudflareD1Error(`D1 error: ${msg}`, undefined, false);
      }

      return json.result[0].results as T[];
    } catch (error) {
      if (error instanceof CloudflareD1Error) {
        if (error.retryable && attempt < MAX_RETRIES - 1) {
          lastError = error;
          await delay(RETRY_DELAY * (attempt + 1));
          continue;
        }
        throw error;
      }
      // Re-lanzar otros errores
      throw error;
    }
  }

  // Si llegamos aquí, todos los reintentos fallaron
  if (lastError) {
    throw lastError;
  }

  throw new CloudflareD1Error("Error desconocido en queryD1", undefined, false);
}
