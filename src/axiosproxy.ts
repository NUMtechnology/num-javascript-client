import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

export interface AxiosProxy {
  get(url: string, config?: AxiosRequestConfig | undefined): Promise<AxiosResponse<any>>;
}

class AxiosProxyImpl implements AxiosProxy {
  get(url: string, config?: AxiosRequestConfig | undefined): Promise<AxiosResponse<any>> {
    return axios.get(url, config);
  }
}

export const axiosProxy: AxiosProxy = new AxiosProxyImpl();
