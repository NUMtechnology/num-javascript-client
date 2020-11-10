import axios from 'axios';
import log from 'loglevel';

const INTERPRETER_URL = 'https://api.apps.num.uk/v1/mtoj';

export interface ModlServices {
  interpretNumRecord(modl: string, timeout: number): Promise<string>;
}

export function createModlServices(): ModlServices {
  return new ModlServicesImpl();
}

class ModlServicesImpl implements ModlServices {
  async interpretNumRecord(modl: string, timeout: number): Promise<string> {
    try {
      const response = await axios.post(INTERPRETER_URL, modl, {
        headers: {
          'content-type': 'text/plain',
        },
        timeout,
      });

      if (response.status === 200) {
        return JSON.stringify(response.data);
      }
    } catch (e) {
      log.error(e.message);
    }
    return '';
  }
}
