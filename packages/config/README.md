# @plinth/config

Shared presets, owned by T05:

- `tsconfig.base.json`: strict, `noUncheckedIndexedAccess`, bundler resolution.
- `eslint` (`@plinth/config/eslint`): the flat config for `packages/*`. The Next apps use `eslint-config-next` and add the Plinth rules below.
- `eslint/plugin` (`@plinth/config/eslint/plugin`): Plinth's own rules.
  - `plinth/no-hex-colour`: no hex colour literals (`"#1D5A44"`, `fill="#FFF"`, template strings, JSX text) outside `@plinth/tokens`. Use a token class (`bg-panel`, `text-ink`) or `var(--pl-color-…)`. `href="#…"` anchors are skipped. On in the base preset and in `apps/web`. `packages/tokens` may turn it off in its own config.

```js
// a Next app's eslint.config.mjs
import { noHexColourConfig } from "@plinth/config/eslint/plugin";
export default [...nextConfigs, noHexColourConfig];
```

`npm run -w @plinth/config test` runs the rule's tests.
