import type { ESLint, Linter } from "eslint";

/** Matches a CSS hex colour: #rgb, #rgba, #rrggbb or #rrggbbaa. */
export declare const HEX_COLOUR: RegExp;
export declare const plinthPlugin: ESLint.Plugin;
/** Flat-config block that turns plinth/no-hex-colour on. */
export declare const noHexColourConfig: Linter.Config;
export default plinthPlugin;
