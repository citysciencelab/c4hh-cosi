<script>

export default {
    name: "TipTapEditorControls",
    props: {
        editor: {
            type: [Object, null],
            required: true
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
                aria-label="bold"
                class="btn btn-primary rounded-start-3"
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
    </div>
</template>

<style lang="scss" scoped>
    .btn.is-active {
        background-color: $dark-blue;
        color: $white;
    }
</style>
