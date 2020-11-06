import { expect } from 'chai';
import { Context, createClient, DefaultCallbackHandler, Hostname, MODULE_1, NumClientOptions, NumUri } from '../lib/client';

describe('NUMClient', () => {
  it('should be able to create a new NUMClient', () => {
    const host = new Hostname('num.uk');
    const numUri = new NumUri(host, MODULE_1);

    const client = createClient(numUri, new NumClientOptions());
    expect(client).not.to.be.null;
  });

  it('should be able to lookup a NUM record using the NUMClient', async () => {
    const host = new Hostname('num.uk');
    const numUri = new NumUri(host, MODULE_1);
    const handler = new DefaultCallbackHandler();

    const client = createClient(numUri, new NumClientOptions());

    const result = await client.retrieveNumRecord(new Context(), handler);
    expect(result).not.to.be.null;
    expect(result).to.equal('TODO: a valid num record');
  });
});
