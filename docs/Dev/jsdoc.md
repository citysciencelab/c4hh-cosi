# JsDoc

Create the jsdoc with `npm run buildJsDoc` and open file .../jsdoc/index.html.

See files under `src\modules\coordToolkit` as examples for correct jsdoc.

## build check

Always run `npm run buildJsDoc` after changing jsdoc comments.

If the command fails, fix the reported type expression first before committing.

## important type rules (must follow)

Use simple, jsdoc-compatible type expressions.

### valid patterns

- Primitive types: `string`, `number`, `boolean`
- Object/function types: `Object`, `Function`
- Arrays: `string[]`, `Object[]`, `Array<number>`, `Array<Array<number>>`
- Unions: `(string|boolean)`, `(boolean|null)`
- Generic objects/maps: `Object.<string, Function>`, `Map<string, Object>`

### primitive type convention

- Always use lowercase primitive types in JSDoc type expressions: `string`, `number`, `boolean`.
- Never use wrapper object primitives in type expressions: `String`, `Number`, `Boolean`.
- Applies to all JSDoc tags in this project, including `@param`, `@property`, `@returns`, `@typedef`, `@vue-prop`, `@vue-data`, `@vue-computed`, and `@vue-event`.

### multidimensional arrays and tuples

JSDoc does not support tuple types (fixed-length typed arrays) natively.
For multidimensional coordinates or arrays of fixed-length subarrays, use generic array syntax and document the structure in the description:

```js
/**
 * Get coordinate arrays.
 * @returns {Array<Array<number>>} Array of [lng, lat] coordinate pairs
 */

/**
 * Get boundary boxes.
 * @returns {Array<Array<number>>} Array of [minX, minY, maxX, maxY] bounding boxes
 */

/**
 * Get 3D points.
 * @returns {Array<Array<number>>} Array of [x, y, z] coordinates
 */
```

Never use comma-separated dimensions in the type itself: `Array<{number, number}>` is invalid.

### invalid patterns (do not use)

- Comma-separated unions: `{string, boolean}`
- Tuple-like comma syntax: `{number, number}`
- Bracket tuple syntax as a type: `{[number, number]}`
- Bracket pseudo-array syntax: `{[string]}`, `{[Object]}`
- JS expressions in types: `{true || null}`
- `import(...)` in jsdoc type expressions in this project
- Custom pseudo-types like `{Tab{}}`

## vue component

The jsdoc should have a module path corresponding to the path in the folder structure: `@module modules/draw/components/DrawModule` and must be located directly above `export default {`.

`@vue-data` to describe data

`@vue-prop` to describe props

`@vue-computed`  to describe computed properties

To provide default values in jsdoc, do it like this:
```js
* @vue-prop {string} [selectedInteraction="draw"] - The selected interaction.
```

All methods must provide jsdoc, it is shown also in created jsdoc-files.

## Example

```js
/**
 * Modules to make drawings.
 * @module modules/draw/components/DrawModule
 * @vue-prop {ol/layer/Vector} layer - The vector layer to get the height of.
 * @vue-prop {string} [selectedInteraction="draw"] - The selected interaction.
 * @vue-data {ol/layer/Vector} [layer=null] - The vector layer for drawings.
 * @vue-data {ol/source/Vector} [source=new VectorSource()] - The vector source for drawings.
 * @vue-computed {string} message - Error message for missing something.
 */
 export default {
     name: "DrawModule",
```

## store actions, getters, mutations

The jsdoc should have a module path corresponding to the path in the folder structure: ` @module modules/draw/store/actions` and must be located directly above `export default {`.

All functions must provide jsdoc, it is shown also in created jsdoc-files.

## Examples
```js
/**
 * The actions for the draw module.
 * @module modules/draw/store/actions
 */
export default {
```

```js
/**
 * The getters for the draw module.
 * @module modules/draw/store/getters
 */
export default {
```

```js
/**
 * The mutations for the draw module.
 * @module modules/draw/store/mutations
 */
```

## store state

The jsdoc should have a module path corresponding to the path in the folder structure: `@module modules/draw/store/state`.

All properties must provide jsdoc.

## Example
```js
/**
 * State of module draw.
 * @module modules/draw/store/state
 *
 * @property {string[]} [drawTypesMain=["pen", "geometries", "symbols"]] The top level (main) drawing types.
 * @property {string} [icon="bi-pencil"] Icon next to title (config-param)
 * @property {string} [name="common:modules.draw.name"] Displayed as title (config-param)
 * @property {string} [selectedDrawType=""] The selected draw type.
 * @property {string} [selectedDrawTypeMain=""] The selected draw type main.
 * @property {boolean} [showDescription=""] If true, description will be shown.
 * @property {string[]} [supportedDevices=["Desktop", "Mobile", "Table"]] Devices on which the module is displayed.
 * @property {string[]} [supportedMapModes=["2D", "3D"]] Map mode in which this module can be used.
 * @property {string} [type="draw"] The type of the module.
 const state = {
```

## other javascript files

The jsdoc should have a module path corresponding to the path in the folder structure, e.g. : `@module modules/draw/js/interaction`.

All functions must provide jsdoc.

## Example
```js
/**
 * Handling of interactions.
 * @module modules/draw/js/interaction
 */
```
