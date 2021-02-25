/* eslint-disable @typescript-eslint/no-unsafe-return */
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

    Object.keys(locale).forEach((k) => {
      const ref = `%${k}`;
      referenceValues[ref] = locale[k];
    });

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

      if (Array.isArray(value)) {
        result[k] = processArray(referenceValues, value);
      } else if (typeof value === 'object') {
        result[k] = processObject(referenceValues, value);
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
const processArray = (referenceValues: Record<string, unknown>, arr: any[]): any[] => {
  const result: any[] = [];

  arr.forEach((value) => {
    if (Array.isArray(value)) {
      result.push(processArray(referenceValues, value));
    } else if (typeof value === 'object') {
      result.push(processObject(referenceValues, value));
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
const processObject = (referenceValues: Record<string, unknown>, obj: Record<string, unknown>): Record<string, unknown> => {
  const result = {} as Record<string, unknown>;

  Object.keys(obj).forEach((k) => {
    const value: any = obj[k];

    if (Array.isArray(value)) {
      result[k] = processArray(referenceValues, value);
    } else if (typeof value === 'object') {
      result[k] = processObject(referenceValues, value);
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

  // TODO: handle situations where locale[k] is not a string
  Object.keys(referenceValues).forEach((ref) => {
    // TODO: use a regex to find the references to replace and look up those.
    result = result.replace(ref, referenceValues[ref] as string);
  });

  return result;
};
