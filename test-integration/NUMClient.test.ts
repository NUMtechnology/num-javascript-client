/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-template-curly-in-string */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
import { fail } from 'assert';
import { expect } from 'chai';
import deepEql from 'deep-eql';
import { CallbackHandler, createClient, createDefaultCallbackHandler } from '../src/client';
import { NumLocation } from '../src/context';
import { DoHResolver } from '../src/dnsclient';
import { NumProtocolErrorCode } from '../src/exceptions';
import { parseNumUri } from '../src/numuri';
import { log, Level } from 'num-easy-log';

const DEFAULT_RESOLVERS = [
  new DoHResolver('BAD', 'https://jhsgfdjhsgdkweg32767236eddghagsf.com/dns-query'),
  new DoHResolver('Cloudflare', 'https://cloudflare-dns.com/dns-query'),
];

describe('NUMClient', () => {
  it('should be able to create a new NUMClient', () => {
    const client = createClient(DEFAULT_RESOLVERS);
    log.setLevel(Level.info);
    expect(client).not.equal(null);
  });

  it('should be able to lookup a NUM record using the NUMClient', async () => {
    const numUri = parseNumUri('num.uk:1');
    const handler = createDefaultCallbackHandler();

    const client = createClient();
    log.setLevel(Level.info);

    const ctx = client.createContext(numUri);
    const result = await client.retrieveNumRecordJson(ctx, handler);

    expect(result).not.equal(null);

    const expected = '{"@n":1,"@p":true,"o":{"n":"NUM","c":[{"u":"num.uk"}]}}';
    const same = deepEql(JSON.parse(result as string), JSON.parse(expected));
    if (!same) {
      log.info(`Actual  : ${result}`);
      log.info(`Expected: ${expected}`);
    }
    expect(same).to.equal(true);
  });

  it('should be able to lookup a NUM record using the NUMClient when the INDEPENDENT record is invalid MODL', async () => {
    const numUri = parseNumUri('seswater.co.uk:1');
    const handler = createDefaultCallbackHandler();

    const client = createClient();
    log.setLevel(Level.info);

    const ctx = client.createContext(numUri);
    const result = await client.retrieveNumRecordJson(ctx, handler);

    expect(result).not.equal(null);

    const expected =
      '{"@n":1,"o":{"n":"SES Water","c":[{"u":{"v":"seswater.co.uk/your-account/moving-home/moving-into-our-area/moving-into-our-area-form","d":"Moving Home New Customers"}},{"u":{"v":"ip.e-paycapita.com/AIP/accountSearch.do?link=showAccountSearchPage&requestId=pk0znolfk2tpa4u9kkgtted9ntd03uo","d":"Make a Payment Online"}},{"t":{"v":"+44173 777 2000","d":"Customer Services","h":{"tz":"LON","av":["wd@9-17"]}}},{"t":{"v":"+44800 587 2936","d":"Automated Freephone Payment Line","h":{"tz":"LON","av":["d@0-24"]}}},{"t":{"v":"+44173 777 2000","d":"Emergency Line","h":{"tz":"LON","av":["d@0-24"]}}},{"t":{"v":"+44845 920 0800","d":"Thames Water 24 hour Service","h":{"tz":"LON","av":["d@0-24"]}}},{"t":{"v":"+44845 278 0845","d":"Southern Water 24 hour Service","h":{"tz":"LON","av":["d@0-24"]}}},{"tw":{"v":"SESWater"}},{"fb":{"v":"SESWaterOfficial"}},{"li":{"v":"company/seswater"}}]}}';
    const same = deepEql(JSON.parse(result as string), JSON.parse(expected));
    if (!same) {
      log.info(`Actual  : ${result}`);
      log.info(`Expected: ${expected}`);
    }
    expect(same).to.equal(true);
  });

  it('should be able to lookup a NUM record using the NUMClient with a custom CallbackHandler', async () => {
    const numUri = parseNumUri('num.uk:1');
    const handler: CallbackHandler = {
      setLocation: (_l: NumLocation): void => {
        // ignore
      },
      setResult: (r: string): void => {
        expect(r).not.equal(null);
      },
      setErrorCode(e: NumProtocolErrorCode): void {
        fail('Unexpected error');
      },
    };

    const client = createClient(DEFAULT_RESOLVERS);
    log.setLevel(Level.info);

    const ctx = client.createContext(numUri);
    await client.retrieveNumRecordJson(ctx, handler).then((r) => {
      const expected = '{"@n":1,"@p":true,"o":{"n":"NUM","c":[{"u":"num.uk"}]}}';

      if (r) {
        const same = deepEql(JSON.parse(r), JSON.parse(expected));
        if (!same) {
          log.info(`Actual  : ${r}`);
          log.info(`Expected: ${expected}`);
        }
        expect(same).to.equal(true);
      } else {
        fail('Result "r" is null');
      }
    });
  });

  it('should fail to lookup a NUM record using the NUMClient', async () => {
    const numUri = parseNumUri('ldskfhlskdhflkdsjhfkdhlsdhflasdh.uk:1');
    const handler: CallbackHandler = {
      setLocation: (_l: NumLocation): void => {
        // ignore
      },
      setResult: (r: string): void => {
        expect(r).not.equal(null);
      },
      setErrorCode(e: NumProtocolErrorCode): void {
        expect(e).equal(NumProtocolErrorCode.noModlRecordFound);
      },
    };

    const client = createClient(DEFAULT_RESOLVERS);
    log.setLevel(Level.info);
    const ctx = client.createContext(numUri);
    const result = await client.retrieveNumRecordJson(ctx, handler);
    expect(result).equal(null);
  });

  it('should be able to do multiple parallel lookups for a NUM record using the NUMClient', async () => {
    const numUri1 = parseNumUri('axa.co.uk:1');
    const numUri2 = parseNumUri('aviva.co.uk:1');
    const numUri3 = parseNumUri('lloydsbank.com:1');

    const client = createClient();
    log.setLevel(Level.info);

    const ctx1 = client.createContext(numUri1);
    const ctx2 = client.createContext(numUri2);
    const ctx3 = client.createContext(numUri3);

    const result1 = client.retrieveNumRecordJson(ctx1);
    const result2 = client.retrieveNumRecordJson(ctx2);
    const result3 = client.retrieveNumRecordJson(ctx3);

    const result = await Promise.all([result1, result2, result3]);

    expect(result).not.equal(null);
    expect(result[0]).not.equal(null);
    expect(result[1]).not.equal(null);
    expect(result[2]).not.equal(null);
  });
});
