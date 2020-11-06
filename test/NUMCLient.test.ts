import { expect } from 'chai';
import { createClient, DefaultCallbackHandler, Hostname, MODULE_1, NumUri } from '../lib/client';

describe('NUMClient', () => {
  it('should be able to create a new NUMClient', () => {
    const client = createClient();
    expect(client).not.to.be.null;
  });

  it('should be able to lookup a NUM record using the NUMClient', async () => {
    const host = new Hostname('num.uk');
    const numUri = new NumUri(host, MODULE_1);
    const handler = new DefaultCallbackHandler();

    const client = createClient();
    const ctx = client.begin(numUri);
    const result = await client.retrieveNumRecord(ctx, handler);
    expect(result).not.to.be.null;
    expect(result).to.equal('TODO: a valid num record');
  });
});
