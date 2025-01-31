import prodServer, {
  Logger,
  type ModernServerOptions,
} from '@modern-js/prod-server';
import { color } from './color';
import { getPort } from './port';
import { getAddressUrls } from './url';
import { logger as defaultLogger } from './logger';
import { DEFAULT_PORT, DEFAULT_DEV_HOST } from './constants';
import type { Context, StartServerResult, RsbuildConfig } from './types';

export const getServerOptions = (
  rsbuildConfig: RsbuildConfig,
): ModernServerOptions['config'] => {
  return {
    output: {
      path: rsbuildConfig.output?.distPath?.root,
      assetPrefix: rsbuildConfig.output?.assetPrefix,
      distPath: rsbuildConfig.output?.distPath,
    },
    source: {
      alias: {},
    },
    html: {},
    tools: {
      babel: {},
    },
    server: {},
    runtime: {},
    bff: {},
  };
};

export function printServerURLs(
  urls: Array<{ url: string; label: string }>,
  logger: Logger = defaultLogger,
) {
  const message = urls
    .map(({ label, url }) => `  ${`> ${label.padEnd(10)}`}${color.cyan(url)}\n`)
    .join('');

  logger.log(message);
}

export async function startProdServer(
  context: Context,
  rsbuildConfig: RsbuildConfig,
) {
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
  }

  const port = await getPort(rsbuildConfig.dev?.port || DEFAULT_PORT);
  const server = await prodServer({
    pwd: context.rootPath,
    config: getServerOptions(rsbuildConfig),
  });

  await server.init();

  return new Promise<StartServerResult>((resolve) => {
    server.listen(
      {
        host: DEFAULT_DEV_HOST,
        port,
      },
      async (err: Error) => {
        if (err) {
          throw err;
        }

        const urls = getAddressUrls('http', port);

        printServerURLs(urls);
        resolve({
          port,
          urls: urls.map((item) => item.url),
          server,
        });
      },
    );
  });
}
