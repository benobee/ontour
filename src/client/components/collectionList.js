import util from "../../util/util";
import templateHTML from "./collectionList.html";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

socket.on("connect", onConnect);

const onConnect = () => {
  console.log(`connect ${ socket.id}`);
};

const collectionList = (data) => {
    return {
        template: templateHTML,
        el: "#app",
        data () {
            console.log(`${data.length} records`);
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
                /* this is the main rendered list outputted to
                the DOM target area */

                //clone the array
                let array = this.items.slice(0);

                //paginate the array
                array = this.paginate(array);

                return array;
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
                //limit the active items list based on page index to allow for
                //infinite scroll and append
                array = array.splice(0, this.pagination.currentIndex + this.pagination.pageLimit);

                return array;
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

                //show next page of pagination list
                this.appendItems(triggerAmount);
            },
            appendItems (triggerAmount) {
                //when the page is scrolled to the bottom of the current items
                //the next set or page of items will be auto appened to the bottom
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