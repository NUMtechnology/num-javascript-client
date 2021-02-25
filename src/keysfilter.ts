export interface InternalKeysFilter {
  filter(obj: Record<string, unknown>): Record<string, unknown>;
}

export const createInternalKeysFilter = (): InternalKeysFilter => new InternalKeysFilterImpl();

class InternalKeysFilterImpl implements InternalKeysFilter {
  filter(obj: Record<string, unknown>): Record<string, unknown> {
    // TODO: implement this
    return obj;
  }
}
