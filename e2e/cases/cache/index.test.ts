import path from 'path';
import { expect } from '@playwright/test';
import { webpackOnlyTest } from '@scripts/helper';
import { build } from '@scripts/shared';
import { fs } from '@rsbuild/shared/fs-extra';

webpackOnlyTest(
  'should save the buildDependencies to cache directory and hit cache',
  async () => {
    const cacheDirectory = path.resolve(
      __dirname,
      './node_modules/.cache/webpack',
    );

    process.env.TEST_ENV = undefined;

    const buildConfig = {
      cwd: __dirname,
      entry: { index: path.resolve(__dirname, './src/index.js') },
      rsbuildConfig: {
        tools: {
          bundlerChain: (chain: any) => {
            if (process.env.TEST_ENV === 'a') {
              chain.resolve.extensions.prepend('.a.js');
            }
          },
        },
        performance: {
          buildCache: {
            cacheDirectory,
          },
        },
      },
    };

    const configFile = path.resolve(cacheDirectory, 'buildDependencies.json');

    fs.emptyDirSync(cacheDirectory);

    // first build no cache
    let rsbuild = await build(buildConfig);

    expect(
      (await rsbuild.getIndexFile()).content.includes('222222'),
    ).toBeTruthy();

    const buildDependencies = await fs.readJSON(configFile);
    expect(Object.keys(buildDependencies)).toEqual(['tsconfig']);

    process.env.TEST_ENV = 'a';

    // hit cache => unfortunately, extension '.a.js' not work
    rsbuild = await build(buildConfig);

    expect(
      (await rsbuild.getIndexFile()).content.includes('222222'),
    ).toBeTruthy();
  },
);

webpackOnlyTest('cacheDigest should work', async () => {
  const cacheDirectory = path.resolve(
    __dirname,
    './node_modules/.cache/webpack-1',
  );

  process.env.TEST_ENV = undefined;

  const getBuildConfig = () => ({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    rsbuildConfig: {
      tools: {
        bundlerChain: (chain: any) => {
          if (process.env.TEST_ENV === 'a') {
            chain.resolve.extensions.prepend('.a.js');
          }
        },
      },
      performance: {
        buildCache: {
          cacheDirectory,
          cacheDigest: [process.env.TEST_ENV],
        },
      },
    },
  });

  const configFile = path.resolve(cacheDirectory, 'buildDependencies.json');

  fs.emptyDirSync(cacheDirectory);

  // first build no cache
  let rsbuild = await build(getBuildConfig());

  expect(
    (await rsbuild.getIndexFile()).content.includes('222222'),
  ).toBeTruthy();

  const buildDependencies = await fs.readJSON(configFile);
  expect(Object.keys(buildDependencies)).toEqual(['tsconfig']);

  process.env.TEST_ENV = 'a';

  rsbuild = await build(getBuildConfig());

  // extension '.a.js' should work
  expect(
    (await rsbuild.getIndexFile()).content.includes('111111'),
  ).toBeTruthy();
});
