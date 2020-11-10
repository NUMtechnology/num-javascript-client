import { expect } from 'chai';
import { createClient, createDefaultCallbackHandler } from '../lib/client';
import { parseNumUri } from '../lib/numuri';
import loglevel, { Logger } from 'loglevel';

const log = loglevel as Logger;

log.setLevel('info');

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
    expect(result).to.equal(
      '{"@n":1,"organisation":{"name":"NUM","contacts":[{"twitter":{"value":"NUMprotocol","object_type":"method","object_display_name":"Twitter","description_default":"View Twitter profile","prefix":"https://www.twitter.com/","method_type":"3p","value_prefix":"@","controller":"twitter.com"}},{"linkedin":{"value":"company/20904983","object_type":"method","object_display_name":"LinkedIn","description_default":"View LinkedIn page","prefix":"https://www.linkedin.com/","method_type":"3p","controller":"linkedin.com"}}],"slogan":"Organising the world\'s open data","object_type":"entity","object_display_name":"Organisation","description_default":"View Organisation"}}'
    );
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
