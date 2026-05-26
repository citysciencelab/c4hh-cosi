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

    props: {
        modelValue: {
            type: [String, Object],
            default: () => ""
        }
    },

    emits: ["update:modelValue"],

    data () {
        return {
            editor: null
        };
    },

    watch: {
        modelValue (value) {
            const isSame = JSON.stringify(this.editor.getJSON()) === JSON.stringify(value);

            if (isSame) {
                return;
            }
            this.editor.commands.setContent(value);
        }
    },

    mounted () {
        this.editor = new Editor({
            content: this.modelValue,
            extensions: [StarterKit],
            onUpdate: ({editor}) => {
                this.$emit("update:modelValue", editor.getJSON());
            }
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
