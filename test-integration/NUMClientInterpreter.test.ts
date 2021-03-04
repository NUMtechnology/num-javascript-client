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
import { expect } from 'chai';
import deepEql from 'deep-eql';
import loglevel, { Logger } from 'loglevel';
import { createClient } from '../src/client';
import { UserVariable } from '../src/context';
import { PositiveInteger } from '../src/numuri';
import { ResourceLoader } from '../src/resourceloader';


const log = loglevel as Logger;

log.setLevel('info');

describe('NUMClient with Interpreter', () => {

  it('should be able to lookup a NUM record using the NUMClient', async () => {

    const client = createClient();
    client.setResourceLoader(new DummyResourceLoader());

    const modl = '@n=1;o(n=NUM;s=Organising the world\'s open data;c[tw=NUMprotocol;li=company/20904983])';
    const moduleNumber = new PositiveInteger(1);
    const userVariables = new Map<string, UserVariable>();
    const result = await client.interpret(modl, moduleNumber, userVariables);

    expect(result).not.equal(null);

    const expected = '{"@n":1,"organisation":{"name":"NUM","contacts":[{"twitter":{"value":"NUMprotocol","object_display_name":"Twitter","description_default":"View Twitter profile","prefix":"https://www.twitter.com/","method_type":"third_party","value_prefix":"@","controller":"twitter.com"}},{"linkedin":{"value":"company/20904983","object_display_name":"LinkedIn","description_default":"View LinkedIn page","prefix":"https://www.linkedin.com/","method_type":"third_party","controller":"linkedin.com"}}],"slogan":"Organising the world\'s open data","object_display_name":"Organisation"}}';
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

});

class DummyResourceLoader implements ResourceLoader {
  private env: string;

  constructor() {
    this.env = 'test';
  }

  setenv(env: string) {
    this.env = env;
  }

  load(urlStr: string): Promise<Record<string, unknown> | null> {

    log.info(`Dummy resource loader loading: ${urlStr}`);

    if (urlStr.includes('/1/module-spec.json')) {
      return new Promise<Record<string, unknown> | null>((resolve) => {
        const module1 = {
          "module": 1,
          "version": 1,
          "compactSchemaUrl": `https://${this.env}.modules.numprotocol.com/1/compact-schema.json`,
          "expandedSchemaUrl": `https://${this.env}.modules.numprotocol.com/1/schema.json`,
          "schemaMapUrl": `https://${this.env}.modules.numprotocol.com/1/schema-map.json`,
          "localeFilesBaseUrl": `https://${this.env}.modules.numprotocol.com/1/locales/`,
          "processingChain": {
            "modlToJson": true,
            "validateCompactJson": true,
            "unpack": true,
            "validateExpandedJson": true
          }
        };
        resolve({ data: module1 });
      });
    }

    if (urlStr.includes('/1/compact-schema.json')) {
      return new Promise<Record<string, unknown> | null>((resolve) => {
        const schema = {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "$id": "https://modules.numprotocol.com/1/compact-schema.json",
          "title": "Root",
          "type": "object",
          "definitions": {
            "@n": {
              "$id": "#root/@n",
              "title": "@n",
              "type": "integer",
              "default": 1
            },
            "index": {
              "$id": "#root/index",
              "title": "index",
              "type": "array",
              "default": {},
              "items": {
                "$ref": "#root/notNullString"
              },
              "minItems": 1
            },
            "notNullString": {
              "$id": "#root/notNullString",
              "title": "notNullString",
              "type": "string",
              "nullable": false
            },
            "notEmptyString": {
              "$id": "#root/notEmptyString",
              "title": "notEmptyString",
              "type": "string",
              "minLength": 1,
              "nullable": false
            },
            "hours": {
              "$id": "#root/hours",
              "title": "hours",
              "type": "object",
              "properties": {
                "av": {
                  "type": "array",
                  "items": {
                    "$ref": "#root/notNullString"
                  }
                },
                "tz": {
                  "$ref": "#root/notNullString"
                }
              },
              "additionalProperties": false
            },
            "link": {
              "$id": "#root/link",
              "title": "link",
              "type": "object",
              "default": {},
              "properties": {
                "@L": {
                  "$ref": "#root/notEmptyString"
                },
                "d": {
                  "$ref": "#root/notNullString"
                }
              },
              "required": [
                "@L"
              ],
              "additionalProperties": false
            },
            "method": {
              "$id": "#root/method",
              "title": "method",
              "type": "object",
              "default": {},
              "properties": {
                "v": {
                  "$ref": "#root/notNullString"
                },
                "d": {
                  "$ref": "#root/notNullString"
                },
                "h": {
                  "$ref": "#root/hours"
                }
              },
              "required": [
                "v"
              ],
              "additionalProperties": false
            },
            "address": {
              "$id": "#root/address",
              "title": "address",
              "type": "object",
              "default": {},
              "properties": {
                "d": {
                  "$ref": "#root/notNullString"
                },
                "h": {
                  "$ref": "#root/hours"
                },
                "al": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                },
                "pz": {
                  "$ref": "#root/notNullString"
                },
                "co": {
                  "$ref": "#root/notNullString"
                }
              },
              "required": [
                "al"
              ],
              "additionalProperties": false
            },
            "contact": {
              "$id": "#root/contact",
              "title": "contact",
              "type": "object",
              "default": {},
              "properties": {
                "l": {
                  "$ref": "#root/link"
                },
                "a": {
                  "$ref": "#root/address"
                }
              },
              "additionalProperties": {
                "oneOf": [
                  {
                    "$ref": "#root/method"
                  },
                  {
                    "$ref": "#root/notNullString"
                  },
                  {
                    "type": "array",
                    "default": {},
                    "items": {
                      "$ref": "#root/notNullString"
                    },
                    "minItems": 1
                  }
                ]
              }
            },
            "contacts": {
              "$id": "#root/contacts",
              "title": "contacts",
              "type": "array",
              "default": {},
              "items": {
                "$ref": "#root/contact"
              },
              "minItems": 1
            },
            "employee": {
              "$id": "#root/employee",
              "title": "employee",
              "type": "object",
              "default": {},
              "required": [
                "n",
                "c"
              ],
              "properties": {
                "n": {
                  "$ref": "#root/notEmptyString"
                },
                "r": {
                  "$ref": "#root/notEmptyString"
                },
                "c": {
                  "$ref": "#root/contacts"
                }
              },
              "additionalProperties": false
            },
            "person": {
              "$id": "#root/person",
              "title": "person",
              "type": "object",
              "default": {},
              "required": [
                "n",
                "c"
              ],
              "properties": {
                "n": {
                  "$ref": "#root/notEmptyString"
                },
                "b": {
                  "$ref": "#root/notEmptyString"
                },
                "c": {
                  "$ref": "#root/contacts"
                }
              },
              "additionalProperties": false
            },
            "organisation": {
              "$id": "#root/organisation",
              "title": "organisation",
              "type": "object",
              "default": {},
              "required": [
                "n",
                "c"
              ],
              "properties": {
                "n": {
                  "$ref": "#root/notEmptyString"
                },
                "s": {
                  "$ref": "#root/notEmptyString"
                },
                "c": {
                  "$ref": "#root/contacts"
                }
              },
              "additionalProperties": false
            },
            "group": {
              "$id": "#root/group",
              "title": "group",
              "type": "object",
              "default": {},
              "required": [
                "n",
                "c"
              ],
              "properties": {
                "n": {
                  "$ref": "#root/notEmptyString"
                },
                "d": {
                  "$ref": "#root/notEmptyString"
                },
                "c": {
                  "$ref": "#root/contacts"
                }
              },
              "additionalProperties": false
            },
            "location": {
              "$id": "#root/location",
              "title": "location",
              "type": "object",
              "default": {},
              "required": [
                "n",
                "c"
              ],
              "properties": {
                "n": {
                  "$ref": "#root/notEmptyString"
                },
                "d": {
                  "$ref": "#root/notEmptyString"
                },
                "c": {
                  "$ref": "#root/contacts"
                }
              },
              "additionalProperties": false
            },
            "department": {
              "$id": "#root/department",
              "title": "department",
              "type": "object",
              "default": {},
              "required": [
                "n",
                "c"
              ],
              "properties": {
                "n": {
                  "$ref": "#root/notEmptyString"
                },
                "d": {
                  "$ref": "#root/notEmptyString"
                },
                "c": {
                  "$ref": "#root/contacts"
                }
              },
              "additionalProperties": false
            }
          },
          "required": [
            "@n"
          ],
          "properties": {
            "@n": {
              "$ref": "#root/@n"
            },
            "@p": {
              "type": "boolean"
            },
            "?": {
              "$ref": "#root/index"
            },
            "o": {
              "$ref": "#root/organisation"
            },
            "dp": {
              "$ref": "#root/department"
            },
            "gp": {
              "$ref": "#root/group"
            },
            "lc": {
              "$ref": "#root/location"
            },
            "p": {
              "$ref": "#root/person"
            },
            "e": {
              "$ref": "#root/employee"
            }
          },
          "additionalProperties": false,
          "anyOf": [
            {
              "@n": {
                "$ref": "#root/@n"
              },
              "@p": {
                "type": "boolean"
              },
              "?": {
                "$ref": "#root/index"
              },
              "o": {
                "$ref": "#root/organisation"
              }
            },
            {
              "@n": {
                "$ref": "#root/@n"
              },
              "@p": {
                "type": "boolean"
              },
              "?": {
                "$ref": "#root/index"
              },
              "dp": {
                "$ref": "#root/department"
              }
            },
            {
              "@n": {
                "$ref": "#root/@n"
              },
              "@p": {
                "type": "boolean"
              },
              "?": {
                "$ref": "#root/index"
              },
              "gp": {
                "$ref": "#root/group"
              }
            },
            {
              "@n": {
                "$ref": "#root/@n"
              },
              "@p": {
                "type": "boolean"
              },
              "?": {
                "$ref": "#root/index"
              },
              "lc": {
                "$ref": "#root/location"
              }
            },
            {
              "@n": {
                "$ref": "#root/@n"
              },
              "@p": {
                "type": "boolean"
              },
              "?": {
                "$ref": "#root/index"
              },
              "p": {
                "$ref": "#root/person"
              }
            },
            {
              "@n": {
                "$ref": "#root/@n"
              },
              "@p": {
                "type": "boolean"
              },
              "?": {
                "$ref": "#root/index"
              },
              "e": {
                "$ref": "#root/employee"
              }
            }
          ]
        };
        resolve({ data: schema });
      });
    }

    if (urlStr.includes('/1/schema.json')) {
      return new Promise<Record<string, unknown> | null>((resolve) => {
        const schema = {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "$id": "https://modules.numprotocol.com/1/schema.json",
          "title": "Root",
          "type": "object",
          "definitions": {
            "@n": {
              "$id": "#root/@n",
              "title": "@n",
              "type": "integer",
              "default": 1
            },
            "notNullString": {
              "$id": "#root/notNullString",
              "title": "notNullString",
              "type": "string",
              "nullable": false
            },
            "notEmptyString": {
              "$id": "#root/notEmptyString",
              "title": "notEmptyString",
              "type": "string",
              "minLength": 1,
              "nullable": false
            },
            "hours": {
              "$id": "#root/hours",
              "title": "hours",
              "type": "object",
              "properties": {
                "available": {
                  "type": "array",
                  "items": {
                    "$ref": "#root/notNullString"
                  }
                },
                "time_zone_location": {
                  "$ref": "#root/notNullString"
                }
              },
              "additionalProperties": false
            },
            "link": {
              "$id": "#root/link",
              "title": "link",
              "type": "object",
              "default": {},
              "properties": {
                "@L": {
                  "$ref": "#root/notEmptyString"
                },
                "description": {
                  "$ref": "#root/notNullString"
                }
              },
              "required": [
                "@L"
              ],
              "additionalProperties": false
            },
            "method": {
              "$id": "#root/method",
              "title": "method",
              "type": "object",
              "default": {},
              "properties": {
                "value": {
                  "$ref": "#root/notNullString"
                },
                "description": {
                  "$ref": "#root/notNullString"
                },
                "hours": {
                  "$ref": "#root/hours"
                },
                "prefix": {
                  "$ref": "#root/notNullString"
                },
                "description_default": {
                  "$ref": "#root/notNullString"
                },
                "object_display_name": {
                  "$ref": "#root/notEmptyString"
                },
                "controller": {
                  "$ref": "#root/notEmptyString"
                },
                "value_prefix": {
                  "$ref": "#root/notEmptyString"
                },
                "method_type": {
                  "enum": [
                    "core",
                    "third_party"
                  ]
                }
              },
              "required": [
                "value"
              ],
              "additionalProperties": false
            },
            "address": {
              "$id": "#root/address",
              "title": "address",
              "type": "object",
              "default": {},
              "properties": {
                "description": {
                  "$ref": "#root/notNullString"
                },
                "hours": {
                  "$ref": "#root/hours"
                },
                "prefix": {
                  "$ref": "#root/notNullString"
                },
                "description_default": {
                  "$ref": "#root/notNullString"
                },
                "object_display_name": {
                  "$ref": "#root/notEmptyString"
                },
                "method_type": {
                  "enum": [
                    "core",
                    "third_party"
                  ]
                },
                "lines": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                },
                "postcode": {
                  "$ref": "#root/notNullString"
                },
                "country": {
                  "$ref": "#root/notNullString"
                }
              },
              "required": [
                "lines"
              ],
              "additionalProperties": false
            },
            "contact": {
              "$id": "#root/contact",
              "title": "contact",
              "type": "object",
              "default": {},
              "properties": {
                "link": {
                  "$ref": "#root/link"
                },
                "address": {
                  "$ref": "#root/address"
                }
              },
              "additionalProperties": {
                "$ref": "#root/method"
              }
            },
            "contacts": {
              "$id": "#root/contacts",
              "title": "contacts",
              "type": "array",
              "default": {},
              "items": {
                "$ref": "#root/contact"
              },
              "minItems": 1
            },
            "employee": {
              "$id": "#root/employee",
              "title": "employee",
              "type": "object",
              "default": {},
              "required": [
                "name",
                "contacts"
              ],
              "properties": {
                "name": {
                  "$ref": "#root/notEmptyString"
                },
                "role": {
                  "$ref": "#root/notEmptyString"
                },
                "contacts": {
                  "$ref": "#root/contacts"
                },
                "object_display_name": {
                  "$ref": "#root/notEmptyString"
                }
              },
              "additionalProperties": false
            },
            "person": {
              "$id": "#root/person",
              "title": "person",
              "type": "object",
              "default": {},
              "required": [
                "name",
                "contacts"
              ],
              "properties": {
                "name": {
                  "$ref": "#root/notEmptyString"
                },
                "bio": {
                  "$ref": "#root/notEmptyString"
                },
                "contacts": {
                  "$ref": "#root/contacts"
                },
                "object_display_name": {
                  "$ref": "#root/notEmptyString"
                }
              },
              "additionalProperties": false
            },
            "organisation": {
              "$id": "#root/organisation",
              "title": "organisation",
              "type": "object",
              "default": {},
              "required": [
                "name",
                "contacts"
              ],
              "properties": {
                "name": {
                  "$ref": "#root/notEmptyString"
                },
                "slogan": {
                  "$ref": "#root/notEmptyString"
                },
                "contacts": {
                  "$ref": "#root/contacts"
                },
                "object_display_name": {
                  "$ref": "#root/notEmptyString"
                }
              },
              "additionalProperties": false
            },
            "group": {
              "$id": "#root/group",
              "title": "group",
              "type": "object",
              "default": {},
              "required": [
                "name",
                "contacts"
              ],
              "properties": {
                "name": {
                  "$ref": "#root/notEmptyString"
                },
                "description": {
                  "$ref": "#root/notEmptyString"
                },
                "contacts": {
                  "$ref": "#root/contacts"
                },
                "object_display_name": {
                  "$ref": "#root/notEmptyString"
                }
              },
              "additionalProperties": false
            },
            "location": {
              "$id": "#root/location",
              "title": "location",
              "type": "object",
              "default": {},
              "required": [
                "name",
                "contacts"
              ],
              "properties": {
                "name": {
                  "$ref": "#root/notEmptyString"
                },
                "description": {
                  "$ref": "#root/notEmptyString"
                },
                "contacts": {
                  "$ref": "#root/contacts"
                },
                "object_display_name": {
                  "$ref": "#root/notEmptyString"
                }
              },
              "additionalProperties": false
            },
            "department": {
              "$id": "#root/department",
              "title": "department",
              "type": "object",
              "default": {},
              "required": [
                "name",
                "contacts"
              ],
              "properties": {
                "name": {
                  "$ref": "#root/notEmptyString"
                },
                "description": {
                  "$ref": "#root/notEmptyString"
                },
                "contacts": {
                  "$ref": "#root/contacts"
                },
                "object_display_name": {
                  "$ref": "#root/notEmptyString"
                }
              },
              "additionalProperties": false
            }
          },
          "required": [
            "@n"
          ],
          "properties": {
            "@n": {
              "$ref": "#root/@n"
            },
            "@p": {
              "type": "boolean"
            },
            "organisation": {
              "$ref": "#root/organisation"
            },
            "department": {
              "$ref": "#root/department"
            },
            "group": {
              "$ref": "#root/group"
            },
            "location": {
              "$ref": "#root/location"
            },
            "person": {
              "$ref": "#root/person"
            },
            "employee": {
              "$ref": "#root/employee"
            }
          },
          "additionalProperties": false,
          "anyOf": [
            {
              "@n": {
                "$ref": "#root/@n"
              },
              "@p": {
                "type": "boolean"
              },
              "organisation": {
                "$ref": "#root/organisation"
              }
            },
            {
              "@n": {
                "$ref": "#root/@n"
              },
              "@p": {
                "type": "boolean"
              },
              "department": {
                "$ref": "#root/department"
              }
            },
            {
              "@n": {
                "$ref": "#root/@n"
              },
              "@p": {
                "type": "boolean"
              },
              "group": {
                "$ref": "#root/group"
              }
            },
            {
              "@n": {
                "$ref": "#root/@n"
              },
              "@p": {
                "type": "boolean"
              },
              "location": {
                "$ref": "#root/location"
              }
            },
            {
              "@n": {
                "$ref": "#root/@n"
              },
              "@p": {
                "type": "boolean"
              },
              "person": {
                "$ref": "#root/person"
              }
            },
            {
              "@n": {
                "$ref": "#root/@n"
              },
              "@p": {
                "type": "boolean"
              },
              "employee": {
                "$ref": "#root/employee"
              }
            }
          ]
        };
        resolve({ data: schema });
      });
    }

    if (urlStr.includes('schema-map')) {
      return new Promise<Record<string, unknown> | null>((resolve) => {
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
        resolve({ data: map });
      });
    }
    if (urlStr.includes('locales') && urlStr.includes('en-gb')) {
      return new Promise<Record<string, unknown> | null>((resolve) => {
        const locale = {
          'locale.o.name': 'Organisation',
          'locale.o.default': 'View Organisation',
          'locale.tw.name': 'Twitter',
          'locale.tw.default': 'View Twitter profile',
          'locale.li.name': 'LinkedIn',
          'locale.li.default': 'View LinkedIn page',
        };
        resolve({ data: locale });
      });
    }
    if (urlStr.includes('locales') && urlStr.includes('en-us')) {
      return new Promise<Record<string, unknown> | null>((resolve) => {
        const locale = {
          'locale.o.name': 'Organization',
          'locale.o.default': 'View Organization',
          'locale.tw.name': 'Twitter',
          'locale.tw.default': 'View Twitter profile',
          'locale.li.name': 'LinkedIn',
          'locale.li.default': 'View LinkedIn page',
        };
        resolve({ data: locale });
      });
    }
    return new Promise<Record<string, unknown> | null>((resolve) => {
      resolve(null);
    });
  }

}