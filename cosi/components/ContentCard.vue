<script>
export default {
    name: "ContentCard",
    props: {
        id: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: false,
            default: undefined
        },
        subtitle: {
            type: String,
            required: false,
            default: undefined
        },
        closeIcon: {
            type: String,
            required: false,
            default: "bi bi-x"
        },
        closeInteraction: {
            type: Function,
            required: false,
            default: () => {
                return true;
            }
        }
    }
};
</script>

<template>
    <div
        class="card rounded shadow"
    >
        <div class="d-flex align-items-center ms-4 me-2 mt-2">
            <div class="me-auto">
                <slot name="header" />
            </div>
            <button
                class="close-button fs-4"
                @click="closeInteraction"
                @keydown.enter="closeInteraction"
            >
                <i
                    class="close"
                    :class="closeIcon"
                />
            </button>
        </div>
        <div class="card-body">
            <h5
                v-if="title !== undefined"
                class="card-title"
            >
                {{ title }}
            </h5>
            <h6
                v-if="subtitle !== undefined"
                class="card-subtitle mb-2 text-muted"
            >
                {{ subtitle }}
            </h6>
            <p class="card-text">
                <slot name="body" />
            </p>
        </div>
    </div>
</template>

<style lang="scss" scoped>

    .close-button i {
        color: blue;
    }

</style>
