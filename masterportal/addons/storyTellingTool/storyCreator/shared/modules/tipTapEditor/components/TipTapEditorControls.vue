<script>
import IconButton from "@shared/modules/buttons/components/IconButton.vue";

export default {
    name: "TipTapEditorControls",
    components: {
        IconButton
    },
    props: {
        editor: {
            type: [Object, null],
            required: true
        }
    },
    data () {
        return {
            showLinkInput: false,
            linkUrl: ""
        };
    },
    methods: {
        openLinkInput () {
            this.linkUrl = this.editor?.getAttributes("link").href ?? "";
            this.showLinkInput = true;
            this.$nextTick(() => this.$refs.linkInput?.focus());
        },
        confirmLink () {
            if (this.linkUrl === "") {
                this.editor?.chain().focus().extendMarkRange("link").unsetLink().run();
            }
            else {
                this.editor?.chain().focus().extendMarkRange("link").setLink({href: this.linkUrl}).run();
            }
            this.showLinkInput = false;
            this.linkUrl = "";
        },
        cancelLink () {
            this.showLinkInput = false;
            this.linkUrl = "";
        }
    }
};

</script>

<template>
    <div
        class="btn-toolbar"
        role="toolbar"
        aria-label="Toolbar with button groups"
    >
        <div
            class="btn-group me-2"
            role="group"
            aria-label="First group"
        >
            <button
                aria-label="normal text"
                class="btn btn-primary rounded-start-3"
                :class="{
                    'is-active': editor?.isActive('paragraph')
                        && !editor?.isActive('heading')
                        && !editor?.isActive('bulletList')
                        && !editor?.isActive('bold')
                        && !editor?.isActive('italic')
                }"
                @click="editor?.chain().focus().setParagraph().unsetAllMarks().run()"
            >
                <strong>T</strong>
            </button>
            <button
                aria-label="bold"
                class="btn btn-primary"
                :class="{ 'is-active': editor?.isActive('bold') }"
                :disabled="!editor?.can().chain().focus().toggleBold().run()"
                @click="editor?.chain().focus().toggleBold().run()"
            >
                <strong>F</strong>
            </button>
            <button
                aria-label="italic"
                class="btn btn-primary rounded-end-3"
                :class="{ 'is-active': editor?.isActive('italic') }"
                :disabled="!editor?.can().chain().focus().toggleItalic().run()"
                @click="editor?.chain().focus().toggleItalic().run()"
            >
                <strong><em>K</em></strong>
            </button>
        </div>
        <div
            class="btn-group me-2"
            role="group"
            aria-label="Second group"
        >
            <button
                aria-label="heading 1"
                class="btn btn-primary rounded-start-3"
                :class="{ 'is-active': editor?.isActive('heading', { level: 1 }) }"
                @click="editor?.chain().focus().toggleHeading({ level: 1 }).run()"
            >
                <strong>H1</strong>
            </button>
            <button
                aria-label="heading 2"
                class="btn btn-primary"
                :class="{ 'is-active': editor?.isActive('heading', { level: 2 }) }"
                @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
            >
                <strong>H2</strong>
            </button>
            <button
                aria-label="heading 3"
                class="btn btn-primary"
                :class="{ 'is-active': editor?.isActive('heading', { level: 3 }) }"
                @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()"
            >
                <strong>H3</strong>
            </button>
            <button
                aria-label="bullet list"
                class="btn btn-primary rounded-end-3"
                :class="{ 'is-active': editor?.isActive('bulletList') }"
                @click="editor?.chain().focus().toggleBulletList().run()"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    class="bi bi-list-ul"
                    viewBox="0 0 16 16"
                >
                    <path
                        fill-rule="evenodd"
                        d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2"
                    />
                </svg>
            </button>
        </div>
        <div
            class="btn-group me-2"
            role="group"
            aria-label="Link group"
        >
            <button
                :aria-label="editor?.isActive('link') ? 'remove link' : 'set link'"
                class="btn btn-primary rounded-3"
                :class="{ 'is-active': editor?.isActive('link') }"
                @click="openLinkInput"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    class="bi bi-link-45deg"
                    viewBox="0 0 16 16"
                >
                    <path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1 1 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4 4 0 0 1-.128-1.287z" />
                    <path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243z" />
                </svg>
            </button>
        </div>
        <div
            v-if="showLinkInput"
            class="link-input-group d-flex align-items-center gap-1 mt-2"
        >
            <input
                ref="linkInput"
                v-model="linkUrl"
                type="url"
                class="form-control form-control-sm"
                placeholder="https://"
                @keyup.enter="confirmLink"
                @keyup.esc="cancelLink"
            >
            <IconButton
                icon="bi bi-check-lg"
                :aria="$t('additional:modules.storyCreator.buttons.confirm')"
                :class-array="['btn-secondary']"
                @click="confirmLink"
            />
            <IconButton
                icon="bi bi-x-lg"
                :aria="$t('additional:modules.storyCreator.buttons.abort')"
                :class-array="['btn-primary']"
                @click="cancelLink"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .btn.is-active {
        background-color: $dark-blue;
        color: $white;
    }
</style>
