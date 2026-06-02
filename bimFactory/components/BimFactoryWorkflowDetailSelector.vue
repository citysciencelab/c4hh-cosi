<script>
import SliderItem from "../../../src/shared/modules/slider/components/SliderItem.vue";

export default {
    components: {
        SliderItem
    },
    props: {
        config: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            selectedValue: this.config.component.defaultValue
        };
    },
    methods: {
        updateSelectedValue (value) {
            this.selectedValue = value;

            this.$store.commit("Modules/BimFactory/clearComponentErrors", {
                containerId: this.config.containerId,
                machineName: this.config.component.machineName,
                emptyError: true
            });

            this.$store.commit("Modules/BimFactory/updateWorkflowFormData", {
                containerId: this.config.containerId,
                machineName: this.config.component.machineName,
                value: value
            });
        }
    }
};
</script>

<template>
    <div class="BimFactoryWorkflowDetailSelector">
        <div class="items">
            <button
                v-for="(detail, idx) in config.component.details"
                :key="idx"
                class="item"
                type="button"
                @click="updateSelectedValue(detail.value)"
            >
                <img
                    :src="detail.imageSource"
                    :alt="detail.title"
                    :title="detail.title"
                    class="itemImage"
                >

                <div class="imageCaption">
                    {{ detail.title }}
                </div>
            </button>
        </div>

        <div class="sliderRow">
            <div class="sliderSpacer" />

            <SliderItem
                :id="`${config.component.type}_${config.component.machineName}`"
                :aria="$t('common:modules.aria.sliderAria') + 'den Detailierungsgrad'"
                :value="selectedValue"
                :min="1"
                :max="config.component.details.length"
                :step="1"
                :interaction="$event => updateSelectedValue(Number($event.target.value))"
                :show-markers="true"
            />

            <div class="sliderSpacer" />
        </div>
    </div>
</template>

<style lang="scss">
#bim-factory {
    div.BimFactoryWorkflowDetailSelector {
        div.items {
            display: flex;
            flex-direction: row;
            width: 100%;
        }

        button.item {
            box-shadow: 0 0.0625rem 0.3125rem rgba(0, 0, 0, .2),
                        0 0.125rem 0.125rem rgba(0, 0, 0, .14),
                        0 0.1875rem 0.0625rem -0.125rem rgba(0, 0, 0, .12);
            border-radius: 0.25rem;
            margin: 0.25rem;
            background: white;
            border: none;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;

            img.itemImage {
                width: 100%;
                height: auto;
                object-fit: contain;
                display: block;
            }

            div.imageCaption {
                font-size: 1rem;
                text-align: center;
            }
        }

        div.sliderRow {
            display: flex;
            margin-top: 1rem;

            div.sliderSpacer {
                width: 14%;
            }
        }
    }
}
</style>
