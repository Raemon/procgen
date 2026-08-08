import { SERVER_LOAD_PATH, type ServerLoad } from './serverLoadContract';

export async function fetchServerLoad(): Promise<ServerLoad | null> {
  try {
    const response = await fetch(SERVER_LOAD_PATH);
    return response.ok ? ((await response.json()) as ServerLoad) : null;
  } catch {
    return null;
  }
}
