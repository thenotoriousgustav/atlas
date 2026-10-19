import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios"

// Each application configures its API URL and authentication on this instance.
export const AXIOS_INSTANCE: AxiosInstance = axios.create()

export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  return AXIOS_INSTANCE({ ...config, ...options }).then(
    (response) => response.data
  )
}

export default customInstance
