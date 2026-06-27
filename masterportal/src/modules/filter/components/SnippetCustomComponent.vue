<script>
/**
 * Snippet Custom Component
 * This component allows the dynamic rendering of a Vue component based on the provided `componentName`
 * @module modules/SnippetCustomComponent
 * @vue-prop {String|Object} componentName - The name of the Vue component to render. Can be a string or a raw Vue component object.
 * If a string is provided, it should correspond to a registered component name (can also be an addon).
 * @vue-prop {Object} [propsObject={}] - An object containing props to pass to the component. The object will be destructured into the props to be passed.
 * */

export default {
    name: "SnippetCustomComponent",
    props: {
        componentName: {
            type: [String, Object],
            required: true
        },
        propsObject: {
            type: Object,
            required: false,
            default: () => ({})
        }
    }
};

</script>

<template>
    <component
        :is="componentName"
        v-bind="propsObject"
    />
</template>

