<script>
export default {
    name: "CustomCard",
    props: {
        closeable: {
            type: Boolean,
            default: true,
            required: false
        },
        icon: {
            type: String,
            default: null,
            required: false
        }
    },
    emits: ["click:close"]
};
</script>

<template lang="html">
    <div class="card shadow">
        <div class="card-body p-2 d-flex flex-row align-center">
            <div
                v-if="icon"
                class="p-1 fs-3"
            >
                <i :class="icon" />
            </div>
            <div class="ps-4 py-1 flex-grow-1">
                <slot />
            </div>
            <button
                v-if="closeable"
                type="button"
                class="btn-close align-self-start"
                aria-label="Close"
                @click="$emit('click:close')"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
    @import "../assets/style.scss";
</style>
