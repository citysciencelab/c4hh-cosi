import js from "@eslint/js";
import pluginVuejsAccessibility from "eslint-plugin-vuejs-accessibility";
import pluginVue from "eslint-plugin-vue";
import pluginJsdoc from "eslint-plugin-jsdoc";
import vitest from "@vitest/eslint-plugin";
import globals from "globals";
import stylistic from "@stylistic/eslint-plugin";
import nodePlugin from "eslint-plugin-n";

export default [
    js.configs.recommended,
    ...pluginVue.configs["flat/recommended"],
    ...pluginVuejsAccessibility.configs["flat/recommended"],
    pluginJsdoc.configs["flat/recommended"],
    nodePlugin.configs["flat/recommended-script"],
    {
        languageOptions: {
            ecmaVersion: 2023,
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.amd,
                Config: true,
                Cesium: true,
                i18next: true,
                mapCollection: true,
                moduleCollection: true,
                StreetSmartApi: true,
                MASTERPORTAL_BASE_PATH: true,
                MASTERPORTAL_ASSETS_PATH: true
            }
        },
        plugins: {
            "vuejs-accessibility": pluginVuejsAccessibility,
            "@stylistic": stylistic
        },
        rules: {
            // Possible Problems - These rules relate to possible logic errors in code:
            "array-callback-return": "error",
            "no-constructor-return": "off", // Is deliberately ignored in some places
            "no-control-regex": "off",
            "no-duplicate-imports": "error",
            "no-cond-assign": ["error", "always"],
            "no-self-compare": "error",
            "no-template-curly-in-string": "off", // Is uses in some strings
            "no-unmodified-loop-condition": "error",
            "no-unreachable-loop": "error",
            "no-unused-private-class-members": "error",
            "no-use-before-define": "off", // Here it is done the other way around
            "require-atomic-updates": "error",
            // Suggestions - These rules suggest alternate ways of doing things:
            "accessor-pairs": "error",
            "block-scoped-var": "error",
            "consistent-return": "error",
            "consistent-this": "error",
            "curly": "error",
            "default-case": "error",
            "default-case-last": "error",
            "default-param-last": "error",
            "dot-notation": "error",
            "eqeqeq": "error",
            "func-style": ["error", "declaration"],
            "max-depth": "error",
            "max-nested-callbacks": ["error", 10],
            "max-params": ["warn", 9],
            "no-alert": "error",
            "no-array-constructor": "error",
            "no-caller": "error",
            "no-console": ["error", {"allow": ["warn", "error"]}],
            "no-empty-function": "error",
            "no-div-regex": "error",
            "no-else-return": "error",
            "no-eq-null": "error",
            "no-eval": "error",
            "no-extend-native": "error",
            "no-extra-bind": "error",
            "no-extra-label": "error",
            "no-floating-decimal": "error",
            "no-implicit-coercion": "error",
            "no-implicit-globals": "error",
            "no-implied-eval": "error",
            "no-iterator": "error",
            "no-label-var": "error",
            "no-labels": "error",
            "no-lone-blocks": "error",
            "no-lonely-if": "error",
            "no-loop-func": "error",
            "no-mixed-operators": "off",
            "no-multi-str": "error",
            "no-nested-ternary": "error",
            "no-new-func": "error",
            "no-new-object": "error",
            "no-new-wrappers": "error",
            "no-octal-escape": "error",
            "no-param-reassign": "error",
            "no-proto": "error",
            "no-restricted-properties": "error",
            "no-return-assign": "error",
            "no-return-await": "error",
            "no-script-url": "error",
            "no-sequences": "error",
            "no-shadow": "error",
            "no-undef-init": "error",
            "no-throw-literal": "error",
            "no-unneeded-ternary": "error",
            "no-unused-expressions": "off",
            "no-useless-call": "error",
            "no-useless-computed-key": "error",
            "no-useless-concat": "error",
            "no-useless-constructor": "error",
            "no-useless-rename": "error",
            "no-useless-return": "error",
            "no-var": "error",
            "no-void": "error",
            "one-var-declaration-per-line": "error",
            "prefer-const": "error",
            "prefer-numeric-literals": "error",
            "prefer-rest-params": "error",
            "radix": "error",
            "spaced-comment": "error",
            "yoda": "error",
            // changes for eslint v9
            "no-undef": "error",
            "no-unused-vars": ["error",
                {"caughtErrors": "none"}
            ],
            // changes for eslint v10
            "no-useless-assignment": "off",
            "no-unassigned-vars": "off",
            "preserve-caught-error": "off",
            // new rules in recommended
            "no-empty-static-block": "off",
            "no-new-native-nonconstructor": "off",
            "no-constant-binary-expression": "off",
            // rules which were removed from recommended
            "no-extra-semi": "error",
            "no-inner-declarations": "error",
            "no-mixed-spaces-and-tabs": "error",
            "no-new-symbol": "error",
            // end of changes for eslint v9
            // Layout & Formatting - These rules care about how the code looks rather than how it executes:
            // Deprecated - The old rules have been deprecated (in ESLint v8.53.0) in accordance with the deprecation policy, and replaced by those newer rules:
            "@stylistic/array-bracket-spacing": "error",
            "@stylistic/block-spacing": "error",
            "@stylistic/brace-style": ["error", "stroustrup"],
            "@stylistic/comma-dangle": "error",
            "@stylistic/comma-spacing": "error",
            "@stylistic/comma-style": "error",
            "@stylistic/computed-property-spacing": "error",
            "@stylistic/eol-last": ["error", "always"],
            "@stylistic/function-call-spacing": ["error", "never"],
            "@stylistic/implicit-arrow-linebreak": "error",
            "@stylistic/jsx-quotes": "error",
            "@stylistic/key-spacing": "error",
            "@stylistic/keyword-spacing": "error",
            "@stylistic/max-statements-per-line": "error",
            "@stylistic/new-parens": "error",
            "@stylistic/no-multi-spaces": "error",
            "@stylistic/no-extra-parens": [
                "error",
                "all",
                {"nestedBinaryExpressions": false}
            ],
            "@stylistic/no-multiple-empty-lines": ["error", {"max": 2, "maxBOF": 1}],
            "@stylistic/no-tabs": "error",
            "@stylistic/no-trailing-spaces": "error",
            "@stylistic/no-whitespace-before-property": "error",
            "@stylistic/object-curly-spacing": "error",
            "@stylistic/object-property-newline": "off",
            "@stylistic/padding-line-between-statements": [
                "error",
                {
                    "blankLine": "always",
                    "prev": ["const", "let", "var"],
                    "next": "*"
                },
                {
                    "blankLine": "any",
                    "prev": ["const", "let", "var"],
                    "next": ["const", "let", "var"]
                }
            ],
            "@stylistic/quotes": "error",
            "@stylistic/semi": "error",
            "@stylistic/semi-spacing": "error",
            "@stylistic/semi-style": "error",
            "@stylistic/space-before-blocks": "error",
            "@stylistic/space-before-function-paren": "error",
            "@stylistic/space-in-parens": "error",
            "@stylistic/space-infix-ops": "error",
            "@stylistic/space-unary-ops": "error",
            "@stylistic/switch-colon-spacing": "error",
            "@stylistic/wrap-regex": "error",
            // Deprecated - The old rules have been deprecated (in ESLint v7.0.0) in accordance with the deprecation policy, and replaced by those newer rules:
            "n/callback-return": "error",
            "n/handle-callback-err": "error",
            "n/prefer-global/buffer": "error",
            "n/no-path-concat": "error",
            "n/no-process-env": "error",
            "n/no-unpublished-import": "off",
            "n/no-missing-import": "off",
            "n/no-extraneous-import": "off",
            "n/no-unsupported-features/node-builtins": "off",
            "n/no-unpublished-require": "off",
            "n/no-extraneous-require": "off",
            "n/no-missing-require": "off",
            "n/no-unsupported-features/es-syntax": "off",
            "n/no-unsupported-features/es-builtins": "off",
            // eslint-plugin-jsdoc
            "jsdoc/check-types": "off",
            "jsdoc/require-returns": "off",
            "jsdoc/require-throws-type": "off",
            "jsdoc/check-tag-names": "off",
            "jsdoc/no-undefined-types": "off",
            "jsdoc/no-defaults": "off",
            "jsdoc/check-alignment": "off",
            "jsdoc/tag-lines": "off",
            "jsdoc/valid-types": "off",
            "jsdoc/require-returns-check": "off",
            "jsdoc/check-param-names": "off",
            "jsdoc/no-multi-asterisks": "off",
            "jsdoc/require-param": "off",
            "jsdoc/require-property-description": "off",
            "jsdoc/require-property": "off",
            "jsdoc/require-property-name": "off",
            "jsdoc/check-property-names": "off",
            "jsdoc/multiline-blocks": "off",
            "jsdoc/empty-tags": "off",
            "jsdoc/implements-on-classes": "off",
            "jsdoc/require-param-name": "off",
            "jsdoc/require-param-description": "off",
            "jsdoc/reject-any-type": "off",
            "jsdoc/reject-function-type": "off",
            "jsdoc/escape-inline-tags": "off",
            "jsdoc/require-jsdoc": [
                "error",
                {
                    "require": {
                        "FunctionDeclaration": true,
                        "MethodDefinition": true,
                        "ClassDeclaration": true,
                        "ArrowFunctionExpression": false,
                        "FunctionExpression": false
                    }
                }
            ],
            // vue plugin Base Rules
            "vue/comment-directive": [
                "error",
                {
                    "reportUnusedDisableDirectives": false
                }
            ],
            "vue/jsx-uses-vars": ["off"],
            "vue/require-explicit-emits": ["off"],
            "vue/no-deprecated-destroyed-lifecycle": ["off"],
            "vue/no-deprecated-events-api": ["off"],
            "vue/v-on-event-hyphenation": ["off"],
            "vue/no-deprecated-slot-attribute": ["off"],
            "vue/no-deprecated-slot-scope-attribute": ["off"],
            "vue/no-deprecated-v-on-native-modifier": ["off"],
            "vue/no-v-for-template-key-on-child": ["off"],
            "vue/no-deprecated-v-bind-sync": ["off"],
            "vue/html-indent": ["error", 4],
            "vue/html-closing-bracket-newline": [
                "error",
                {
                    "singleline": "never",
                    "multiline": "always"
                }
            ],
            "vue/html-closing-bracket-spacing": [
                "error",
                {
                    "startTag": "never",
                    "endTag": "never",
                    "selfClosingTag": "always"
                }
            ],
            "vue/html-end-tags": "error",
            "vue/html-quotes": ["error", "double"],
            "vue/max-attributes-per-line": [
                "error",
                {
                    "singleline": {
                        "max": 1
                    },
                    "multiline": {
                        "max": 1
                    }
                }
            ],
            "vue/no-multi-spaces": "error",
            "vue/no-spaces-around-equal-signs-in-attribute": "error",
            "vue/no-template-shadow": "error",
            "vue/no-v-html": ["off"],
            "vue/match-component-file-name": [
                "error",
                {
                    "extensions": ["vue"],
                    "shouldMatchCase": true
                }
            ],
            // eslint-plugin-vuejs-accessibility
            "vuejs-accessibility/label-has-for": [
                "error",
                {
                    "required": {
                        "some": ["nesting", "id"]
                    }
                }
            ],
            /*
             * rule turned off since it's e.g. deprecated here:
             * https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/issues/398
             * It does not work too well for the Masterportal where changes in
             * e.g. select elements are supposed to immediately trigger changes
             * in the map interactions
             */
            "vuejs-accessibility/no-onchange": "off",
            "vuejs-accessibility/form-control-has-label": "off",
            // Enforce explicit extensions
            "no-restricted-syntax": [
                "error",

                // 1) Relative imports ("./" or "../") must end with .js or .vue
                {
                    selector: "ImportDeclaration[source.value=/^\\./]:not([source.value=/\\.(?:js|vue|json|css|scss|sass)$/])",
                    message: "Relative imports must include a valid extension (.js, .vue, .json, .css, .scss, or .sass)."
                },

                // 2) Aliases must end with .js or .vue (@shared, @core, @modules, @appstore, @masterportal)
                {
                    selector: "ImportDeclaration[source.value=/^@(?:shared|core|modules|appstore|masterportal)/]:not([source.value=/\\.(?:js|vue)$/])",
                    message: "Alias imports (@shared/@core/@modules/@appstore/@masterportal) must include .js or .vue."
                },

                // 3) OpenLayers subpaths must end with .js (exclude bare 'ol')
                {
                    selector: "ImportDeclaration[source.value=/^ol(?:\\/|$)/]:not([source.value='ol']):not([source.value=/\\.js$/])",
                    message: "OpenLayers subpath imports must end with .js (e.g. ol/interaction/Draw.js)."
                },

                // 4) (optional) Dynamic relative imports must include .js or .vue
                {
                    selector: "CallExpression[callee.type='Import'] > Literal[value=/^\\./]:not([value=/\\.(?:js|vue|json|css|scss|sass)$/])",
                    message: "Dynamic relative imports must include .js, .vue, .json, .css, .scss, or .sass."
                },

                // 5) (optional) Dynamic alias imports must include .js or .vue
                {
                    selector: "CallExpression[callee.type='Import'] > Literal[value=/^@(?:shared|core|modules|appstore|masterportal)/]:not([value=/\\.(?:js|vue)$/])",
                    message: "Dynamic alias imports must include .js or .vue."
                }
            ],
            "vue/no-restricted-syntax": [
                "error",

                // 1) Disallow <input> without a type attribute (static or v-bind/:type)
                {
                    selector: "VElement[name='input']:not(:has(VAttribute[directive=false][key.name='type'])):not(:has(VAttribute[directive=true][key.name.name='bind'][key.argument.name='type']))",
                    message: "Native <input> without a type attribute is not allowed. Use <InputText> or specify an explicit type."
                },

                // 2) Disallow only the static text type: <input type=\"text\">
                {
                    selector: "VElement[name='input']:has(VAttribute[directive=false][key.name='type'][value.value='text'])",
                    message: "Native <input type=\"text\"> is not allowed. Use <InputText> instead."
                },

                // 3) Disallow native accordion buttons with static class="accordion-button".
                {
                    selector: "VElement[name='button']:has(VAttribute[directive=false][key.name='class'][value.value=/\\baccordion-button\\b/])",
                    message: "Native <button class=\"accordion-button\"> is not allowed. Use <AccordionItem> instead."
                },

                // 4) Disallow accordion-button literals inside dynamic :class expressions.
                {
                    selector: "VElement[name='button']:has(VAttribute[directive=true][key.name.name='bind'][key.argument.name='class'] VLiteral[value='accordion-button']), VElement[name='button']:has(VAttribute[directive=true][key.name.name='bind'][key.argument.name='class'] Literal[value='accordion-button'])",
                    message: "Native <button> with class \"accordion-button\" is not allowed. Use <AccordionItem> instead."
                }
            ]


        }
    },
    {
        files: ["addons/**/*.{js,vue}"],
        rules: {
            "no-restricted-syntax": "off",
            "vue/no-restricted-syntax": "off",
            "vue/no-deprecated-delete-set": "off",
            "vue/no-deprecated-model-definition": "off",
            "jsdoc/ts-no-empty-object-type": "off"
        }
    },
    {
        files: ["src/shared/modules/accordion/components/AccordionItem.vue"],
        rules: {
            "vue/no-restricted-syntax": "off"
        }
    },
    {
        files: ["**/*.spec.js"],
        plugins: {vitest},
        languageOptions: {
            globals: {
                ...vitest.environments.env.globals,
                before: "readonly",
                after: "readonly",
                context: "readonly"
            }
        },
        rules: {
            "vitest/no-focused-tests": "error"
        }
    },
    {
        ignores: [
            "**/node_modules/",
            "**/dist/",
            "**/portalconfigs/",
            "**/jsdoc/",
            "**/docHtml/",
            "**/.git/",
            "**/html/",
            "portal/*",
            "!portal/basic",
            "!portal/master",
            "!portal/auto",
            "site/",
            ".venv/"
        ]
    }
];
