import { createClient, NumClient, NumClientOptions, NumUri } from './client';

export function createNumClient(numAddress: NumUri, options?: NumClientOptions): NumClient {
  return createClient(numAddress, options);
}
