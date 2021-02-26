/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { expect } from 'chai';
import { ModuleConfig } from '../src/moduleconfig';
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

describe('ModuleConfig', () => {
  it('should be able to create a module config object from a JSON object', () => {

    const specObj = {
      'module': 1,
      'version': 1,
      'compactSchemaUrl': 'https://modules.numprotocol.com/1/compact-schema.json',
      'expandedSchemaUrl': 'https://modules.numprotocol.com/1/schema.json',
      'schemaMapUrl': 'https://modules.numprotocol.com/1/schema-map.json',
      'localeFilesBaseUrl': 'https://modules.numprotocol.com/1/locales/',
      'processingChain': {
        'modlToJson': true,
        'validateCompactJson': true,
        'unpack': true,
        'resolveReferences': true,
        'removeInternalValues': true,
        'validateExpandedJson': true
      }
    } as unknown;
    const moduleSpec = specObj as ModuleConfig;
    expect(moduleSpec.compactSchemaUrl?.toString()).to.equal('https://modules.numprotocol.com/1/compact-schema.json');
    expect(moduleSpec.expandedSchemaUrl?.toString()).to.equal('https://modules.numprotocol.com/1/schema.json');
    expect(moduleSpec.schemaMapUrl?.toString()).to.equal('https://modules.numprotocol.com/1/schema-map.json');
    expect(moduleSpec.localeFilesBaseUrl?.toString()).to.equal('https://modules.numprotocol.com/1/locales/');

    expect(moduleSpec.processingChain.modlToJson).equal(true);
    expect(moduleSpec.processingChain.removeInternalValues).equal(true);
    expect(moduleSpec.processingChain.unpack).equal(true);
    expect(moduleSpec.processingChain.validateCompactJson).equal(true);
    expect(moduleSpec.processingChain.validateExpandedJson).equal(true);
  });

});
