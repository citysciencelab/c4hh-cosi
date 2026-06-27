<script>
import {FloatingMenu} from "@tiptap/vue-3";
import TipTapEditorControls from "./TipTapEditorControls.vue";

export default {
    name: "TipTapEditorFloatingMenu",
    components: {
        FloatingMenu,
        TipTapEditorControls
    },
    props: {
        editor: {
            type: [Object, null],
            required: true
        }
    }
};
</script>

<template>
    <FloatingMenu
        v-if="editor"
        :editor="editor"
        :tippy-options="{
            placement: 'top-start'
        }"
    >
        <TipTapEditorControls :editor="editor" />
    </FloatingMenu>
</template>

