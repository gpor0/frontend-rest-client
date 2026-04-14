import { RequestCredentials, RequestMode } from "undici-types/fetch";
import { isObject } from "./utils/validators";

/**
 * Initializes client options object
 *
 * @param params - client options
 *
 * @public
 */
export function initFetchFrontendClientOptions(params?: {
  headers?: Record<string, string | string[]> | undefined;
  credentials?: RequestCredentials;
  authProvider?: AuthProvider;
  mode?: RequestMode;
  requestInterceptor?: (req: { request: RequestInit }) => Promise<RequestInterceptorResult>;
  responseInterceptor?: <Response>(response: Response) => Promise<Response>;
}) {
  const options = new FetchFrontendClientOptions();

  if (params?.headers) {
    options.headers(params.headers);
  }
  if (params?.credentials) {
    options.credentials(params.credentials);
  }
  if (params?.authProvider) {
    options.authProvider(params.authProvider);
  }
  if (params?.mode) {
    options.mode(params.mode);
  }
  if (params?.requestInterceptor) {
    options.requestInterceptor(params.requestInterceptor);
  }
  if (params?.responseInterceptor) {
    options.responseInterceptor(params.responseInterceptor);
  }

  return options;
}

/**
 * Client options for the client instance configuration
 *
 * @public
 */
export class FetchFrontendClientOptions {
  constructor() {}

  _headers?: Record<string, string | string[]> | undefined;
  headers = (_headers?: Record<string, string | string[]> | undefined) => {
    if (isObject(_headers)) {
      this._headers = { ...this._headers, ..._headers };
    }
    return this;
  };
  _credentials?: RequestCredentials;
  credentials = (_credentials?: RequestCredentials) => {
    this._credentials = _credentials;
    return this;
  };
  _authProvider?: AuthProvider;
  authProvider = (_authProvider?: AuthProvider) => {
    this._authProvider = _authProvider;
    return this;
  };
  _mode?: RequestMode;
  mode = (_mode?: RequestMode) => {
    this._mode = _mode;
    return this;
  };
  _requestInterceptor?: (req: { request: RequestInit }) => Promise<RequestInterceptorResult>;
  requestInterceptor = (_requestInterceptor?: (req: { request: RequestInit }) => Promise<RequestInterceptorResult>) => {
    this._requestInterceptor = _requestInterceptor;
    return this;
  };
  _responseInterceptor?: <Response>(response: Response) => Promise<Response>;
  responseInterceptor = (_responseInterceptor?: <Response>(response: Response) => Promise<Response>) => {
    this._responseInterceptor = _responseInterceptor;
    return this;
  };
}

/**
 * @public
 */
export interface RequestInterceptorResult {
  proceed: boolean;
  request?: RequestInit & { headers: Record<string, string | string[]> };
}

/**
 * Authentication provider interface supports injecting custom Auth mechanism into client
 *
 * @public
 */
export interface AuthProvider {
  authProviderName: string;

  getAuthHeaders(): Promise<Record<string, string>>;
}

/**
 * FrontendClient interface to be used for invoking HTTP calls
 *
 * @public
 */
export interface FrontendClient {
  request<RequestBody, Response>(request?: ClientRequest<RequestBody>): Promise<ClientResponse<Response>>;
}

/**
 * Request method configuration interface
 *
 * @public
 */
export interface FetchClientData<RequestType> {
  url: string;
  method: HttpMethod;
  headers?: (() => Record<string, string | string[]>) | Record<string, string | string[]>;
  query?: (() => Record<string, unknown>) | Record<string, unknown>;
  body?: (() => RequestType) | RequestType;
  credentials?: RequestCredentials;
  mode?: RequestMode;
}

/**
 * Http method to be used in client request
 *
 * @public
 */
export enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  OPTIONS = "OPTIONS",
  PATCH = "PATCH",
  HEAD = "HEAD",
}

/**
 * Type definition for query param value
 *
 * @public
 */
export type QueryParamValueType = number | number[] | string | string[] | object | object[] | undefined | Date | Date[];

/**
 * Client request parameters interface
 * @public
 */
export interface ClientRequest<RequestBody> {
  resourceName: string;
  method: HttpMethod | string;
  url: string;
  pathParams?: { [queryParam: string]: string | number | Date };
  query?: { [queryParam: string]: QueryParamValueType };
  data?: RequestBody;
  headers?: { [key: string]: unknown };
}

/**
 * ClientResponse to be returned by the request method
 *
 * @public
 */
export interface ClientResponse<Response> {
  httpStatus: number;
  payload: Response;
  responseHeaders?: { [key: string]: string | string[] };
}

/**
 * Query definition type
 *
 * @public
 */
export interface QueryDefinition {
  exploded: boolean;
  explodeFormat?: "brackets" | "index" | "default";
  separator?: string;
  urlEncode?: boolean;
  value: unknown;
}
