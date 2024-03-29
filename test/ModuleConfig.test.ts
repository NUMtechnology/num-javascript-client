/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { expect } from 'chai';
import { toModuleConfig } from '../src/moduleconfig';
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
      "module_id": 1,
      "module_name": "Contacts",
      "compact_schema": true,
      "expanded_schema": true,
      "substitutions": true,
      "substitutions_type": "locale",
      "track": "draft"
    } as Record<string, unknown>;

    const moduleSpec = toModuleConfig(specObj);

    expect(moduleSpec).not.null;
    expect(moduleSpec?.moduleId.n).to.equal(1);
    expect(moduleSpec?.moduleName).to.equal('Contacts');
    expect(moduleSpec?.compactSchema).to.equal(true);
    expect(moduleSpec?.expandedSchema).to.equal(true);
    expect(moduleSpec?.substitutions).to.equal(true);
    expect(moduleSpec?.substitutionsType).to.equal('locale');
    expect(moduleSpec?.track).to.equal('draft');
  });

});
