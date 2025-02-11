<script>
export default {
    name: "FloodRiskManagementCard",
    props: {
        icon: {
            type: [Boolean, String],
            required: false,
            default: false
        },
        title: {
            type: String,
            required: true
        },
        text: {
            type: [Boolean, String],
            required: false,
            default: false
        },
        selectedCard: {
            type: String,
            required: false,
            default: ""
        }
    },
    emits: ["setSelected"]
};
</script>
<template>
    <div
        class="card p-3 d-flex position-relative"
        :isActive="selectedCard === title"
    >
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
                    @click="$emit('setSelected', title)"
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
@import "~variables";
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

