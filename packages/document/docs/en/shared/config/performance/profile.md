- **Type:** `boolean`
- **Default:** `false`

Whether capture timing information for each module, same as the [profile](https://webpack.js.org/configuration/other-options/#profile) config of Rspack.

### Example

```js
export default {
  performance: {
    profile: true,
  },
};
```

When enabled, Rspack generates a JSON file with some statistics about the module that includes information about timing information for each module.
