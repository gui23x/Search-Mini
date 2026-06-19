export async function fetchJSON<T = any>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let msg = `Request failed (${res.status})`;
    try {
      const json = JSON.parse(text);
      msg = json?.error?.message || text || msg;
    } catch (e) {
      if (text) msg = text;
    }
    throw new Error(msg);
  }
  return (await res.json()) as T;
}
