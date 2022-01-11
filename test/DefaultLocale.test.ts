import { expect } from 'chai';
import { createResourceLoader } from '../src/resourceloader';
import { findFirstWithSameLanguage } from '../src/client';
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
const loader = createResourceLoader();

describe('TransformationMapFile', () => {
  it('should be able to generate a valid file path from a valid map.json', async () => {
    const l = [
      "en-gb",
      "en-us",
      "fr-fr",
      "fr-ca"
    ];

    const config = {
      "module_id": 2,
      "module_name": "Contacts",
      "compact_schema": true,
      "expanded_schema": true,
      "substitutions": true,
      "substitutions_type": "locale",
      "track": "draft"
    };

    const mc = toModuleConfig(config);
    expect(mc).not.null;
    if (mc) {
      expect(findFirstWithSameLanguage(l, 'en', mc)).equal('https://modules.numprotocol.com/2/locales/en-gb.json');
      expect(findFirstWithSameLanguage(l, 'xx', mc)).equal('https://modules.numprotocol.com/2/locales/en-us.json');
      expect(findFirstWithSameLanguage(l, 'fr', mc)).equal('https://modules.numprotocol.com/2/locales/fr-fr.json');
    }
  });
});
