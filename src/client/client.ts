import { RequestCredentials, RequestMode } from "undici-types/fetch";
import { ClientRequest, ClientResponse, FetchFrontendClientOptions, FrontendClient } from "../interfaces";
import { prepareQuery } from "../utils/queryUtils";
import { isArray, isDefined, isFunction, isObject } from "../utils/validators";

/**
 * Initializes FetchFrontendClient instance
 *
 * @param config - configuration
 * @public
 */
export function initFetchFrontendClient(config: { baseUrl: string; options?: FetchFrontendClientOptions }): FrontendClient {
  return new FetchFrontendClient(config);
}

/**
 * Content-Type header string
 *
 * @public
 */
export const contentTypeHeader = "Content-Type";

/**
 * Accept header string
 *
 * @public
 */
export const acceptHeader = "Accept";

/**
 * Main implementation of the Frontend client
 *
 * @public
 */
class FetchFrontendClient implements FrontendClient {
  constructor(
    private config: {
      baseUrl: string;
      options?: FetchFrontendClientOptions;
    },
  ) {}

  public async call<RequestBody, Response>(request: ClientRequest<RequestBody>): Promise<Response> {
    const response = await this.request<RequestBody, Response>(request);
    return response.payload;
  }

  public async request<RequestBody, Response>(request: ClientRequest<RequestBody>): Promise<ClientResponse<Response>> {
    const { data, query, headers, method, url } = request ?? {};

    const { _headers: optHeaders, _credentials, _mode, _requestInterceptor, _responseInterceptor } = this.config.options ?? {};

    let fetchRequest = {
      method,
      headers: { ...(optHeaders ?? {}), ...(headers ?? {}) },
    } as RequestInit & { headers: Record<string, string | string[]> };

    if (_credentials) {
      if (isRequestCredential(_credentials)) {
        fetchRequest.credentials = _credentials;
      } else {
        console.warn(`"${String(_credentials)}" is not a proper credential value. It should be one of: ${JSON.stringify(reqCredentials)}`);
      }
    }

    if (_mode) {
      if (isRequestMode(_mode)) {
        fetchRequest.mode = _mode;
      } else {
        console.warn(`"${String(_mode)}" is not a proper mode value. It should be one of: ${JSON.stringify(modes)}`);
      }
    }

    const requestPayload = (typeof data === "function" && isDefined(data) ? data() : data) as unknown as BodyInit;

    if (!fetchRequest.headers[contentTypeHeader] && isObject(requestPayload)) {
      fetchRequest.headers[contentTypeHeader] = "application/json";
    }

    if (fetchRequest.headers[contentTypeHeader] === "application/json" && (isObject(requestPayload) || isArray(requestPayload))) {
      fetchRequest.body = JSON.stringify(requestPayload);
    } else {
      fetchRequest.body = requestPayload;
    }

    if (!fetchRequest.headers[acceptHeader]) {
      fetchRequest.headers[acceptHeader] = "application/json";
    }

    const targetUrl = `${this.config.baseUrl}${url}${prepareQuery(query)}`;
    if (_requestInterceptor) {
      if (isFunction(_requestInterceptor)) {
        const reqInterceptorResult = await _requestInterceptor({ request: fetchRequest });
        const proceed = reqInterceptorResult.proceed;

        if (proceed === false) {
          console.error(`Request ${targetUrl} was rejected due to the interceptor`);
          throw new Error(`Request was rejected`);
        }
        if (reqInterceptorResult.request !== undefined) {
          fetchRequest = reqInterceptorResult.request;
        }
      } else {
        console.warn(`"requestInterceptor ${String(_requestInterceptor)}" is not a function`);
      }
    }

    const fetchResponse = await fetch(targetUrl, fetchRequest);

    const httpStatus = fetchResponse.status;
    const responseHeaders = fetchResponse.headers as unknown as { [key: string]: string | string[] };

    let interceptedResponse: Response;
    if (isDefined(_responseInterceptor)) {
      if (isFunction(_responseInterceptor)) {
        interceptedResponse = (await _responseInterceptor(fetchResponse)) as unknown as Response;
      } else {
        interceptedResponse = (await fetchResponse.blob()) as unknown as Response;
        console.warn(`"responseInterceptor ${String(_responseInterceptor)}" is not a function`);
      }
    } else if (String(responseHeaders[contentTypeHeader])?.toLowerCase() === "application/json") {
      interceptedResponse = (await fetchResponse.json()) as unknown as Response;
    } else {
      interceptedResponse = (await fetchResponse.blob()) as unknown as Response;
    }

    const response = {
      httpStatus,
      payload: interceptedResponse,
      responseHeaders,
    };

    return response;
  }
}

const modes = ["cors", "navigate", "no-cors", "same-origin"];

function isRequestMode(arg: string): arg is RequestMode {
  return modes.includes(arg);
}

const reqCredentials = ["omit", "include", "same-origin"];

function isRequestCredential(arg: string): arg is RequestCredentials {
  return reqCredentials.includes(arg);
}
