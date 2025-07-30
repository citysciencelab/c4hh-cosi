<script>
export default {
    name: "DataCardPaginator",
    props: {
        paginatorData: {
            type: [Array, String],
            required: false,
            default: () => ["eins", "zwei", "drei"]
        },
        startIndex: {
            type: Number,
            required: false,
            default: 0
        }
    },
    data: function () {
        return {
            currentIndex: this.startIndex
        };
    },
    methods: {
        /**
         * switches to previous page or turns over if it is first one
         * emits event to parent to change the content based on the selected page
         * @returns {void}
         */
        previous () {
            this.currentIndex === 0 ? this.currentIndex = this.paginatorData.length - 1 : this.currentIndex--;

            this.$emit("pager", this.currentIndex);
        },
        /**
         * switches to the next page or wraps around if it's the last one.
         * emits an event to the parent to change the content based on the selected page.
         * @returns {void}
         */
        next () {
            this.currentIndex < this.paginatorData.length - 1 ? this.currentIndex++ : this.currentIndex = 0;

            this.$emit("pager", this.currentIndex);
        }
    }
};
</script>

<template>
    <div
        id="paginator"
        class="d-flex w-100 justify-content-center align-items-center"
    >
        <nav aria-label="navigation">
            <ul class="pagination">
                <li
                    class="page-item previous-paginator-button"
                    role="button"
                    tabindex="0"
                    @click.prevent="previous"
                    @keydown="previous"
                >
                    <a
                        class="page-link"
                        href="#"
                        aria-label="Previous"
                    >
                        <span aria-hidden="true">&laquo;</span>
                    </a>
                </li>
                <li class="page-item paginator-index">
                    {{ paginatorData[currentIndex] }}
                </li>
                <li
                    class="page-item next-paginator-button"
                    role="button"
                    tabindex="0"
                    @click.prevent="next"
                    @keydown="next"
                >
                    <a
                        class="page-link"
                        href="#"
                        aria-label="Next"
                    >
                        <span aria-hidden="true">&raquo;</span>
                    </a>
                </li>
            </ul>
        </nav>
    </div>
</template>

<style scoped>
.pagination {
    padding:0;
    margin:0;
}
.paginator-index {
    margin: 0 0.4rem;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
