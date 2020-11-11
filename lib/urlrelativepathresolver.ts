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
import { RelativePathException } from './exceptions';

//------------------------------------------------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------------------------------------------------
/**
 * Convert a path of the form `/a/b/c/../../d/../e/../..` etc to a resolved path.
 *
 * @param base     the base path that we're moving relative to
 * @param redirect the relative path - can include `../` sections
 * @return the resolved path
 * @throws RelativePathException when the redirect is beyond the root of the base path
 */
export function resolvePath(base: string, redirect: string): string {
  const SEP = '/';

  // Normalise the base and redirect paths
  let basePath = base.endsWith(SEP) ? base.substr(0, base.length - 1) : base;

  let redirectPath = redirect;

  if (redirectPath.startsWith(SEP)) {
    basePath = redirectPath;
    redirectPath = '';
  }

  // Make a full path including the `../` sections
  const path = redirectPath.length > 0 ? basePath + SEP + redirectPath : basePath;

  // Use a stack to determine the resolved path
  const parts = path.split(SEP);
  const pathStack = new Array<string>();

  // Add each non-empty part to the stack, or pop an item, or throw if the stack is empty when popping
  for (const part of parts) {
    if (part === '..') {
      if (pathStack.length === 0) {
        throw new RelativePathException('Cannot redirect beyond root');
      }
      pathStack.pop();
    } else if (part !== '.') {
      if (part.length > 0) {
        pathStack.push(part);
      }
    }
  }

  // Rebuild the path to a resolved path
  return SEP + pathStack.join(SEP);
}
