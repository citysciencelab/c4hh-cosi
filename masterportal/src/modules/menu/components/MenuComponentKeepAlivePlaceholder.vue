<script>
/**
 * This component acts as an empty placeholder component for the keep-alive feature in the main and secondary menu.
 * see: src/modules/menu/components/MenuContainerBody.vue
 *
 * The Vue keep-alive feature only works if a component is always included.
 * Conditional skipping of components using v-if is not possible.
 *
 * To avoid the "Component is missing template or render function" error, we implement the
 * Vue render method and return null.
 */
export default {
    name: "MenuComponentKeepAlivePlaceholder",
    render () {
        return null;
    }
};
</script>
