/**
 * functions/lib/pages-function.ts
 *
 * PagesFunction with the shape of the one in @cloudflare/workers-types, except
 * that request, next() and the return value use the global Request and
 * Response. Imported as a module, the official type carries the package's own
 * Request and Response classes, which do not match Bun's globals when the root
 * tsconfig checks these handlers through the tests. Under functions/tsconfig.json
 * the globals are the Workers classes, so both programs check the same shape.
 */

import type { EventContext, IncomingRequestCfProperties } from "@cloudflare/workers-types";

type PagesContext<Env, Params extends string, Data> = Omit<
  EventContext<Env, Params, Data>,
  "request" | "next"
> & {
  request: Request & { cf?: IncomingRequestCfProperties };
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
};

export type PagesFunction<
  Env = unknown,
  Params extends string = any,
  Data extends Record<string, unknown> = Record<string, unknown>,
> = (context: PagesContext<Env, Params, Data>) => Response | Promise<Response>;
