import { PositiveInteger } from './numuri';
import { ResourceLoader } from './resourceloader';

export interface ModuleConfigProvider {
  getConfig(moduleNumber: PositiveInteger): Promise<ModuleConfig | null>;
}

export const createModuleConfigProvider = (resourceLoader: ResourceLoader): ModuleConfigProvider => new ModuleConfigProviderImpl(resourceLoader);

export class ProcessingChain {
  constructor(readonly modlToJson: boolean, readonly validateCompactJson: boolean, readonly unpack: boolean, readonly validateExpandedJson: boolean) {}
}

export enum SubstitutionsType {
  standard = 'standard',
  locale = 'locale',
}

export class ModuleConfig {
  constructor(
    readonly moduleId: PositiveInteger,
    readonly moduleName: string,
    readonly compactSchema: boolean,
    readonly expandedSchema: boolean,
    readonly substitutions: boolean,
    readonly substitutionsType: SubstitutionsType,
    readonly track: string
  ) {}
}

const DEFAULT_MODULES_BASE_URL = 'https://modules.numprotocol.com';

class ModuleConfigProviderImpl implements ModuleConfigProvider {
  constructor(private resourceLoader: ResourceLoader) {
    this.resourceLoader = resourceLoader;
  }

  async getConfig(moduleNumber: PositiveInteger): Promise<ModuleConfig | null> {
    const response = await this.resourceLoader.load(`${DEFAULT_MODULES_BASE_URL}/${moduleNumber.n}/config.json`);

    if (response) {
      return toModuleConfig(response.data as Record<string, unknown>);
    }
    return null;
  }
}

export const toModuleConfig = (r: Record<string, unknown>): ModuleConfig | null => {
  let subs: SubstitutionsType;
  switch (r.substitutions_type) {
    case 'locale':
      subs = SubstitutionsType.locale;
      break;
    case 'standard':
      subs = SubstitutionsType.standard;
      break;
    case undefined:
    default:
      subs = SubstitutionsType.standard;
  }

  return new ModuleConfig(
    new PositiveInteger(r.module_id as number),
    r.module_name as string,
    r.compact_schema as boolean,
    r.expanded_schema as boolean,
    r.substitutions as boolean,
    subs,
    r.track as string
  );
};
