import { join, dirname } from 'path';
import { expect, test } from '@playwright/test';
import { fs } from '@rsbuild/shared/fs-extra';
import { build } from '@scripts/shared';
import { pluginReact } from '@rsbuild/plugin-react';

const fixtures = __dirname;

test.describe('output configure multi', () => {
  const distFilePath = join(fixtures, 'rem/dist-1/test.json');

  let rsbuild: Awaited<ReturnType<typeof build>>;

  test.beforeAll(async () => {
    await fs.mkdir(dirname(distFilePath), { recursive: true });
    await fs.writeFile(
      distFilePath,
      `{
      "test": 1
    }`,
    );

    rsbuild = await build({
      cwd: join(fixtures, 'rem'),
      entry: {
        main: join(fixtures, 'rem/src/index.ts'),
      },
      plugins: [pluginReact()],
      rsbuildConfig: {
        output: {
          distPath: {
            root: 'dist-1',
            js: 'aa/js',
          },
          copy: [{ from: './src/assets', to: '' }],
        },
      },
    });
  });

  test.afterAll(async () => {
    rsbuild.close();
    await rsbuild.clean();
  });

  test('cleanDistPath default (enable)', async () => {
    expect(fs.existsSync(distFilePath)).toBeFalsy();
  });

  test('copy', async () => {
    expect(fs.existsSync(join(fixtures, 'rem/dist-1/icon.png'))).toBeTruthy();
  });

  test('distPath', async () => {
    expect(fs.existsSync(join(fixtures, 'rem/dist-1/main.html'))).toBeTruthy();

    expect(fs.existsSync(join(fixtures, 'rem/dist-1/aa/js'))).toBeTruthy();
  });

  test('sourcemap', async () => {
    const files = await rsbuild.unwrapOutputJSON(false);

    const jsMapFiles = Object.keys(files).filter((files) =>
      files.endsWith('.js.map'),
    );
    const cssMapFiles = Object.keys(files).filter((files) =>
      files.endsWith('.css.map'),
    );
    expect(jsMapFiles.length).toBeGreaterThanOrEqual(1);
    expect(cssMapFiles.length).toBe(0);
  });
});

test('cleanDistPath disable', async () => {
  const distFilePath = join(fixtures, 'rem/dist-2/test.json');

  await fs.mkdir(dirname(distFilePath), { recursive: true });
  await fs.writeFile(
    distFilePath,
    `{
    "test": 1
  }`,
  );

  const rsbuild = await build({
    cwd: join(fixtures, 'rem'),
    entry: {
      main: join(fixtures, 'rem/src/index.ts'),
    },
    plugins: [pluginReact()],
    rsbuildConfig: {
      output: {
        distPath: {
          root: 'dist-2',
        },
        cleanDistPath: false,
      },
    },
  });

  expect(fs.existsSync(distFilePath)).toBeTruthy();

  rsbuild.close();
  rsbuild.clean();
});

test('disableSourcemap', async () => {
  const rsbuild = await build({
    cwd: join(fixtures, 'rem'),
    entry: {
      main: join(fixtures, 'rem/src/index.ts'),
    },
    plugins: [pluginReact()],
    rsbuildConfig: {
      output: {
        distPath: {
          root: 'dist-3',
        },
        disableSourceMap: true,
      },
    },
  });

  const files = await rsbuild.unwrapOutputJSON(false);

  const jsMapFiles = Object.keys(files).filter((files) =>
    files.endsWith('.js.map'),
  );
  const cssMapFiles = Object.keys(files).filter((files) =>
    files.endsWith('.css.map'),
  );
  expect(jsMapFiles.length).toBe(0);
  expect(cssMapFiles.length).toBe(0);
});
