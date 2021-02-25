import { PositiveInteger } from './numuri';
export interface ModuleConfigProvider {
  getConfig(moduleNumber: PositiveInteger): ModuleConfig | null;
}

export const createModuleConfigProvider = (): ModuleConfigProvider => new ModuleConfigProviderImpl();

export class ProcessingChain {
  constructor(
    readonly modlToJson: boolean,
    readonly validateCompactJson: boolean,
    readonly unpack: boolean,
    readonly resolveReferences: boolean,
    readonly removeInternalValues: boolean,
    readonly validateExpandedJson: boolean
  ) {}
}

export class ModuleConfig {
  constructor(
    readonly moduleNumber: PositiveInteger,
    readonly moduleVersion: PositiveInteger,
    readonly processingChain: ProcessingChain,
    readonly compactSchemaUrl: URL | null,
    readonly schemaMapUrl: URL | null,
    readonly expandedSchemaUrl: URL | null,
    readonly localeFilesBaseUrl: URL | null
  ) {}
}

class ModuleConfigProviderImpl implements ModuleConfigProvider {
  getConfig(moduleNumber: PositiveInteger): ModuleConfig | null {
    // TODO: Implement fully
    return new ModuleConfig(
      moduleNumber,
      new PositiveInteger(1),
      new ProcessingChain(true, true, true, true, true, true),
      null,
      new URL(`https://test.modules.numprotocol.com/${moduleNumber.n}/schema-map.json`),
      null,
      new URL(`https://test.modules.numprotocol.com/${moduleNumber.n}/locales/`)
    );
  }
}
