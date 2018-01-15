const collectionList = (data) => {
    return {
        template: `
            <div class="app-wrapper">
                <div class="collection-list">
                    <div v-for="item in list" class="collection-list__item" :key="item.id">
                        <div class="media-wrapper" v-if="item.data">
                            <div class="image" v-if="item.data.images">
                                <img v-bind:src="item.data.images | img" />
                            </div>
                        </div>
                        <div class="meta-info">
                            <h2>{{item.data.name}}</h2>
                            <p>{{item.agency}}</p>
                            <p v-if="item.genre">{{item.genre}}</p>
                            <p>popularity: {{item.data.popularity}}</p>
                            <p>followers: {{item.data.followers.total}}</p>
                            <p v-if="item.data.genres.length > 0">{{item.data.genres}}</p>
                        </div>
                    </div>
                </div>
            </div>
        `,
        el: "#app",
        data () {
            data = data.filter((item) => {
                let itemWithData = false;

                if (item.data) {
                    itemWithData = item;
                }

                return itemWithData;

            }).filter((item) => {

                if (item.data.name.toLowerCase() === item.name.toLowerCase()) {
                    return item;
                }

                return false;

            }).sort((first, next) => {
              const nameA = first.data.popularity; // ignore upper and lowercase
              const nameB = next.data.popularity; // ignore upper and lowercase

              if (nameA > nameB) {
                return -1;
              }
              if (nameA < nameB) {
                return 1;
              }

              // names must be equal
              return 0;
            });

            console.log(`${data.length} records`);

            return {
                items: data,
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