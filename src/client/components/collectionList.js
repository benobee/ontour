import util from "../../util/util";
import templateHTML from "./collectionList.html";

const collectionList = (data) => {
    return {
        template: templateHTML,
        el: "#app",
        data () {
            return {
                items: data.slice(0),
                scrollHeight: 0,
                disableScroll: false,
                scrollBottom: false,
                isLoading: false,
                pagination: {
                    scrollBottom: false,
                    pageLimit: 20,
                    currentIndex: 0
                }
            };
        },
        computed: {
            list () {
                let array = this.items.slice(0);
                return this.paginate(array);
            },
            isScrolling () {
                let scrolling = false;

                if (this.scrollHeight < this.listTop) {
                    scrolling = true;
                }

                return scrolling;
            },
            appLoaded () {
                let className = "";

                if (this.lifecycle.appLoaded) {
                    className = "data-loaded";
                }

                return className;
            }
        },
        filters: {
            img (image) {
                if (image[ 0 ]) {
                    image = image[ 0 ].url.replace("https://i.scdn.co/image", "/images");
                }

                return image;
            },
            stripDiacritics (str) {
                return util.removeDiacritics(str);
            }
        },
        methods: {
            bindScrollEvents () {
                window.addEventListener("load", this.executeScrollFunctions);
                window.addEventListener("scroll", this.executeScrollFunctions);
            },
            paginate (array) {
                return array.splice(0, this.pagination.currentIndex + this.pagination.pageLimit);
            },
            cleanupScrollEvents () {
                window.removeEventListener("load", this.executeScrollFunctions);
                window.removeEventListener("scroll", this.executeScrollFunctions);
            },

            /**
             * Tests whether the collection list is at the bottom or not.
             *
             * @memberof collectionList
             * @name executeScrollFunctions
             * @private
             */

            executeScrollFunctions () {
                const grid = this.$el.querySelector(".collection-list");
                const height = window.innerHeight;
                const domRect = grid.getBoundingClientRect();
                const triggerAmount = height - domRect.bottom + 1000;
                const body = document.body.getBoundingClientRect();

                this.scrollHeight = body.top;
                this.appendItems(triggerAmount);
            },
            appendItems (triggerAmount) {
                if (triggerAmount > 0 && !this.pagination.scrollBottom) {
                    this.pagination.scrollBottom = true;
                    const current = this.pagination.currentIndex;

                    this.pagination.currentIndex = current + this.pagination.pageLimit + 1;
                    this.pagination.scrollBottom = false;
                }
            }
        },
        mounted () {
            setTimeout(() => {
                this.bindScrollEvents();
            }, 600);
        }
    };
};

export default collectionList;