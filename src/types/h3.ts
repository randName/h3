import type { H3EventContext } from "./context.ts";
import type { EventHandler, Middleware } from "./handler.ts";
import type { HTTPError } from "../error.ts";
import type { MaybePromise } from "./_utils.ts";
import type { ServerRequest } from "srvx";
import type { MatchedRoute } from "rou3";
import type { H3Event } from "../event.ts";

// --- Misc ---

// https://www.rfc-editor.org/rfc/rfc7231#section-4.1
// prettier-ignore
export type HTTPMethod =  "GET" | "HEAD" | "PATCH" | "POST" | "PUT" | "DELETE" | "CONNECT" | "OPTIONS" | "TRACE";

export interface H3Config {
  /**
   * When enabled, H3 displays debugging stack traces in HTTP responses (potentially dangerous for production!).
   */
  debug?: boolean;

  /**
   * When enabled, H3 console errors for unhandled exceptions will not be displayed.
   */
  silent?: boolean;

  plugins?: H3Plugin[];

  onRequest?: (event: H3Event) => MaybePromise<void>;
  onResponse?: (response: Response, event: H3Event) => MaybePromise<void>;
  onError?: (error: HTTPError, event: H3Event) => MaybePromise<void | unknown>;
}

export type PreparedResponse = ResponseInit & { body?: BodyInit | null };

export interface H3RouteMeta {
  readonly [key: string]: unknown;
}

export interface H3Route {
  route?: string;
  method?: HTTPMethod;
  middleware?: Middleware[];
  meta?: H3RouteMeta;
  handler: EventHandler;
}

// --- H3 Pluins ---

export type H3Plugin = (h3: H3) => void;

export function definePlugin<T = unknown>(
  def: (h3: H3, options: T) => void,
): undefined extends T ? (options?: T) => H3Plugin : (options: T) => H3Plugin {
  return ((opts?: any) => (h3: H3) => def(h3, opts)) as any;
}

// --- H3 App ---

export type FetchHandler = (req: ServerRequest) => Response | Promise<Response>;

export type RouteOptions = {
  middleware?: Middleware[];
  meta?: H3RouteMeta;
};

export type MiddlewareOptions = {
  method?: string;
  match?: (event: H3Event) => boolean;
};

export declare class H3 {
  /**
   * @internal
   */
  _middleware: Middleware[];

  /**
   * @internal
   */
  _routes: H3Route[];

  /**
   * H3 instance config.
   */
  readonly config: H3Config;

  /**
   * Create a new H3 app instance.
   */
  constructor(config?: H3Config);

  /**
   * A [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)-compatible API allowing to fetch app routes.
   *
   * Input should be standard [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) object.
   *
   * Returned value is a [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) Promise.
   */
  fetch(_request: ServerRequest): Response | Promise<Response>;

  /**
   * A [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)-compatible API allowing to fetch app routes.
   *
   * Input can be a URL, relative path or standard [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) object.
   *
   * Returned value is a [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) Promise.
   */
  request(
    request: ServerRequest | URL | string,
    options?: RequestInit,
    context?: H3EventContext,
  ): Response | Promise<Response>;

  /**
   * @internal
   */
  _findRoute(_event: H3Event): MatchedRoute<H3Route> | void;

  /**
   * @internal
   */
  _addRoute(_route: H3Route): void;

  /**
   * Immediately register an H3 plugin.
   */
  register(plugin: H3Plugin): this;

  /**
   * An h3 compatible event handler useful to compose multiple h3 app instances.
   */
  handler(event: H3Event): unknown | Promise<unknown>;

  /**
   * Mount an H3 app or a `.fetch` compatible server (like Hono or Elysia) with a base prefix.
   *
   * When mounting a sub-app, all routes will be added with base prefix and global middleware will be added as one prefixed middleware.
   *
   * **Note:** Sub-app options and global hooks are not inherited by the mounted app please consider setting them in the main app directly.
   */
  mount(base: string, input: FetchHandler | { fetch: FetchHandler } | H3): this;

  /**
   * Register a global middleware.
   */
  use(route: string, handler: Middleware, opts?: MiddlewareOptions): this;
  use(handler: Middleware, opts?: MiddlewareOptions): this;

  /**
   * Register a route handler for the specified HTTP method and route.
   */
  on(
    method: HTTPMethod | Lowercase<HTTPMethod> | "",
    route: string,
    handler: EventHandler,
    opts?: RouteOptions,
  ): this;

  /**
   * Register a route handler for all HTTP methods.
   */
  all(route: string, handler: EventHandler, opts?: RouteOptions): this;

  get(route: string, handler: EventHandler, opts?: RouteOptions): this;
  post(route: string, handler: EventHandler, opts?: RouteOptions): this;
  put(route: string, handler: EventHandler, opts?: RouteOptions): this;
  delete(route: string, handler: EventHandler, opts?: RouteOptions): this;
  patch(route: string, handler: EventHandler, opts?: RouteOptions): this;
  head(route: string, handler: EventHandler, opts?: RouteOptions): this;
  options(route: string, handler: EventHandler, opts?: RouteOptions): this;
  connect(route: string, handler: EventHandler, opts?: RouteOptions): this;
  trace(route: string, handler: EventHandler, opts?: RouteOptions): this;
}
