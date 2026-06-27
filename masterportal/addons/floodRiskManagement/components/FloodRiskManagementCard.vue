<script>
import SpinnerItem from "../../../src/shared/modules/spinner/components/SpinnerItem.vue";

export default {
    name: "FloodRiskManagementCard",
    components: {
        SpinnerItem
    },
    props: {
        icon: {
            type: [Boolean, String],
            required: false,
            default: false
        },
        selectedCard: {
            type: String,
            required: false,
            default: ""
        },
        title: {
            type: String,
            required: true
        },
        text: {
            type: [Boolean, String],
            required: false,
            default: false
        }
    },
    emits: ["setSelected"],
    data () {
        return {
            showLoadSpinner: false
        };
    },
    watch: {
        /**
         * Watcher for setting the loading spinner.
         * @returns {void}
         */
        selectedCard () {
            this.showLoadSpinner = true;

            setTimeout(() => {
                this.showLoadSpinner = false;
            }, 1000);
        }
    }
};
</script>
<template>
    <div
        class="card p-3 d-flex position-relative"
        :isActive="selectedCard === title"
    >
        <div
            v-if="showLoadSpinner && selectedCard === title"
            class="loading"
        >
            <SpinnerItem />
        </div>
        <div class="card-body align-middle">
            <div class="row">
                <i
                    v-if="icon"
                    class="text-center me-1"
                    :class="`${icon}`"
                />
                <a
                    href="#"
                    class="stretched-link text-reset"
                    @click.prevent="$emit('setSelected', title)"
                >
                    <h5
                        v-if="title"
                        class="card-title text-center"
                    >
                        {{ title }}
                    </h5>
                </a>
            </div>
            <p
                v-if="text"
                class="card-text text-center"
            >
                {{ text }}
            </p>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.card {
    width: 19rem;
    border-radius: 10px;
    box-shadow: rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgb(209, 213, 219) 0px 0px 0px 1px inset;
    &:hover {
        background-color: $primary;
        cursor: pointer;
        .card-title, .card-text, i {
            color: $dark_blue;
        }
    }
    &:active {
        background-color: $dark_blue;
        .card-title, .card-text, i {
                color: white;
            }
    }

    .loading {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.3);
        text-align: center;
        align-content: center;
    }

    .title-button {
        box-shadow: none;
        text-align: left;
        &:enabled {
            border: none;
            outline: 0;
        }
    }
}
   [isActive=true] {
        background-color: $secondary;
        .card-title, .card-text, i {
                color: white;
            }
   }
</style>

