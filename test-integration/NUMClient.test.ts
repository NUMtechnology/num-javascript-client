// Copyright 2020 NUM Technology Ltd
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
import { expect } from 'chai';
import loglevel, { Logger } from 'loglevel';
import { CallbackHandler, createClient, createDefaultCallbackHandler } from '../src/client';
import { NumLocation } from '../src/context';
import { createDnsClient, DoHResolver } from '../src/dnsclient';
import { parseNumUri } from '../src/numuri';

const deepEql = require('deep-eql');

const log = loglevel as Logger;

log.setLevel('info');

const DEFAULT_RESOLVER = new DoHResolver('Google', 'https://dns.google.com/resolve');
const dnsClient = createDnsClient(DEFAULT_RESOLVER);

describe('NUMClient', () => {
  it('should be able to create a new NUMClient', () => {
    const client = createClient(dnsClient);
    expect(client).not.to.be.null;
  });

  it('should be able to lookup a NUM record using the NUMClient', async () => {
    const numUri = parseNumUri('num.uk:1');
    const handler = createDefaultCallbackHandler();

    const client = createClient();
    const ctx = client.createContext(numUri);
    const result = await client.retrieveNumRecord(ctx, handler);

    expect(result).not.to.be.null;

    const same = deepEql(
      JSON.parse(result as string),
      JSON.parse(
        '{"@n":1,"organisation":{"name":"NUM","contacts":[{"twitter":{"value":"NUMprotocol","object_type":"method","object_display_name":"Twitter","description_default":"View Twitter profile","prefix":"https://www.twitter.com/","method_type":"3p","value_prefix":"@","controller":"twitter.com"}},{"linkedin":{"value":"company/20904983","object_type":"method","object_display_name":"LinkedIn","description_default":"View LinkedIn page","prefix":"https://www.linkedin.com/","method_type":"3p","controller":"linkedin.com"}}],"slogan":"Organising the world\'s open data","object_type":"entity","object_display_name":"Organisation","description_default":"View Organisation"}}'
      )
    );
    expect(same).to.be.true;
  });

  it('should be able to lookup a NUM record using the NUMClient and custom user variables', async () => {
    const numUri = parseNumUri('num.uk:1');
    const handler = createDefaultCallbackHandler();

    const client = createClient(dnsClient);
    const ctx = client.createContext(numUri);
    ctx.setUserVariable('_L', 'en-us');
    ctx.setUserVariable('_C', 'us');

    const result = await client.retrieveNumRecord(ctx, handler);
    expect(result).not.to.be.null;
    const same = deepEql(
      JSON.parse(result as string),
      JSON.parse(
        '{"@n":1,"organisation":{"name":"NUM","contacts":[{"twitter":{"value":"NUMprotocol","object_type":"method","object_display_name":"Twitter","description_default":"View Twitter profile","prefix":"https://www.twitter.com/","method_type":"3p","value_prefix":"@","controller":"twitter.com"}},{"linkedin":{"value":"company/20904983","object_type":"method","object_display_name":"LinkedIn","description_default":"View LinkedIn page","prefix":"https://www.linkedin.com/","method_type":"3p","controller":"linkedin.com"}}],"slogan":"Organising the world\'s open data","object_type":"entity","object_display_name":"Organization","description_default":"View Organization"}}'
      )
    );
    expect(same).to.be.true;
  });

  it('should be able to lookup a NUM record using the NUMClient with a custom CallbackHandler', async () => {
    const numUri = parseNumUri('num.uk:1');
    const handler: CallbackHandler = {
      setLocation: (_l: NumLocation): void => {
        // ignore
      },
      setResult: (r: string): void => {
        expect(r).not.to.be.null;
        const same = deepEql(
          JSON.parse(r),
          JSON.parse(
            '{"@n":1,"organisation":{"name":"NUM","contacts":[{"twitter":{"value":"NUMprotocol","object_type":"method","object_display_name":"Twitter","description_default":"View Twitter profile","prefix":"https://www.twitter.com/","method_type":"3p","value_prefix":"@","controller":"twitter.com"}},{"linkedin":{"value":"company/20904983","object_type":"method","object_display_name":"LinkedIn","description_default":"View LinkedIn page","prefix":"https://www.linkedin.com/","method_type":"3p","controller":"linkedin.com"}}],"slogan":"Organising the world\'s open data","object_type":"entity","object_display_name":"Organisation","description_default":"View Organisation"}}'
          )
        );
        expect(same).to.be.true;
      },
    };

    const client = createClient(dnsClient);
    const ctx = client.createContext(numUri);
    await client.retrieveNumRecord(ctx, handler).then((_result) => {
      // Ignore because the callback handler will handle it
    });
  });

  it('should fail to lookup a NUM record using the NUMClient', async () => {
    const numUri = parseNumUri('ldskfhlskdhflkdsjhfkdhlsdhflasdh.uk:1');
    const handler = createDefaultCallbackHandler();

    const client = createClient(dnsClient);
    const ctx = client.createContext(numUri);
    const result = await client.retrieveNumRecord(ctx, handler);
    expect(result).to.be.null;
  });

  it('should be able to do multiple parallel lookups for a NUM record using the NUMClient', async () => {
    const numUri1 = parseNumUri('num.uk:1');
    const numUri2 = parseNumUri('num.uk:1');
    const numUri3 = parseNumUri('num.uk:1');

    const client = createClient();
    const ctx1 = client.createContext(numUri1);
    const ctx2 = client.createContext(numUri2);
    const ctx3 = client.createContext(numUri3);

    const result1 = client.retrieveNumRecord(ctx1);
    const result2 = client.retrieveNumRecord(ctx2);
    const result3 = client.retrieveNumRecord(ctx3);

    const result = await Promise.all([result1, result2, result3]);

    expect(result).not.to.be.null;
    expect(result[0]).not.to.be.null;
    expect(result[1]).not.to.be.null;
    expect(result[2]).not.to.be.null;
  });
});
