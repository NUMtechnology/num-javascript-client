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
import { DummyResourceLoader } from './DummyResourceLoader';
import { log, Level } from 'num-easy-log';

const DEFAULT_RESOLVERS = [
  new DoHResolver('BAD', 'https://jhsgfdjhsgdkweg32767236eddghagsf.com/dns-query'),
  new DoHResolver('Cloudflare', 'https://cloudflare-dns.com/dns-query'),
];

const dummyResourceLoader = new DummyResourceLoader();

describe('NUMClient', () => {
  it('should be able to create a new NUMClient', () => {
    const client = createClient(DEFAULT_RESOLVERS);
    log.setLevel(Level.info);
    client.setResourceLoader(dummyResourceLoader);
    expect(client).not.equal(null);
  });

  it('should be able to lookup a NUM record using the NUMClient', async () => {
    const numUri = parseNumUri('num.uk:1');
    const handler = createDefaultCallbackHandler();

    const client = createClient();
    log.setLevel(Level.info);
    client.setResourceLoader(dummyResourceLoader);

    const ctx = client.createContext(numUri);
    ctx.setTargetExpandedSchemaVersion('2');
    const result = await client.retrieveNumRecord(ctx, handler);

    expect(result).not.equal(null);

    const expected =
      '{"@n":1,"@version":2,"object_type":"organization","object_display_name":"Organization","name":"NUM","slogan":"Organising the world\'s open data","contacts":[{"method_type":"twitter","method_display_name":"Twitter","description_default":"View Twitter profile","description":null,"action":"https://www.twitter.com/NUMprotocol","controller":"twitter.com","value":"@NUMprotocol"},{"method_type":"linkedin","method_display_name":"LinkedIn","description_default":"View LinkedIn page","description":null,"action":"https://www.linkedin.com/company/20904983","controller":"linkedin.com","value":"/company/20904983"}]}';
    const same = deepEql(JSON.parse(result as string), JSON.parse(expected));
    if (!same) {
      log.info(`Actual  : ${result}`);
      log.info(`Expected: ${expected}`);
    }
    expect(same).to.equal(true);
  });

  it('should be able to disable schema validation.', async () => {
    const numUri = parseNumUri('num.uk:1');
    const handler = createDefaultCallbackHandler();

    const client = createClient();
    client.disableSchemaValidation();

    log.setLevel(Level.info);
    client.setResourceLoader(dummyResourceLoader);

    const ctx = client.createContext(numUri);
    ctx.setTargetExpandedSchemaVersion('2');
    const result = await client.retrieveNumRecord(ctx, handler);

    expect(result).not.equal(null);

    const expected =
      '{"@n":1,"@version":2,"object_type":"organization","object_display_name":"Organization","name":"NUM","slogan":"Organising the world\'s open data","contacts":[{"method_type":"twitter","method_display_name":"Twitter","description_default":"View Twitter profile","description":null,"action":"https://www.twitter.com/NUMprotocol","controller":"twitter.com","value":"@NUMprotocol"},{"method_type":"linkedin","method_display_name":"LinkedIn","description_default":"View LinkedIn page","description":null,"action":"https://www.linkedin.com/company/20904983","controller":"linkedin.com","value":"/company/20904983"}]}';
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
    client.setResourceLoader(dummyResourceLoader);

    const ctx = client.createContext(numUri);
    ctx.setTargetExpandedSchemaVersion('2');
    const result = await client.retrieveNumRecord(ctx, handler);

    expect(result).not.equal(null);

    const expected =
      '{"@n":1,"@version":2,"object_type":"organization","object_display_name":"Organization","name":"SES Water","slogan":null,"contacts":[{"method_type":"url","method_display_name":"Web URL","description_default":"Click","description":"Moving Home New Customers","action":"https://seswater.co.uk/your-account/moving-home/moving-into-our-area/moving-into-our-area-form","value":"seswater.co.uk/your-account/moving-home/moving-into-our-area/moving-into-our-area-form","controller":null},{"method_type":"url","method_display_name":"Web URL","description_default":"Click","description":"Make a Payment Online","action":"https://ip.e-paycapita.com/AIP/accountSearch.do?link=showAccountSearchPage&requestId=pk0znolfk2tpa4u9kkgtted9ntd03uo","value":"ip.e-paycapita.com/AIP/accountSearch.do?link=showAccountSearchPage&requestId=pk0znolfk2tpa4u9kkgtted9ntd03uo","controller":null},{"method_type":"telephone","method_display_name":"Telephone","description_default":"Call","description":"Customer Services","action":"tel:+44173 777 2000","value":"+44173 777 2000","controller":null,"hours":{"time_zone_location":"LON","available":["wd@9-17"]}},{"method_type":"telephone","method_display_name":"Telephone","description_default":"Call","description":"Automated Freephone Payment Line","action":"tel:+44800 587 2936","value":"+44800 587 2936","controller":null,"hours":{"time_zone_location":"LON","available":["d@0-24"]}},{"method_type":"telephone","method_display_name":"Telephone","description_default":"Call","description":"Emergency Line","action":"tel:+44173 777 2000","value":"+44173 777 2000","controller":null,"hours":{"time_zone_location":"LON","available":["d@0-24"]}},{"method_type":"telephone","method_display_name":"Telephone","description_default":"Call","description":"Thames Water 24 hour Service","action":"tel:+44845 920 0800","value":"+44845 920 0800","controller":null,"hours":{"time_zone_location":"LON","available":["d@0-24"]}},{"method_type":"telephone","method_display_name":"Telephone","description_default":"Call","description":"Southern Water 24 hour Service","action":"tel:+44845 278 0845","value":"+44845 278 0845","controller":null,"hours":{"time_zone_location":"LON","available":["d@0-24"]}},{"method_type":"twitter","method_display_name":"Twitter","description_default":"View Twitter profile","description":null,"action":"https://www.twitter.com/SESWater","controller":"twitter.com","value":"@SESWater"},{"method_type":"facebook","method_display_name":"Facebook","description_default":"View Facebook profile","description":null,"action":"https://www.facebook.com/SESWaterOfficial","controller":"facebook.com","value":"/SESWaterOfficial"},{"method_type":"linkedin","method_display_name":"LinkedIn","description_default":"View LinkedIn page","description":null,"action":"https://www.linkedin.com/company/seswater","controller":"linkedin.com","value":"/company/seswater"}]}';
    const same = deepEql(JSON.parse(result as string), JSON.parse(expected));
    if (!same) {
      log.info(`Actual  : ${result}`);
      log.info(`Expected: ${expected}`);
    }
    expect(same).to.equal(true);
  });

  it('should be able to lookup a NUM record using the NUMClient and custom user variables', async () => {
    const numUri = parseNumUri('num.uk:1');
    const handler = createDefaultCallbackHandler();

    const client = createClient(DEFAULT_RESOLVERS);
    log.setLevel(Level.info);
    client.setResourceLoader(dummyResourceLoader);

    const ctx = client.createContext(numUri);
    ctx.setTargetExpandedSchemaVersion('2');
    ctx.setUserVariable('_L', 'en');
    ctx.setUserVariable('_C', 'us');

    const result = await client.retrieveNumRecord(ctx, handler);
    expect(result).not.equal(null);
    const expected =
      '{"@n":1,"@version":2,"object_type":"organization","object_display_name":"Organization","name":"NUM","slogan":"Organising the world\'s open data","contacts":[{"method_type":"twitter","method_display_name":"Twitter","description_default":"View Twitter profile","description":null,"action":"https://www.twitter.com/NUMprotocol","controller":"twitter.com","value":"@NUMprotocol"},{"method_type":"linkedin","method_display_name":"LinkedIn","description_default":"View LinkedIn page","description":null,"action":"https://www.linkedin.com/company/20904983","controller":"linkedin.com","value":"/company/20904983"}]}';
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
    client.setResourceLoader(dummyResourceLoader);

    const ctx = client.createContext(numUri);
    ctx.setTargetExpandedSchemaVersion('2');
    await client.retrieveNumRecord(ctx, handler).then((r) => {
      const expected =
        '{"@n":1, "@version":2,"object_type":"organization","object_display_name":"Organization","name":"NUM","slogan":"Organising the world\'s open data","contacts":[{"method_type":"twitter","method_display_name":"Twitter","description_default":"View Twitter profile","description":null,"action":"https://www.twitter.com/NUMprotocol","controller":"twitter.com","value":"@NUMprotocol"},{"method_type":"linkedin","method_display_name":"LinkedIn","description_default":"View LinkedIn page","description":null,"action":"https://www.linkedin.com/company/20904983","controller":"linkedin.com","value":"/company/20904983"}]}';

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
    client.setResourceLoader(dummyResourceLoader);
    const ctx = client.createContext(numUri);
    ctx.setTargetExpandedSchemaVersion('2');
    const result = await client.retrieveNumRecord(ctx, handler);
    expect(result).equal(null);
  });

  it('should be able to do multiple parallel lookups for a NUM record using the NUMClient', async () => {
    const numUri1 = parseNumUri('axa.co.uk:1');
    const numUri2 = parseNumUri('aviva.co.uk:1');
    const numUri3 = parseNumUri('lloydsbank.com:1');

    const client = createClient();
    log.setLevel(Level.info);
    client.setResourceLoader(dummyResourceLoader);

    const ctx1 = client.createContext(numUri1);
    ctx1.setTargetExpandedSchemaVersion('2');
    const ctx2 = client.createContext(numUri2);
    ctx2.setTargetExpandedSchemaVersion('2');
    const ctx3 = client.createContext(numUri3);
    ctx3.setTargetExpandedSchemaVersion('2');

    const result1 = client.retrieveNumRecord(ctx1);
    const result2 = client.retrieveNumRecord(ctx2);
    const result3 = client.retrieveNumRecord(ctx3);

    const result = await Promise.all([result1, result2, result3]);

    expect(result).not.equal(null);
    expect(result[0]).not.equal(null);
    expect(result[1]).not.equal(null);
    expect(result[2]).not.equal(null);
  });
});
