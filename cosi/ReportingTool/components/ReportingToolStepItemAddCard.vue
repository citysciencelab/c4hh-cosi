<script>
export default {
    name: "ReportingToolStepItemAddCard",
    props: {
        icon: {
            type: String,
            default: "bi bi-plus-circle",
            required: false
        },
        text: {
            type: String,
            default: "Inhalte hinzufügen",
            required: false
        }
    },
    emits: ["click"]
};
</script>

<template>
    <div class="d-grid">
        <button
            class="btn btn-light p-4 rounded-4 d-flex flex-row align-items-center justify-content-center"
            type="button"
            @click="$emit('click')"
        >
            <i
                :class="icon"
                class="fs-5 me-3"
            />
            {{ text }}
        </button>
    </div>
</template>

<style lang="scss" scoped>
    button {
        border: 2px dashed $secondary;
        color: $secondary;
        &:hover {
            background-color: $light_blue;
            border: 2px dashed $secondary;
            color: $secondary;
        }
    }
</style>
