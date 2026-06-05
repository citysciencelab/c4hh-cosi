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
        class="btn-toolbar mb-3"
        role="toolbar"
        aria-label="Toolbar with button groups"
    >
        <div
            class="btn-group me-2"
            role="group"
            aria-label="First group"
        >
            <button
                class="btn btn-primary"
                aria-label="bold"
                :disabled="!editor?.can().chain().focus().toggleBold().run()"
                :class="{ 'is-active': editor?.isActive('bold') }"
                @click="editor?.chain().focus().toggleBold().run()"
            >
                <i
                    class="bi bi-type-bold"
                    role="img"
                />
            </button>
            <button
                class="btn btn-primary"
                aria-label="italic"
                :disabled="!editor?.can().chain().focus().toggleItalic().run()"
                :class="{ 'is-active': editor?.isActive('italic') }"
                @click="editor?.chain().focus().toggleItalic().run()"
            >
                <i
                    class="bi bi-type-italic"
                    role="img"
                />
            </button>
        </div>
        <div
            class="btn-group me-2"
            role="group"
            aria-label="Second group"
        >
            <button
                class="btn btn-primary"
                aria-label="heading 1"
                :class="{ 'is-active': editor?.isActive('heading', { level: 1 }) }"
                @click="editor?.chain().focus().toggleHeading({ level: 1 }).run()"
            >
                <i
                    class="bi bi-type-h1"
                    role="img"
                />
            </button>
            <button
                class="btn btn-primary"
                aria-label="heading 2"
                :class="{ 'is-active': editor?.isActive('heading', { level: 2 }) }"
                @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
            >
                <i
                    class="bi bi-type-h2"
                    role="img"
                />
            </button>
            <button
                class="btn btn-primary"
                :class="{ 'is-active': editor?.isActive('heading', { level: 3 }) }"
                aria-label="heading 3"
                @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()"
            >
                <i
                    class="bi bi-type-h3"
                    role="img"
                />
            </button>
            <button
                class="btn btn-primary"
                aria-label="bullet list"
                :class="{ 'is-active': editor?.isActive('bulletList') }"
                @click="editor?.chain().focus().toggleBulletList().run()"
            >
                <i
                    class="bi bi-list-ul"
                    role="img"
                />
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
