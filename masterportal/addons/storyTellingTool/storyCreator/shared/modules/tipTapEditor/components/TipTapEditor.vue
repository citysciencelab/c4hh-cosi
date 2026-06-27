<script>
import {Editor, EditorContent} from "@tiptap/vue-3";
import extensions from "../js/tipTapExtensions";
import TipTapEditorBubbleMenu from "./TipTapEditorBubbleMenu.vue";
import TipTapEditorFloatingMenu from "./TipTapEditorFloatingMenu.vue";

export default {
    name: "TipTapEditor",
    components: {
        EditorContent,
        TipTapEditorBubbleMenu,
        TipTapEditorFloatingMenu
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
            if (!this.editor) {
                return;
            }

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
            extensions,
            onUpdate: ({editor}) => {
                this.$emit("update:modelValue", editor.getJSON());
            },
            autofocus: "end"
        });
    },

    beforeUnmount () {
        this.editor?.destroy();
    }
};
</script>

<template>
    <div class="w-100">
        <EditorContent
            v-if="editor"
            class="h-25"
            :editor="editor"
        />
        <TipTapEditorBubbleMenu
            :editor="editor"
        />
        <TipTapEditorFloatingMenu
            :editor="editor"
        />
    </div>
</template>

<style lang="scss">
.tiptap {
    min-height: 150px;
    padding: 0.5rem;

    &:focus {
        outline: none;
    }

    strong, b {
        font-family: $font_family_accent;
    }

    p {
        font-size: $font-size-base;
    }

    h1, h2, h3, h4, h5, h6 {
        font-family: $font_family_accent;
        text-transform: unset;
        border: 0;
        color: $dark_grey;
        line-height: 1.1;
        word-wrap: break-word;
        overflow-wrap: break-word;
    }

    h1 {
        font-size: 1.4rem;
    }

    h2 {
        font-size: 1.2rem;
    }

    h3 {
        font-size: 1.1rem;
    }
}
</style>

