/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />

declare module "http/server.ts" {
  export interface ServeInit {
    port?: number;
    hostname?: string;
    handler?: (request: Request) => Response | Promise<Response>;
  }

  export function serve(handler: (request: Request) => Response | Promise<Response>, init?: ServeInit): void;
}

declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
  }
  export const env: Env;
}

interface Window {
  crypto: Crypto;
}
declare var crypto: Crypto; 