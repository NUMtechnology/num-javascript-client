# NUM Client

A TypeScript/JavaScript client for the NUM protocol.

See the full [Specification](https://www.numprotocol.com/specification) at the [NUM Protocol Website](https://www.numprotocol.com) and the [Explainer](https://www.num.uk/explainer) for more information.

The NUM protocol supports a range of [modules](https://www.numprotocol.com/modules) that add rich functionality in an extensible way.

## The NUM URI Scheme

The NUM protocol uses the familiar URL format for its URIs and allows [modules](https://www.numprotocol.com/modules) to interpret data in a variety of ways.

The data stored in a NUM Record is converted to JSON String format that can be parsed into JSON objects for straightforward incorporation into TypeScript and JavaScript programs. Here are some example NUM URIs with [module `1` - the Contacts module](https://www.numprotocol.com/modules/1). The default module is `0` (zero) if no module is specified, which has no module schema.

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

- `num://numexample.com:2` for the [Registrant](https://www.numprotocol.com/modules/2) module.
- `num://numexample.com:3` for the [Images](https://www.numprotocol.com/modules/3) module.
- `num://numexample.com:4` for the [Custodians](https://www.numprotocol.com/modules/4) module.
- `num://numexample.com:5` for the [Payments](https://www.numprotocol.com/modules/5) module.
- `num://numexample.com:6` for the [Regulatory](https://www.numprotocol.com/modules/6) module.
- `num://numexample.com:7` for the [Public Key](https://www.numprotocol.com/modules/7) module.
- `num://numexample.com:8` for the [Intellectual Property](https://www.numprotocol.com/modules/8) module.
- `num://numexample.com:9` for the [Terms](https://www.numprotocol.com/modules/9) module.
- `num://numexample.com:10` for the [Bugs](https://www.numprotocol.com/modules/10) module.
- `num://numexample.com:nn` for your own module?

## Adding Support for the NUM Protocol

Install using:
```shell
npm install -s num-client
```

# TypeScript Examples
## Importing the Client
Use this import to make the client available for use:
```Typescript
import {
  createClient,     // required for creating the `NUMClient`
  createDnsClient,  // optional unless you need to override the default DoH endpoint
  parseNumUri,      // required for converting the NUM URI string into a valid `NumUri` object
  CallbackHandler,  // optional unless you need to provide a custom callback handler implementation
  DoHResolver,      // optional unless you need to override the default DoH endpoint
  Location          // optional unless you need to provide a custom callback handler implementation
} from 'num-client';
```

## The Simplest Usage
The programming interface is very simple:

```typescript
const lookup = async () => {
  const numUri = parseNumUri('num.uk:1');             // Parse the NUM URI
  const client = createClient();                      // Create a NumClient
  const ctx = client.createContext(numUri);           // Set the lookup context
  ctx.setTargetExpandedSchemaVersion('2');            // Set the required expanded schema version (specific to each module but defaults to 1)
  const result = await client.retrieveNumRecord(ctx); // Use the context to retrieve a NUM record
  console.log(result);                                // Handle the result
}
```
## Reusing the `NUMClient`
The same `NUMClient` can be reused for multiple lookups, as in this example:
```Typescript
const lookup = async () => {
  const numUri1 = parseNumUri('num.uk:1');
  const numUri2 = parseNumUri('numexample.com:1');

  const client = createClient();            // This client is reused for multiple contexts

  const ctx1 = client.createContext(numUri1);
  const ctx2 = client.createContext(numUri2);
  ctx1.setTargetExpandedSchemaVersion('2');            // Set the required expanded schema version (specific to each module but defaults to 1)
  ctx2.setTargetExpandedSchemaVersion('2');            // Set the required expanded schema version (specific to each module but defaults to 1)

  const result1 = client.retrieveNumRecord(ctx1);
  const result2 = client.retrieveNumRecord(ctx2);

  const result = await Promise.all([result1, result2]);

  console.log(result[0]);
  console.log(result[1]);
}
```
## Overriding the Default DoH Endpoint
By default the `NUMClient` uses the Cloudflare and Google DoH resolvers, although it can be changed if required by providing a `DoHResolver` to a service that supports [the JSON API for DNS over HTTPS (DoH)](https://developers.google.com/speed/public-dns/docs/doh/json).:
```Typescript
const lookup = async () => {
  // ...
  const DEFAULT_RESOLVERS = [
    new DoHResolver('Cloudflare', 'https://cloudflare-dns.com/dns-query'),
    new DoHResolver('Quad9', 'https://dns10.quad9.net:5053/dns-query'),
  ];

  const client = createClient(DEFAULT_RESOLVERS); // Use a custom DoH service
  // ...
};
```
## Providing User Variable Values
Some modules can be provided with User Variable values to customise the output, as in this example:
```typescript
const lookup = async () => {
  const numUri = parseNumUri('num.uk:1');             // Parse the NUM URI
  const client = createClient();                      // Create a NumClient
  const ctx = client.createContext(numUri);           // Set the lookup context
  ctx.setTargetExpandedSchemaVersion('2');            // Set the required expanded schema version (specific to each module but defaults to 1)

  ctx.setUserVariable('_L', 'en');                    // Set the user's language
  ctx.setUserVariable('_C', 'gb');                    // Set the user's country

  const result = await client.retrieveNumRecord(ctx); // Use the context to retrieve a NUM record
  console.log(result)                                 // Handle the result
}
```
## Using a `CallbackHandler`
Lookups _can_ take several seconds, so you can provide a `CallbackHandler` rather than `await`ing the results:
```Typescript
const lookup = async () => {
  const numUri = parseNumUri('num.uk:1');             // Parse the NUM URI
  const client = createClient();                      // Create a NumClient
  const ctx = client.createContext(numUri);           // Set the lookup context
  ctx.setTargetExpandedSchemaVersion('2');            // Set the required expanded schema version (specific to each module but defaults to 1)

  const handler: CallbackHandler = {
    setLocation: (l: NumLocation): void => {
      console.log(l); // `l` is the `Location` where the result was found
    },
    setResult: (r: string): void => {
      console.log(r); // `r` is the NUM record as a JSON string
    },
    setErrorCode: (e: string): void => {
      console.log(e); // `e` is the error message
    }
  };

  client.retrieveNumRecord(ctx, handler).then((_r) => {
    // Ignore because the callback handler will handle it
  }, (err) => console.error(err));
}
```
# JavaScript Examples
## The Simplest Usage
This example shows the minimal requirements for using the NUM Client:
```javascript
const num = require('num-client');

num.lookup('num.uk:1').then((result) => console.log(result));
```
## Full Usage
This example shows how to use all features of the client, including 
- overriding the DoH resolver,
- reusing the `NUMClient`
- setting user variables
-  using a callback handler
```javascript
const num = require('num-client');

function lookup(uri1, uri2) {
  const numUri1 = num.parseNumUri(uri1);
  const numUri2 = num.parseNumUri(uri2);

  const DEFAULT_RESOLVERS = [
    new DoHResolver('Cloudflare', 'https://cloudflare-dns.com/dns-query'),
    new DoHResolver('Quad9', 'https://dns10.quad9.net:5053/dns-query'),
  ];

  const client = num.createClient(DEFAULT_RESOLVERS);

  const ctx1 = client.createContext(numUri1);
  const ctx2 = client.createContext(numUri2);
  ctx1.setTargetExpandedSchemaVersion('2');            // Set the required expanded schema version (specific to each module but defaults to 1)
  ctx2.setTargetExpandedSchemaVersion('2');            // Set the required expanded schema version (specific to each module but defaults to 1)

  ctx1.setUserVariable('_L', 'en');                    // Set the user's language
  ctx1.setUserVariable('_C', 'gb');                    // Set the user's country

  ctx2.setUserVariable('_L', 'en');                    // Set the user's language
  ctx2.setUserVariable('_C', 'us');                    // Set the user's country

  const handler = {                                    // Provide a custom CallbackHandler
    setLocation: (l) => {
      console.log(l);                                  // `l` is the `Location` where the result was found
    },
    setResult: (r) => {
      console.log(r);                                 // `r` is the NUM record as a JSON string
    },
    setErrorCode: (e) => {
      console.log(JSON.stringify(e));
    }
  };

  const result1 = client.retrieveNumRecord(ctx1, handler);
  const result2 = client.retrieveNumRecord(ctx2, handler);

  return Promise.all([result1, result2]);
}

lookup('num.uk:1', 'numexample.com:1').then((result) => {
  // Ignore because the callback handler will handle the results.
});
```
# HTML and JavaScript Example
## The Simplest Usage
This simple example can be modified as necessary by following the previous examples above.
```html
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8" />
  <title>NUM Protocol Example</title>
</head>

<body>
  <script src="../dist/bundle.js"></script>
  <h1>NUM Protocol Example</h1>
  <div>
    NUM URI = <input type="text" value="num.uk:1" id='urivalue' onchange="reloadRecord()">
    <input type="button" value="Reload" onclick="reloadRecord()">
  </div>
  <div style="border: 1px solid blue;width: fit-content;">
    <pre id='num'></pre>
  </div>
  <script>

    const CUSTOM_RESOLVERS = [
      new NumClient.DoHResolver('Cloudflare', 'https://cloudflare-dns.com/dns-query')
    ];

    const client = NumClient.createClient(CUSTOM_RESOLVERS);


    function lookup(uri) {
      const numUri = NumClient.parseNumUri(uri);

      const ctx = client.createContext(numUri);
      if(numUri.port.n === 1 ) {
        ctx.setTargetExpandedSchemaVersion('2');
      }

      return client.retrieveNumRecord(ctx);
    }

    function reloadRecord() {
      const uri = document.getElementById('urivalue').value;
      lookup(uri).then((result) => {
        const pretty = JSON.stringify(JSON.parse(result), null, 1);
        document.getElementById('num').innerHTML = pretty;
      });

    }

    window.addEventListener('load', function () {
      reloadRecord();
    });

  </script>
</body>

</html>
```
