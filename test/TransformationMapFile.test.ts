import { expect } from 'chai';
import { createResourceLoader } from '../src/resourceloader';
import { mapJsonToTransformationFileName } from '../src/client';
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
    const m = {
      "compact-v1": {
        "expanded-v1": {
          "transformation-file": "c1-e1.json",
          "unpacker-version": "0.0.18"
        },
        "expanded-v2": {
          "transformation-file": "c1-e2.json",
          "unpacker-version": "0.0.18"
        }
      }
    };

    expect(mapJsonToTransformationFileName(1, m, '1', '1')).equal('https://modules.numprotocol.com/1/transformation/c1-e1.json');
    expect(mapJsonToTransformationFileName(2, m, '1', '2')).equal('https://modules.numprotocol.com/2/transformation/c1-e2.json');
  });
});
