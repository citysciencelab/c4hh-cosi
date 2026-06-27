<script>
import {BubbleMenu} from "@tiptap/vue-3";
import TipTapEditorControls from "./TipTapEditorControls.vue";

export default {
    name: "TipTapEditorBubbleMenu",
    components: {
        BubbleMenu,
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
    <BubbleMenu
        v-if="editor"
        :editor="editor"
        :tippy-options="{
            placement: 'top-start'
        }"
    >
        <TipTapEditorControls :editor="editor" />
    </BubbleMenu>
</template>
