---
applyTo: "**/*.vue"
---

# Vue Component Conventions — Masterportal

## Template Rules (ESLint-enforced)

- **4-space indent** inside every `<template>` block
- **Max 1 attribute per line** — applies to both single-line and multi-line elements
- HTML double quotes for attribute values (`vue/html-quotes`)
- Component `name` property must exactly match the filename (`vue/match-component-file-name`)
- `<li>` must be a direct child of `<ol>`, `<ul>`, `<menu>`, or `<template>`
- Styles must use `scoped`; no inline styles (`style=""`); no `!important`
- No `v-html` without explicit justification (rule is off but avoid it)

## Banned Native HTML — Use Shared Components Instead

The following native elements are **ESLint errors** in `src/` (not in `addons/`):

| Banned | Use instead | Import path |
|--------|-------------|-------------|
| `<input type="text">` | `<InputText>` | `@shared/modules/inputs/components/InputText.vue` |
| `<input>` without `type` | `<InputText>` | `@shared/modules/inputs/components/InputText.vue` |
| `<button class="accordion-button">` | `<AccordionItem>` | `@shared/modules/accordion/components/AccordionItem.vue` |

## Shared Component Inventory

Always prefer shared components over building custom equivalents. Available in `src/shared/modules/`:

| Component | File | Purpose |
|-----------|------|---------|
| `InputText` | `inputs/components/InputText.vue` | Text input (replaces `<input type="text">`) |
| `ColorPicker` | `inputs/components/ColorPicker.vue` | Color picker input |
| `FileUpload` | `inputs/components/FileUpload.vue` | File upload input |
| `SwitchInput` | `checkboxes/components/SwitchInput.vue` | Toggle/checkbox |
| `AccordionItem` | `accordion/components/AccordionItem.vue` | Accordion section (replaces `<button class="accordion-button">`) |
| `ModalItem` | `modals/components/ModalItem.vue` | Generic modal wrapper |
| `ConfirmModal` | `modals/components/ConfirmModal.vue` | Confirm/cancel dialog |
| `SpinnerItem` | `spinner/components/SpinnerItem.vue` | Loading spinner |
| `SliderItem` | `slider/components/SliderItem.vue` | Single-value range slider |
| `SliderDualRange` | `slider/components/SliderDualRange.vue` | Dual-handle range slider |
| `PaginationControl` | `pagination/components/PaginationControl.vue` | Pagination bar |
| `TabContainer` | `tabs/components/TabContainer.vue` | Tab container |
| `NavTab` | `tabs/components/NavTab.vue` | Individual tab |
| `LayerPreview` | `layerPreview/components/LayerPreview.vue` | Map layer thumbnail |
| `IconButton` | `buttons/components/IconButton.vue` | Icon-only button |
| `FlatButton` | `buttons/components/FlatButton.vue` | Flat/text button |
| `ElevatedButton` | `buttons/components/ElevatedButton.vue` | Raised/primary button |
| `LightButton` | `buttons/components/LightButton.vue` | Light variant button |
| `ButtonGroup` | `buttons/components/ButtonGroup.vue` | Button group container |
| `ExportButtonCSV` | `buttons/components/ExportButtonCSV.vue` | CSV export button |
| `ExportButtonGeoJSON` | `buttons/components/ExportButtonGeoJSON.vue` | GeoJSON export button |

## SCSS / Styles

```html
<style lang="scss" scoped>
.my-module {
    // module-prefixed class names
}
</style>
```

- Use `scoped` on every `<style>` tag
- **Never** write `@import 'variables'` or `@import "~variables";` — both cause errors in Vite; Bootstrap theming variables and shared mixins are available automatically via the Vite config
- Class names must be prefixed with the module name to avoid global leakage (rule A.3.9)
- Use `rem` for sizes, not `px` — ensures proper scaling with user font-size settings
- No absolute `width`/`height` values where avoidable — prefer responsive units

## Accessibility (vuejs-accessibility plugin)

- `<label>` elements must have a `for` attribute that references an input `id`, or must wrap the input (rule: `label-has-for`)
- Interactive elements must have accessible names
- For `<select>` elements prefer `v-model` for two-way binding, or `@change` / `v-on:change` for one-way event handling — the React/JSX `onChange` attribute has no special meaning in Vue templates and must not be used

## i18n in Templates

```html
<!-- ✅ correct -->
<span>{{ $t('common:modules.myModule.label') }}</span>
<MyComponent :title="$t('common:modules.myModule.title')" />

<!-- ❌ wrong — hardcoded text fails review -->
<span>My Label</span>

<!-- ❌ wrong — backtick template literals for static keys -->
<MyComponent :title="$t(`common:modules.myModule.title`)" />
```

- Use single quotes for all static translation keys in template expressions — both inside `{{ }}` interpolation and inside bound attribute expressions (e.g. `$t('...')`)
- Do **not** use backtick template literals for static keys that contain no interpolation; they add no value and are inconsistent with the project quote style
