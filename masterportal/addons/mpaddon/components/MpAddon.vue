<script>
import {mapGetters} from "vuex";
import BackendConnect from "./BackendConnect.vue";
import CommentComposer from "./CommentComposer.vue";
import LayerList from "./LayerList.vue";

export default {
    // Must be "Mpaddon" (not "MpAddon"): masterportal's menu looks up
    // Modules[upperFirst("mpaddon")] = Modules.Mpaddon to read the addon's
    // name/icon for the menu entry. The Vue component name controls where
    // the store is registered. The two lint rules below are intentionally
    // overridden because this exact, single-word, file-mismatched name is required.
    // eslint-disable-next-line vue/multi-word-component-names, vue/match-component-file-name
    name: "Mpaddon",
    components: {BackendConnect, CommentComposer, LayerList},
    computed: {
        ...mapGetters("Modules/Mpaddon", ["isAuthenticated", "name", "icon"])
    }
};
</script>

<template>
    <div
        id="mp-addon"
        class="p-3"
    >
        <h5 class="mb-3">
            <i
                v-if="icon"
                :class="icon"
                class="me-2"
            />{{ $t(name) }}
        </h5>
        <BackendConnect />
        <LayerList
            v-if="isAuthenticated"
            class="mt-3"
        />
        <CommentComposer v-if="isAuthenticated" />
    </div>
</template>

<style scoped>
#mp-addon {
    width: 100%;
    max-width: 480px;
}
</style>
