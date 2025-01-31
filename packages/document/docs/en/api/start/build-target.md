# Build Target

Rsbuild supports build multiple target types for running in different target environments. After setting the correct target type, Rsbuild will optimize the build results for the environment, and enable some plugins or configs for the target environment during the build process.

You can set the type through the `target` parameter of the [createRsbuild](/api/javascript-api/core.html#creatersbuild) method.

## Default Target

By default, the build target is `'web'`, and the build result can run in a browser environment.

the Rsbuild will read the [Browserslist config](https://github.com/browserslist/browserslist) in the project to determine the range of browsers.

## Optional Targets

`target` can also be set to the following values:

- `'node'`: Build for Node.js environment, usually used in SSR and other scenarios.
- `'web-worker'`: Build for Web Worker environment.

For example, to build for the Node.js environment:

```ts
const rsbuild = await createRsbuild(provider, {
  target: 'node',
});
```

## Multiple Targets

When target is an array containing multiple values, Rsbuild will perform multiple builds at the same time.

For example, we can build a browser target and an node target at the same time:

```ts
const rsbuild = await createRsbuild(provider, {
  target: ['web', 'node'],
});
```

## Node Target

Refers to the build target running in the Node.js environment, usually used in scenarios such as SSR.

When `target` is set to `'node'`, Rsbuild will:

- No HTML files will be generated, and HTML-related logic will not be executed, since HTML is not required by the Node.js environment.
- CSS code will not be bundled or extracted, but the id information of CSS Modules will be included in the bundle.
- The default code split strategy will be disabled, but dynamic import can still work.
- Disable the HMR.
- Adjust the default value of Browserslist to `['node >= 14']`.

:::tip
If target is an array, such as building web and node targets at the same time, then the above processing will not affect the web target, The HTML, CSS and other files required for the web target will still be generated correctly.
:::

## Web Worker Target

Refers to the build target running in the [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) environment.

:::tip Web Worker
A web worker is a type of JavaScript program that runs in the background, independently of other scripts, without affecting the performance of the page. This makes it possible to run long-running scripts, such as ones that handle complex calculations or access remote resources, without blocking the user interface or other scripts. Web workers provide an easy way to run tasks in the background and improve the overall performance of web applications.
:::

When `target` is set to `'web-worker'`, Rsbuild will:

- No HTML files will be generated, and HTML-related logic will not be executed, since HTML is not required by the Web Worker environment.
- CSS code will not be bundled or extracted, but the id information of CSS Modules will be included in the bundle.
- The default code split strategy will be disabled, and **dynamic import can not work**, because the Web Worker only runs a single JavaScript file.
- Disable the HMR.
