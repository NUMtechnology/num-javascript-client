/* eslint-disable @typescript-eslint/no-unsafe-return */
//------------------------------------------------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------------------------------------------------


/**
 * Resolve references
 */
export interface ReferencesResolver {
  /**
   * Replace object references using the locale and object index.
   *
   * @param locale locale-specific reference values
   * @param json the object that might have references
   */
  resolve(locale: Record<string, unknown>, json: Record<string, unknown>): Record<string, unknown>;
}

/**
 * Function to create a ReferencesResolver
 */
export const createReferencesResolver = (): ReferencesResolver => new ReferencesResolverImpl();

//------------------------------------------------------------------------------------------------------------------------
// Internals
//------------------------------------------------------------------------------------------------------------------------

// eslint-disable-next-line max-len
const FIND_REFS = new RegExp(
  /(((\%|~%|%)\w+)(\.\w*<`?\w*`?,`\w*`>)+|((\%|~%|%)` ?[\w-]+`[\w.<>,]*%?)|((\%|~%|%)\*?[\w]+(\.%?\w*(<[\w, `]*>)?)*%?)|(%`[ %\w-]+`(\.\w+)+)|(%`.+`))/gm
);

/**
 * Private implementation of a ReferencesResolver
 */
class ReferencesResolverImpl implements ReferencesResolver {
  /**
   * Replace object references using the locale and object index.
   *
   * @param locale locale-specific reference values
   * @param json the object that might have references
   */
  resolve(locale: Record<string, unknown>, json: Record<string, unknown>): Record<string, unknown> {
    // pre-process these into an easier to use Map
    const referenceValues = {} as Record<string, unknown>;

    // Make a set of references using the locale
    Object.keys(locale).forEach((k) => {
      const ref = `%${k}`;
      referenceValues[ref] = locale[k];
    });

    // Make a set of references using the object index
    const index = json['?'] as any[];
    if (index) {
      index.forEach((v, i) => {
        referenceValues[`%${i}`] = v;
      });
    }

    // De-reference the references using the referenceValues
    const result = {} as Record<string, unknown>;

    Object.keys(json).forEach((k) => {
      const value: any = json[k];

      // Add the value to the references in case its referred to later
      referenceValues[`%${k}`] = value;

      if (Array.isArray(value)) {
        result[k] = processArray(k, referenceValues, value);
      } else if (typeof value === 'object') {
        result[k] = processObject(k, referenceValues, value);
      } else if (typeof value === 'string') {
        result[k] = processString(referenceValues, value);
      } else {
        result[k] = value;
      }
    });

    return result;
  }
}

/**
 * Process an array of values.
 *
 * @param referenceValues
 * @param arr
 */
const processArray = (parent: string, referenceValues: Record<string, unknown>, arr: any[]): any[] => {
  const result: any[] = [];

  arr.forEach((value, index) => {
    const newParent = `${parent}.${index}`;
    referenceValues[`%${newParent}`] = value;

    if (Array.isArray(value)) {
      result.push(processArray(newParent, referenceValues, value));
    } else if (typeof value === 'object') {
      result.push(processObject(newParent, referenceValues, value));
    } else if (typeof value === 'string') {
      result.push(processString(referenceValues, value));
    } else {
      result.push(value);
    }
  });
  return result;
};

/**
 * Process the values in an object.
 *
 * @param referenceValues
 * @param obj
 */
const processObject = (parent: string, referenceValues: Record<string, unknown>, obj: Record<string, unknown>): Record<string, unknown> => {
  const result = {} as Record<string, unknown>;

  Object.keys(obj).forEach((k) => {
    const value: any = obj[k];
    const newParent = `${parent}.${k}`;
    referenceValues[`%${newParent}`] = value;

    if (Array.isArray(value)) {
      result[k] = processArray(newParent, referenceValues, value);
    } else if (typeof value === 'object') {
      result[k] = processObject(newParent, referenceValues, value);
    } else if (typeof value === 'string') {
      result[k] = processString(referenceValues, value);
    } else {
      result[k] = value;
    }
  });

  return result;
};

/**
 * Replace references in a string
 *
 * @param referenceValues
 * @param str
 */
const processString = (referenceValues: Record<string, unknown>, str: string): string => {
  let result = str;

  let matches: RegExpExecArray | null;

  // TODO: handle situations where locale[k] is not a string
  while ((matches = FIND_REFS.exec(str)) !== null) {
    const ref = matches[0];
    const replacement = referenceValues[ref];
    if (replacement) {
      result = result.replace(ref, replacement as string);
    }
  }

  return result;
};
