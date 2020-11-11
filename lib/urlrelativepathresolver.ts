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
