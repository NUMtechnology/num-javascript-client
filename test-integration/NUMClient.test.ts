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
import loglevel, { Logger } from 'loglevel';
import { CallbackHandler, createClient, createDefaultCallbackHandler } from '../src/client';
import { NumLocation } from '../src/context';
import { createDnsClient, DoHResolver } from '../src/dnsclient';
import { parseNumUri } from '../src/numuri';
import { ResourceLoader } from '../src/resourceloader';


const log = loglevel as Logger;

log.setLevel('info');

const DEFAULT_RESOLVER = new DoHResolver('Google', 'https://dns.google.com/resolve');
const dnsClient = createDnsClient(DEFAULT_RESOLVER);

describe('NUMClient', () => {
  it('should be able to create a new NUMClient', () => {
    const client = createClient(dnsClient);
    expect(client).not.equal(null);
  });

  it('should be able to lookup a NUM record using the NUMClient', async () => {
    const numUri = parseNumUri('num.uk:1');
    const handler = createDefaultCallbackHandler();

    const client = createClient();
    client.setResourceLoader(new DummyResourceLoader());

    const ctx = client.createContext(numUri);
    const result = await client.retrieveNumRecord(ctx, handler);

    expect(result).not.equal(null);

    const expected = '{"@n":1,"organisation":{"name":"NUM","contacts":[{"twitter":{"value":"NUMprotocol","object_display_name":"Twitter","description_default":"View Twitter profile","prefix":"https://www.twitter.com/","method_type":"third_party","value_prefix":"@","controller":"twitter.com"}},{"linkedin":{"value":"company/20904983","object_display_name":"LinkedIn","description_default":"View LinkedIn page","prefix":"https://www.linkedin.com/","method_type":"third_party","controller":"linkedin.com"}}],"slogan":"Organising the world\'s open data","object_display_name":"Organisation","description_default":"View Organisation"}}';
    const same = deepEql(
      JSON.parse(result as string),
      JSON.parse(expected)
    );
    if (!same) {
      console.log(`Actual  : ${result}`);
      console.log(`Expected: ${expected}`);
    }
    expect(same).to.equal(true);
  });

  it('should be able to lookup a NUM record using the NUMClient and custom user variables', async () => {
    const numUri = parseNumUri('num.uk:1');
    const handler = createDefaultCallbackHandler();

    const client = createClient(dnsClient);
    client.setResourceLoader(new DummyResourceLoader());

    const ctx = client.createContext(numUri);
    ctx.setUserVariable('_L', 'en-us');
    ctx.setUserVariable('_C', 'us');

    const result = await client.retrieveNumRecord(ctx, handler);
    expect(result).not.equal(null);
    const expected = '{"@n":1,"organisation":{"name":"NUM","contacts":[{"twitter":{"value":"NUMprotocol","object_display_name":"Twitter","description_default":"View Twitter profile","prefix":"https://www.twitter.com/","method_type":"third_party","value_prefix":"@","controller":"twitter.com"}},{"linkedin":{"value":"company/20904983","object_display_name":"LinkedIn","description_default":"View LinkedIn page","prefix":"https://www.linkedin.com/","method_type":"third_party","controller":"linkedin.com"}}],"slogan":"Organising the world\'s open data","object_display_name":"Organization","description_default":"View Organization"}}';
    const same = deepEql(
      JSON.parse(result as string),
      JSON.parse(expected)
    );
    if (!same) {
      console.log(`Actual  : ${result}`);
      console.log(`Expected: ${expected}`);
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
    };

    const client = createClient(dnsClient);
    client.setResourceLoader(new DummyResourceLoader());

    const ctx = client.createContext(numUri);
    await client.retrieveNumRecord(ctx, handler).then((r) => {
      const expected = '{"@n":1,"organisation":{"name":"NUM","contacts":[{"twitter":{"value":"NUMprotocol","object_display_name":"Twitter","description_default":"View Twitter profile","prefix":"https://www.twitter.com/","method_type":"third_party","value_prefix":"@","controller":"twitter.com"}},{"linkedin":{"value":"company/20904983","object_display_name":"LinkedIn","description_default":"View LinkedIn page","prefix":"https://www.linkedin.com/","method_type":"third_party","controller":"linkedin.com"}}],"slogan":"Organising the world\'s open data","object_display_name":"Organisation","description_default":"View Organisation"}}';

      if (r) {

        const same = deepEql(
          JSON.parse(r),
          JSON.parse(expected)
        );
        if (!same) {
          console.log(`Actual  : ${r}`);
          console.log(`Expected: ${expected}`);
        }
        expect(same).to.equal(true);
      } else {
        fail('Result "r" is null');
      }
    });
  });

  it('should fail to lookup a NUM record using the NUMClient', async () => {
    const numUri = parseNumUri('ldskfhlskdhflkdsjhfkdhlsdhflasdh.uk:1');
    const handler = createDefaultCallbackHandler();

    const client = createClient(dnsClient);
    const ctx = client.createContext(numUri);
    const result = await client.retrieveNumRecord(ctx, handler);
    expect(result).equal(null);
  });

  it('should be able to do multiple parallel lookups for a NUM record using the NUMClient', async () => {
    const numUri1 = parseNumUri('num.uk:1');
    const numUri2 = parseNumUri('num.uk:1');
    const numUri3 = parseNumUri('num.uk:1');

    const client = createClient();
    client.setResourceLoader(new DummyResourceLoader());

    const ctx1 = client.createContext(numUri1);
    const ctx2 = client.createContext(numUri2);
    const ctx3 = client.createContext(numUri3);

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

class DummyResourceLoader implements ResourceLoader {
  load(url: URL): Promise<string | null> {
    const urlStr = url.toString();

    if (urlStr.includes('schema-map')) {
      return new Promise<string | null>((resolve) => {
        const map = {
          '@n': {
            'return': {
              '@n': '${@n}'
            }
          },
          'o': {
            'key': 'organisation',
            'assign': [
              'n',
              's',
              'c',
              'h'
            ],
            'return': {
              'object_display_name': '%locale.o.name',
              'description_default': '%locale.o.default',
              'name': '${n}',
              'slogan': '${s}',
              'contacts': '${c}',
              'hours': '${h}'
            }
          },
          'fb': {
            'key': 'facebook',
            'assign': [
              'v',
              'd'
            ],
            'return': {
              'object_display_name': '%locale.fb.name',
              'description_default': '%locale.fb.default',
              'description': '${d}',
              'prefix': 'https://www.facebook.com/',
              'method_type': 'third_party',
              'controller': 'facebook.com',
              'value': '${v}'
            }
          },
          'in': {
            'key': 'instagram',
            'assign': [
              'v',
              'd'
            ],
            'return': {
              'object_display_name': '%locale.in.name',
              'description_default': '%locale.in.default',
              'description': '${d}',
              'prefix': 'https://www.instagram.com/',
              'method_type': 'third_party',
              'controller': 'instagram.com',
              'value': '${v}'
            }
          },
          'li': {
            'key': 'linkedin',
            'assign': [
              'v',
              'd'
            ],
            'return': {
              'object_display_name': '%locale.li.name',
              'description_default': '%locale.li.default',
              'description': '${d}',
              'prefix': 'https://www.linkedin.com/',
              'method_type': 'third_party',
              'controller': 'linkedin.com',
              'value': '${v}'
            }
          },
          'pi': {
            'key': 'pinterest',
            'assign': [
              'v',
              'd'
            ],
            'return': {
              'object_display_name': '%locale.pi.name',
              'description_default': '%locale.pi.default',
              'description': '${d}',
              'prefix': 'https://www.pinterest.com/',
              'method_type': 'third_party',
              'controller': 'pinterest.com',
              'value': '${v}'
            }
          },
          'tw': {
            'key': 'twitter',
            'assign': [
              'v',
              'd'
            ],
            'return': {
              'object_display_name': '%locale.tw.name',
              'description_default': '%locale.tw.default',
              'description': '${d}',
              'prefix': 'https://www.twitter.com/',
              'method_type': 'third_party',
              'controller': 'twitter.com',
              'value': '${v}',
              'value_prefix': '@'
            }
          },
          't': {
            'key': 'telephone',
            'assign': [
              'v',
              'd'
            ],
            'return': {
              'object_display_name': '%locale.t.name',
              'description_default': '%locale.t.default',
              'description': '${d}',
              'prefix': 'tel:',
              'method_type': 'core',
              'value': '${v}'
            }
          }
        };
        resolve(JSON.stringify(map));
      });
    }
    if (urlStr.includes('locales') && urlStr.includes('en-gb')) {
      return new Promise<string | null>((resolve) => {
        const locale = {
          'locale.o.name': 'Organisation',
          'locale.o.default': 'View Organisation',
          'locale.tw.name': 'Twitter',
          'locale.tw.default': 'View Twitter profile',
          'locale.li.name': 'LinkedIn',
          'locale.li.default': 'View LinkedIn page',
        };
        resolve(JSON.stringify(locale));
      });
    }
    if (urlStr.includes('locales') && urlStr.includes('en-us')) {
      return new Promise<string | null>((resolve) => {
        const locale = {
          'locale.o.name': 'Organization',
          'locale.o.default': 'View Organization',
          'locale.tw.name': 'Twitter',
          'locale.tw.default': 'View Twitter profile',
          'locale.li.name': 'LinkedIn',
          'locale.li.default': 'View LinkedIn page',
        };
        resolve(JSON.stringify(locale));
      });
    }
    return new Promise<string | null>((resolve) => {
      resolve(null);
    });
  }

}