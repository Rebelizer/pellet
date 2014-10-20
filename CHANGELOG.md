### 0.0.15 (2014-10-20)


#### Bug Fixes

* remove this code because we can do the same thing with PELLET_CONF_DIR ([4dc064d9](https://github.com/Rebelizer/pellet/commit/4dc064d960eaa79e0ea8a263ac03a8a5ad0fa473))


#### Features

* allow the environment to change pellet working directory and update aws start CM ([a5453539](https://github.com/Rebelizer/pellet/commit/a5453539ecf04b351374d4204c2a3980ae67965e))
* start work on the pellet.io site and try to integrate old style markup i.e. jque ([a8b828ce](https://github.com/Rebelizer/pellet/commit/a8b828ce7990bedfcfe920a5fa5dfc2825448672))


### 0.0.14 (2014-10-18)


#### Bug Fixes

* pellet manifest build and server to run in dev mode and not reference full path  ([677ba82b](https://github.com/Rebelizer/pellet/commit/677ba82bc7ba2047c5307d8f026539663b29d498))
* when installed pellet via npm -g we are missing npm module ([0ba55901](https://github.com/Rebelizer/pellet/commit/0ba5590117001bd5c446cf66a306ffdd9e1702f9))


### 0.0.13 (2014-10-18)


#### Bug Fixes

* update the package dependencies so npm install -g will run pellet with out crash ([d2e31aa0](https://github.com/Rebelizer/pellet/commit/d2e31aa0ce3e685e3425b07224a2b158e21d1363))


### 0.0.12 (2014-10-18)


#### Bug Fixes

* npm install to not crash because missing package ([011c224e](https://github.com/Rebelizer/pellet/commit/011c224ea8ed81d23577f8ff23b23df5ac824614))
* make sure setProp and set on isomorphic context remove undefined ([63b714ce](https://github.com/Rebelizer/pellet/commit/63b714ce21e58c524c7d7351578ebf4159534df8))
* error logging in pellets render fn (typeo wrong func name) ([e41747b3](https://github.com/Rebelizer/pellet/commit/e41747b30637aad8566026654c28a9a2cb96ea57))
* when loading state from server we should only do this once (for the initial rout ([27996465](https://github.com/Rebelizer/pellet/commit/2799646504414b881b6ee4fc0780e08cb68fe2df))
* the ctx was not getting onto the page ([a9ddca29](https://github.com/Rebelizer/pellet/commit/a9ddca2925dd6228db810926e58b0a0874935554))
* was not parsing the full url that included the query prams ([bceb2a5b](https://github.com/Rebelizer/pellet/commit/bceb2a5b25f02ab588123d91d6a85a3a2a72e42a))
* translation not loading because i18n bundle was returning the wrong reference ([5a876b22](https://github.com/Rebelizer/pellet/commit/5a876b22b0fd1bfb35403d8ec00456cf5530b9d1))
* the spelling on pellet boot message ([803cfde0](https://github.com/Rebelizer/pellet/commit/803cfde0988658fa6fe5034189ea4c9187736096))
* clean up duplicate css amd spelling errors ([8cec8904](https://github.com/Rebelizer/pellet/commit/8cec89048395dc028137b291fd822b846a055b7d))


#### Features

* add unit tests for render container ([9092111b](https://github.com/Rebelizer/pellet/commit/9092111bd81c5857c2b69f5f137baff3f2102629))
* add the 404 & 500 pages to our pellet create command ([d22f389d](https://github.com/Rebelizer/pellet/commit/d22f389d8552e0abb0ad0bc4ae8bcd26412eb8fa))
* add basic 404 & 500 pages to pellet middleware ([c3abfd70](https://github.com/Rebelizer/pellet/commit/c3abfd702524c6982c266e18565ebc96cbc11c01))
* as a dev I want html5 history and a way to control what a tags push state vs got ([4bf47fbc](https://github.com/Rebelizer/pellet/commit/4bf47fbc8d604331ead58638ef3adb718522bc07))
* refactor object merge fn to handle arrays, clone, ref code, delete & add unit te ([437f21e1](https://github.com/Rebelizer/pellet/commit/437f21e13b15e7414f583363a73ac16a357dce5d))
* add better deep merge support with unit tests ([5d32852b](https://github.com/Rebelizer/pellet/commit/5d32852b53b88982dc98a13f4fffdea4399f7572))
* as a dev I want the page render to have access to server side options (for local ([7d3fd16e](https://github.com/Rebelizer/pellet/commit/7d3fd16e352e6307af6e79e3ba73ff2e97dad17a))
* as a dev I want a modern css framework to build a site with ([e0851535](https://github.com/Rebelizer/pellet/commit/e085153585bd1a14e58def573d45e56f788eb328))
* as a dev I want to have assets share a common config file for all components ([a67be15c](https://github.com/Rebelizer/pellet/commit/a67be15cd365d6f4a5c80bc41171b0217fe48516))
* as a dev I want more control over webpack config ([9ea9a02b](https://github.com/Rebelizer/pellet/commit/9ea9a02b594c2642d1d745a544d2cf94fd38baa1))


### 0.0.10 (2014-10-08)


#### Bug Fixes

* get the internatiionalization scope working ([c759ab64](https://github.com/Rebelizer/pellet/commit/c759ab64115376ecb0e47908c31a6e3708ea7ed5))
* the translation stats and clean up the scripts ([13cb1826](https://github.com/Rebelizer/pellet/commit/13cb18264ca6da04659d3bf45ca072b55efb2861))
* client side render to include the context and locales ([e3f75b85](https://github.com/Rebelizer/pellet/commit/e3f75b85cec1801a6a838ecdb68233955de879ad))
* page template not working ([1b9e5656](https://github.com/Rebelizer/pellet/commit/1b9e5656b511d5a499e3b9809c58b8f794114d11))
* ref the wrong locale ([fdd1912e](https://github.com/Rebelizer/pellet/commit/fdd1912e813dc8c04600e02d1485283c20bfe292))


#### Features

* as a dev I want to get better error when rendering react components ([28cf448f](https://github.com/Rebelizer/pellet/commit/28cf448ffa58428670059d771395d562ebcf22e7))
* as a dev I want to define iso routes inline and have full req/res support ([e2d3ff64](https://github.com/Rebelizer/pellet/commit/e2d3ff64aae161f74fe3ea9040790a1e4d939e00))
* as a dev I want a way to customize the skeleton html template ([f7385e92](https://github.com/Rebelizer/pellet/commit/f7385e927e4ff11c805b065ad0ba3d83cbf6332a))
* as a dev I want control over if a file is included in just the server or client  ([46bf13bd](https://github.com/Rebelizer/pellet/commit/46bf13bd88fba7fbfe7721f457d78fceecc8dc08))


### 0.0.9 (2014-10-07)


#### Features

* as a dev I want pellet to create a project if "pellet init" ([0e398944](https://github.com/Rebelizer/pellet/commit/0e398944fff20663eec43711468064b166ae9a45))
* as a dev I need the translation file loaded into pellets runtime ([644a2554](https://github.com/Rebelizer/pellet/commit/644a2554a3ad22e15e8a38b43dee4ab41e543101))
* as a dev I need to embed translation file into my manifest file ([70a14183](https://github.com/Rebelizer/pellet/commit/70a1418380c1e144768c3e44093ada88a037f38d))
* as a dev I would like a demo site to show off pellet ([13d7fb49](https://github.com/Rebelizer/pellet/commit/13d7fb49f53ad058d471c3f230b2bbcbac40996b))


### 0.0.8 (2014-10-05)


#### Bug Fixes

* fixed webpack build bugs feat: as a dev I want to "pellet run --build" to only b ([d50bca18](https://github.com/Rebelizer/pellet.git/commit/d50bca18b17ce4800f8710111c31e1780a94b4d9))
* pass more informatoin on webpack errors ([f97206dd](https://github.com/Rebelizer/pellet.git/commit/f97206dd7249cebc7e51994047a0b6ccf089987a))
* stub global window object in node envirment ([352b323c](https://github.com/Rebelizer/pellet.git/commit/352b323c2af8e62eae6f42d93cd25c4f1b53ad20))


#### Features

* as a dev I want pellet to handle multiple manifest files ([67de7802](https://github.com/Rebelizer/pellet.git/commit/67de78024e2d5db39acc8e2180c5e1af5cc226ee))
* as dev I want to find a component by the name in the manifest chore: refactor to ([96f1a454](https://github.com/Rebelizer/pellet.git/commit/96f1a454a813c9bad08544c293efdc5697912d74))


### 0.0.4 (2014-10-02)


#### Bug Fixes

* github integration in gulp release task ([bd7e7f96](https://github.com/Rebelizer/pellet.git/commit/bd7e7f96c03a47e36448debe77b0a7617792576f))


### 0.0.3 (2014-10-02)


#### Bug Fixes

* gulp auto release tagging task ([47e005c0](https://github.com/Rebelizer/pellet.git/commit/47e005c0b186575b77dd6e53dfc71662cb5e5f32))
* auto tagging in gulp release task ([c40078f8](https://github.com/Rebelizer/pellet.git/commit/c40078f8be2432cc642abc76ca0a33700b4488f1))
* Update the change log ([7d42b277](https://github.com/Rebelizer/pellet.git/commit/7d42b2778b04624e4bad463cfde234e7f95d4b9e))


#### Features

* **CI:** add gulp task to build a release ([1a60bf15](https://github.com/Rebelizer/pellet.git/commit/1a60bf15aa9c824e8a97a8a7ded48968f9064421))


### 0.0.2 (2014-10-02)


#### Features

* add the project template to pellet ([de091a11](https://github.com/Rebelizer/pellet.git/commit/de091a11c95817419fdb2df170b4c4f905715112))

### 0.0.1 (2014-10-02)


#### Features

* Give birth to pellet ([84f3082](https://github.com/Rebelizer/pellet.git/commit/84f3082dc818ad93f5fba3bad1ce5187c615cd3b))

