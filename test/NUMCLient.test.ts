import { fail } from 'assert';
import { expect } from 'chai';
import {
  Context,
  createClient,
  DefaultCallbackHandler,
  Hostname,
  MODULE_1,
  NumClientOptions,
  NumUri,
} from '../lib/client';

describe('NUMClient', () => {
  it('should be able to create a new NUMClient', () => {
    const host = new Hostname('num.uk');
    const numUri = new NumUri(host, MODULE_1);

    const client = createClient(numUri, new NumClientOptions());
    expect(client).not.to.be.null;
  });

  it('should be able to lookup a NUM record using the NUMClient', () => {
    const host = new Hostname('num.uk');
    const numUri = new NumUri(host, MODULE_1);
    const handler = new DefaultCallbackHandler();

    const client = createClient(numUri, new NumClientOptions());

    const promise = client.retrieveNumRecord(new Context(), handler);
    expect(promise).not.to.be.null;

    promise.then(
      (result) => {
        expect(result).to.equal('TODO: a valid num record');
      },
      (reason) => {
        fail(reason);
      }
    );
  });
});
