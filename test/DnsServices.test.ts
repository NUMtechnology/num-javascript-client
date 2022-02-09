
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { expect } from 'chai';
import { AxiosProxy } from '../src/axiosproxy';
import { Answer, DoHResolver } from '../src/dnsclient';
import { createDnsServices } from '../src/dnsservices';
import { log } from 'num-easy-log'

const REQ_COUNT = 5;
const DELAY_MULTIPLIER = 200;

class AxiosProxyDummyImpl implements AxiosProxy {
  async get(url: string, config?: AxiosRequestConfig | undefined): Promise<AxiosResponse<any>> {

    const rand = Math.random();

    // Reject some requests.
    if (rand < 0.1) {
      log.warn('----------> REJECTING');
      const delay = Math.floor(Math.random() * DELAY_MULTIPLIER);

      return new Promise<AxiosResponse<any>>((resolve, reject) => {
        setTimeout(reject, delay);
      });
    }

    if (rand < 0.2) {
      log.warn('----------> SERVER ERROR');
      const result: AxiosResponse = {
        data: null,
        status: 500,
        statusText: 'Internal Server Error',
        headers: [],
        config: {},
        request: null,

      };

      const delay = Math.floor(Math.random() * DELAY_MULTIPLIER);
      return new Promise<AxiosResponse<any>>(resolve => setTimeout(() => resolve(result), delay));
    }

    log.warn('----------> ACCEPTING');
    // Sometimes succeed!
    const answer: Answer = {
      name: 'dummy.com',
      type: 16,
      data: 'success',
      TTL: 300
    };

    const data = {
      Answer: [answer],
      Status: 0
    };

    const result: AxiosResponse = {
      data: data,
      status: 200,
      statusText: 'OK',
      headers: [],
      config: {},
      request: null,

    };

    const delay = Math.floor(Math.random() * DELAY_MULTIPLIER);
    return new Promise<AxiosResponse<any>>(resolve => setTimeout(() => resolve(result), delay));
  }
}

describe('DnsServices Tests', () => {
  it('should be able to handle DNS client fail-over gracefully', () => {

    const resolvers = [
      new DoHResolver('Resolver 1', 'dummyResolverUrl'),
      new DoHResolver('Resolver 2', 'dummyResolverUrl'),
      new DoHResolver('Resolver 3', 'dummyResolverUrl'),
      // new DoHResolver('Resolver 4', 'dummyResolverUrl'),
      // new DoHResolver('Resolver 5', 'dummyResolverUrl'),
      // new DoHResolver('Resolver 6', 'dummyResolverUrl'),
      // new DoHResolver('Resolver 7', 'dummyResolverUrl'),
      // new DoHResolver('Resolver 8', 'dummyResolverUrl'),
      // new DoHResolver('Resolver 9', 'dummyResolverUrl'),
    ];
    const service = createDnsServices(1000, resolvers, new AxiosProxyDummyImpl());

    const promises = new Array<Promise<string>>();
    for (let i = 0; i < REQ_COUNT; i++) {
      promises.push(service.getRecordFromDns('dummy.com', false));
    }

    return Promise.all(promises).then(results => {
      let failCount = 0;
      for (let i = 0; i < REQ_COUNT; i++) {
        if (results[i] !== 'success') {
          failCount++;
        }
      }
      expect(failCount).to.equal(0);
    });
  });
});
