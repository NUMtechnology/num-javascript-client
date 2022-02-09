
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { expect } from 'chai';
import { AxiosProxy } from '../src/axiosproxy';
import { DoHResolver } from '../src/dnsclient';
import { createDnsServices } from '../src/dnsservices';
import pino from 'pino';

const log = pino();

class servFailProxy implements AxiosProxy {
  async get(url: string, config?: AxiosRequestConfig | undefined): Promise<AxiosResponse<any>> {

    log.warn('----------> Sending SERVFAIL');

    const data = {
      Status: 2
    };

    const result: AxiosResponse = {
      data: data,
      status: 200,
      statusText: 'OK',
      headers: [],
      config: {},
      request: null,
    };

    return new Promise<AxiosResponse<any>>(resolve => setTimeout(() => resolve(result), 200));
  }
}

describe('SERVFAIL Tests', () => {
  it('should be able to handle DNS SERVFAIL gracefully', () => {

    const resolvers = [
      new DoHResolver('Resolver 1', 'dummyResolverUrl')
    ];
    const service = createDnsServices(1000, resolvers, new servFailProxy());

    return service.getRecordFromDns('dummy.com', false).then(result => {
      expect(result).to.equal('');
    }, (err) => {
      expect.fail('Expected empty result');
    });
  });
});
