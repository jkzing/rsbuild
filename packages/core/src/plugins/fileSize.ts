/**
 * modified from https://github.com/facebook/create-react-app
 * license at https://github.com/facebook/create-react-app/blob/master/LICENSE
 */
import path from 'path';
import { fs } from '@rsbuild/shared/fs-extra';
import { color, logger } from '@rsbuild/shared';
import filesize from 'filesize';
import gzipSize from 'gzip-size';
import type {
  DefaultRsbuildPlugin,
  Stats,
  MultiStats,
  StatsAsset,
} from '@rsbuild/shared';

/** Filter source map and license files */
export const filterAsset = (asset: string) =>
  !/\.map$/.test(asset) && !/\.LICENSE\.txt$/.test(asset);

const getAssetColor = (size: number) => {
  if (size > 300 * 1000) {
    return color.red;
  }
  if (size > 100 * 1000) {
    return color.yellow;
  }
  return color.green;
};

async function printHeader(
  longestFileLength: number,
  longestLabelLength: number,
) {
  const longestLengths = [longestFileLength, longestLabelLength];
  const headerRow = ['File', 'Size', 'Gzipped'].reduce((prev, cur, index) => {
    const length = longestLengths[index];
    let curLabel = cur;
    if (length) {
      curLabel =
        cur.length < length ? cur + ' '.repeat(length - cur.length) : cur;
    }
    return `${prev + curLabel}    `;
  }, '  ');

  logger.log(color.bold(color.blue(headerRow)));
}

async function printFileSizes(stats: Stats | MultiStats, distPath: string) {
  const formatAsset = (asset: StatsAsset) => {
    const contents = fs.readFileSync(path.join(distPath, asset.name));
    const size = contents.length;
    const gzippedSize = gzipSize.sync(contents);

    return {
      size,
      folder: path.join(path.basename(distPath), path.dirname(asset.name)),
      name: path.basename(asset.name),
      gzippedSize,
      sizeLabel: filesize(size, { round: 1 }),
      gzipSizeLabel: getAssetColor(gzippedSize)(
        filesize(gzippedSize, { round: 1 }),
      ),
    };
  };

  const multiStats = 'stats' in stats ? stats.stats : [stats];
  const assets = multiStats
    .map((stats) => {
      const origin = stats.toJson({
        all: false,
        assets: true,
        cachedAssets: true,
        groupAssetsByInfo: false,
        groupAssetsByPath: false,
        groupAssetsByChunk: false,
        groupAssetsByExtension: false,
        groupAssetsByEmitStatus: false,
      });

      const filteredAssets = origin.assets!.filter((asset) =>
        filterAsset(asset.name),
      );

      return filteredAssets.map(formatAsset);
    })
    .reduce((single, all) => all.concat(single), []);

  if (assets.length === 0) {
    return;
  }

  assets.sort((a, b) => b.size - a.size);

  const longestLabelLength = Math.max(...assets.map((a) => a.sizeLabel.length));
  const longestFileLength = Math.max(
    ...assets.map((a) => (a.folder + path.sep + a.name).length),
  );

  logger.info(`Production file sizes:\n`);

  printHeader(longestFileLength, longestLabelLength);

  let totalSize = 0;
  let totalGzipSize = 0;

  assets.forEach((asset) => {
    let { sizeLabel } = asset;
    const { name, folder, gzipSizeLabel } = asset;
    const fileNameLength = (folder + path.sep + name).length;
    const sizeLength = sizeLabel.length;

    totalSize += asset.size;
    totalGzipSize += asset.gzippedSize;

    if (sizeLength < longestLabelLength) {
      const rightPadding = ' '.repeat(longestLabelLength - sizeLength);
      sizeLabel += rightPadding;
    }

    let fileNameLabel =
      color.dim(asset.folder + path.sep) + color.cyan(asset.name);

    if (fileNameLength < longestFileLength) {
      const rightPadding = ' '.repeat(longestFileLength - fileNameLength);
      fileNameLabel += rightPadding;
    }

    logger.log(`  ${fileNameLabel}    ${sizeLabel}    ${gzipSizeLabel}`);
  });

  const totalSizeLabel = `${color.bold(color.blue('Total size:'))}  ${filesize(
    totalSize,
    { round: 1 },
  )}`;
  const gzippedSizeLabel = `${color.bold(
    color.blue('Gzipped size:'),
  )}  ${filesize(totalGzipSize, { round: 1 })}`;
  logger.log(`\n  ${totalSizeLabel}\n  ${gzippedSizeLabel}\n`);
}

export const pluginFileSize = (): DefaultRsbuildPlugin => ({
  name: 'plugin-file-size',

  setup(api) {
    api.onAfterBuild(async ({ stats }) => {
      const config = api.getNormalizedConfig();

      if (config.performance.printFileSize && stats) {
        try {
          await printFileSizes(stats, api.context.distPath);
        } catch (err) {
          logger.error('Failed to print file size.');
          logger.error(err as Error);
        }
      }
    });
  },
});
