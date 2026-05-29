<script>
export default {
    name: "AddCardButton",
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
        },
        descr: {
            type: String,
            default: "",
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
            <div
                v-if="descr"
                class="d-flex flex-column align-items-center text-center"
            >
                <div class="d-flex align-items-center">
                    <i
                        :class="icon"
                        class="fs-5 me-2"
                    />
                    <span class="fw-bold">{{ text }}</span>
                </div>
                <span class="small mt-1">{{ descr }}</span>
            </div>
            <template v-else>
                <i
                    :class="icon"
                    class="fs-5 me-3"
                />
                {{ text }}
            </template>
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
