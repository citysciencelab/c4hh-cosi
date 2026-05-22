<script>
import {Editor, EditorContent} from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import TipTapEditorControls from "./TipTapEditorControls.vue";

export default {
    name: "TipTapEditor",
    components: {
        EditorContent,
        TipTapEditorControls
    },

    data () {
        return {
            editor: null
        };
    },

    mounted () {
        this.editor = new Editor({
            content: "<p>I'm running Tiptap with Vue.js. 🎉</p>",
            extensions: [StarterKit]
        });
    },

    beforeUnmount () {
        this.editor.destroy();
    }
};
</script>

<template>
    <div class="w-100">
        <TipTapEditorControls
            :editor
        />
        <EditorContent
            :editor
        />
    </div>
</template>
