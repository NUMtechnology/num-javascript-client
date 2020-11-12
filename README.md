# NUM JS Client

A JS client for the NUM protocol.

See the full [Specification](https://www.numprotocol.com/specification) at the [NUM Protocol Website](https://www.numprotocol.com) and the [Explainer](https://www.num.uk/explainer) for more information.

The NUM protocol supports a range of [modules](https://www.numprotocol.com/modules) that add rich functionality in an extensible way.

## The NUM URI Scheme

The NUM protocol uses the familiar URL format for its URIs and allows [modules](https://www.numprotocol.com/modules) to interpret data in a variety of ways.

The data stored in a NUM Record is converted to JSON String format that can be parsed into JSON objects and Java
objects for straightforward incorporation into Java programs. Here are some example NUM URIs with [module `1` - the Contacts module](https://www.numprotocol.com/modules/1). The default module is `0` (zero) if no module is specified, which has no module schema.

- `num://numexample.com:1`
- `num://jo.smith@numexample.com:1`
- `num://jo.smith@numexample.com:1/work`
- `num://jo.smith@numexample.com:1/personal`
- `num://jo.smith@numexample.com:1/hobbies`
- `num://numexample.com:1/support`
- `num://numexample.com:1/support/website`
- `num://numexample.com:1/support/delivery`
- `num://numexample.com:1/enquiries`
- `num://numexample.com:1/sales`

As you can see from the examples above, data can be associated with domains and email addresses, and can be organised hierarchically if desired. In future, the protocol will support more than just domains and email addresses.

Additional modules can be referenced in the same way as `ports` in other URIs:

- `num://numexample.com:2` for the [`Registrant` module](https://www.numprotocol.com/modules/2).
- `num://numexample.com:3` for the [`Images` module](https://www.numprotocol.com/modules/3).
- `num://numexample.com:4` for the [`Custodians` module](https://www.numprotocol.com/modules/4).
- `num://numexample.com:5` for the [`Payments` module](https://www.numprotocol.com/modules/5).
- `num://numexample.com:6` for the [`Regulatory` module](https://www.numprotocol.com/modules/6).
- `num://numexample.com:7` for the [`Public Key` module](https://www.numprotocol.com/modules/7).
- `num://numexample.com:8` for the [`Intellectual Property` module](https://www.numprotocol.com/modules/8).
- `num://numexample.com:9` for the [`Terms` module](https://www.numprotocol.com/modules/9).
- `num://numexample.com:10` for the [`Bugs` module](https://www.numprotocol.com/modules/10).
- `num://numexample.com:nn` for your own module?

## Adding Support for the NUM Protocol

1. Add the following line to your `package.json` file in your JS or Flutter project:

```json
"dependencies": {
    "num-client": "git+ssh://git@github.com:NUMtechnology/num-javascript-client.git#v0.0.1",
    ...
}
```

2. Run `npm install` or equivalent for your project

Note: keep an eye on the releases and update the version number as neccessary to get the latest version.

# Examples

## The Simplest Usage
If NUM protocol parameters are not needed then the programming interface is very simple.

```typescript
import { createClient } from '../lib/client';
import { parseNumUri } from '../lib/numuri';

const lookup = async () => {
  const numUri = parseNumUri('num.uk:1');             // Parse the NUM URI
  const client = createClient();                      // Create a NumClient
  const ctx = client.begin(numUri);                   // Set the lookup context
  const result = await client.retrieveNumRecord(ctx); // Use the context to retrieve a NUM record
  console.log(result)                                 // Handle the result
}
```
## Reusing the `NUMClient`
The same `NUMClient` can be reused for multiple lookups, as in this example:
```Typescript
import { createClient } from '../lib/client';
import { createDnsClient, DoHResolver } from '../lib/dnsclient';

const lookup = async () => {
  const numUri1 = parseNumUri('num.uk:1');
  const numUri2 = parseNumUri('numexample.com:1');

  const client = createClient();            // This client is reused for multiple contexts

  const ctx1 = client.begin(numUri1);
  const ctx2 = client.begin(numUri2);

  const result1 = client.retrieveNumRecord(ctx1);
  const result2 = client.retrieveNumRecord(ctx2);

  const result = await Promise.all([result1, result2]);

  console.log(result[0]);
  console.log(result[1]);
}
```
## Overriding the Default DoH Endpoint
By default the `NUMClient` uses the Google DoH resolver, but it can be changed if required:
```Typescript
import { createClient } from '../lib/client';
import { createDnsClient, DoHResolver } from '../lib/dnsclient';
import { parseNumUri } from '../lib/numuri';

const lookup = async () => {
  // ...
  const DEFAULT_RESOLVER = new DoHResolver('Google', 'https://dns.google.com/resolve');
  const dnsClient = createDnsClient(DEFAULT_RESOLVER);

  const client = createClient(dnsClient); // Use a custom DNS client
  // ...
};
```
## Providing User Variable Values
Some modules can be provided with User Variable values to customise the output, as in this example:
```typescript
import { createClient } from '../lib/client';
import { parseNumUri } from '../lib/numuri';

const lookup = async () => {
  const numUri = parseNumUri('num.uk:1');             // Parse the NUM URI
  const client = createClient();                      // Create a NumClient
  const ctx = client.begin(numUri);                   // Set the lookup context

  ctx.setUserVariable('_L', 'en-us');                 // Set the user's language
  ctx.setUserVariable('_C', 'us');                    // Set the user's country

  const result = await client.retrieveNumRecord(ctx); // Use the context to retrieve a NUM record
  console.log(result)                                 // Handle the result
}
```
## Using a `CallbackHandler`
Lookups _can_ take several seconds, so you can provide a `CallbackHandler` rather than `await`ing the results:
```Typescript
import { CallbackHandler, createClient } from '../lib/client';
import { parseNumUri } from '../lib/numuri';
import { Location } from '../lib/context';

const lookup = async () => {
  const numUri = parseNumUri('num.uk:1');             // Parse the NUM URI
  const client = createClient();                      // Create a NumClient
  const ctx = client.begin(numUri);                   // Set the lookup context

  const handler: CallbackHandler = {                  // Provide a custom CallbackHandler
    setLocation: (l: Location): void => {
      console.log(l);
    },
    setResult: (r: string): void => {
      console.log(r);
    },
  };

  client.retrieveNumRecord(ctx, handler).then((_r) => {
    // Ignore because the callback handler will handle it
  });
}
```