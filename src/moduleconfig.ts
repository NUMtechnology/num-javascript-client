import { PositiveInteger } from './numuri';
import { ResourceLoader } from './resourceloader';

export interface ModuleConfigProvider {
  getConfig(moduleNumber: PositiveInteger): Promise<ModuleConfig | null>;
}

export const createModuleConfigProvider = (resourceLoader: ResourceLoader): ModuleConfigProvider => new ModuleConfigProviderImpl(resourceLoader);

export class ProcessingChain {
  constructor(readonly modlToJson: boolean, readonly validateCompactJson: boolean, readonly unpack: boolean, readonly validateExpandedJson: boolean) {}
}

export class ModuleConfig {
  constructor(
    readonly moduleNumber: PositiveInteger,
    readonly moduleVersion: PositiveInteger,
    readonly processingChain: ProcessingChain,
    readonly compactSchemaUrl: string | null,
    readonly schemaMapUrl: string | null,
    readonly expandedSchemaUrl: string | null,
    readonly localeFilesBaseUrl: string | null
  ) {}
}

const DEFAULT_MODULES_BASE_URL = 'https://modules.numprotocol.com';

class ModuleConfigProviderImpl implements ModuleConfigProvider {
  constructor(private resourceLoader: ResourceLoader) {
    this.resourceLoader = resourceLoader;
  }

  async getConfig(moduleNumber: PositiveInteger): Promise<ModuleConfig | null> {
    const response = await this.resourceLoader.load(`${DEFAULT_MODULES_BASE_URL}/${moduleNumber.n}/module-spec.json`);

    if (response) {
      return (response as unknown) as ModuleConfig;
    }
    return null;
  }
}
