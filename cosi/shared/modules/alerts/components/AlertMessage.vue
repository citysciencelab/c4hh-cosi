<script>

export default {
    name: "AlertMessage",
    props: {
        closeable: {
            type: Boolean,
            default: false
        },
        text: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: false,
            default: undefined
        },
        type: {
            type: String,
            required: true,
            /**
             * Checks whether the type is one of the allowed values.
             * @param {String} type - The type to validate.
             * @return {boolean} True if the type is valid, false otherwise.
             */
            validator (type) {
                return ["error", "info", "noData", "success", "warning"].includes(type);
            }
        }
    },
    emits: ["closed"],
    data () {
        return {
            colorMapping: {
                error: "alert-danger",
                info: "alert-info",
                noData: "alert-light",
                success: "alert-success",
                warning: "alert-warning"
            },
            iconMapping: {
                error: "bi-x-circle-fill",
                info: "bi-info-circle-fill",
                noData: "bi-slash-circle-fill",
                success: "bi-check-circle-fill",
                warning: "bi-exclamation-triangle-fill"
            },
            titleMapping: {
                error: "Fehler",
                info: "Hinweis",
                noData: "Keine Daten",
                success: "Bestätigung",
                warning: "Warnung"
            }
        };
    }
};
</script>

<template lang="html">
    <div
        class="alert-message"
    >
        <div
            class="alert border-2 d-flex align-items-center"
            :class="colorMapping[type]"
            role="alert"
        >
            <i
                class="bi ms-2 me-5 fs-4"
                :class="iconMapping[type]"
            />
            <div class="me-4">
                <span class=" title">{{ title || titleMapping[type] }}</span>
                <br>
                <span>{{ text }}</span>
            </div>
            <button
                v-if="closeable"
                type="button"
                class="btn-close align-self-start"
                data-bs-dismiss="alert"
                aria-label="Close"
                @click="$emit('closed')"
            />
        </div>
    </div>
</template>

<style lang="scss">
.alert-message {
    .title {
        font-family: "MasterPortalFont Bold";
        font-size: 1.1rem;
    }
    .alert-info {
        background-color: rgba($light-blue, 0.7);
        border-color: $secondary;
        color: $secondary;
    }
    .alert-light {
        color: $dark_grey;
    }
}

</style>
