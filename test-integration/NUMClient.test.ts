import { expect } from 'chai';
import { createClient, createDefaultCallbackHandler } from '../lib/client';
import { parseNumUri } from '../lib/numuri';
import loglevel, { Logger } from 'loglevel';

const log = loglevel as Logger;

log.setLevel('debug');

describe('NUMClient', () => {
  it('should be able to create a new NUMClient', () => {
    const client = createClient();
    expect(client).not.to.be.null;
  });

  it('should be able to lookup a NUM record using the NUMClient', async () => {
    const numUri = parseNumUri('num.uk:1');
    const handler = createDefaultCallbackHandler();

    const client = createClient();
    const ctx = client.begin(numUri);
    const result = await client.retrieveNumRecord(ctx, handler);
    expect(result).not.to.be.null;
    expect(result).to.equal("@n=1;o(n=NUM;c[(tw(v=NUMprotocol));(li(v=company/20904983))];s=Organising the world's open data)");
  });

  it('should fail to lookup a NUM record using the NUMClient', async () => {
    const numUri = parseNumUri('ldskfhlskdhflkdsjhfkdhlsdhflasdh.uk:1');
    const handler = createDefaultCallbackHandler();

    const client = createClient();
    const ctx = client.begin(numUri);
    const result = await client.retrieveNumRecord(ctx, handler);
    expect(result).to.be.null;
  });
});
