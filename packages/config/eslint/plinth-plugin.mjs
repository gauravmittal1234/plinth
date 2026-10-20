// Plinth's own ESLint rules (owner: T05). Used by the base preset for packages/*
// and by apps/web's flat config.
//
// plinth/no-hex-colour: colours come only from @plinth/tokens (BUILD_PLAN §5.2,
// DESIGN §3). A hex literal anywhere else ("#1D5A44", `fill="#FFF"`) is an error.
// packages/tokens is the one place hex values live; its config turns the rule off.
// `href="#abc"` is an anchor, not a colour, so href values are skipped.

/** Matches a CSS hex colour: #rgb, #rgba, #rrggbb or #rrggbbaa. */
export const HEX_COLOUR = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-zA-Z_-])/;

const noHexColour = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow hex colour literals outside @plinth/tokens",
    },
    schema: [],
    messages: {
      hex: 'Hex colour "{{hex}}": use a token from @plinth/tokens (a Tailwind class such as bg-panel or text-ink, or var(--pl-color-…)) instead.',
    },
  },
  create(context) {
    function check(node, text) {
      if (typeof text !== "string") return;
      const m = HEX_COLOUR.exec(text);
      if (m) context.report({ node, messageId: "hex", data: { hex: m[0] } });
    }
    function isHref(node) {
      const p = node.parent;
      return p?.type === "JSXAttribute" && p.name?.name === "href";
    }
    return {
      Literal(node) {
        if (typeof node.value === "string" && !isHref(node)) check(node, node.value);
      },
      TemplateElement(node) {
        check(node, node.value.raw);
      },
      JSXText(node) {
        check(node, node.value);
      },
    };
  },
};

export const plinthPlugin = {
  meta: { name: "@plinth/eslint-plugin" },
  rules: { "no-hex-colour": noHexColour },
};

/** Flat-config block that turns the rule on for every file the config covers. */
export const noHexColourConfig = {
  name: "plinth/no-hex-colour",
  plugins: { plinth: plinthPlugin },
  rules: { "plinth/no-hex-colour": "error" },
};

export default plinthPlugin;
