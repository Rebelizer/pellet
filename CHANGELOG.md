### 0.0.23 (2014-11-22)


#### Bug Fixes

* wrong require module name "intl" check out webpack config ([72d49d5f](https://github.com/Rebelizer/pellet/commit/72d49d5f87dabe04e90c791db24ed2487554d669))
* html5 history state is serialized so can not pass route fn ([b6c51463](https://github.com/Rebelizer/pellet/commit/b6c51463b46037beedeeec8874de49d4f4edaf7a))


### 0.0.22 (2014-11-20)


#### Bug Fixes

* Parsing config from string to JSON for client side ([ca42f4b8](https://github.com/Rebelizer/pellet/commit/ca42f4b85e20dd4178549c7ce260e809af242c47))
* href should be optional and not crash is missing ([3eda85af](https://github.com/Rebelizer/pellet/commit/3eda85af1bcf69108fe62accc76320a3029dcb0f))
* memory leak in coordinator on unmounted ([5ffc2f41](https://github.com/Rebelizer/pellet/commit/5ffc2f41e7cf97c72561fd6a735613b74829edaf))
* update the pellet template (out of date and crashes on create project) ([3db31791](https://github.com/Rebelizer/pellet/commit/3db3179127bfcd920e78fe8db1d29d9d5c1093aa))


#### Features

* as a dev I want a easy way to register composite event stream to coordinators ([aecfbd05](https://github.com/Rebelizer/pellet/commit/aecfbd05610201c328b3d464681db29dd69830ae))
* as a dev I want jadex to support react 0.12 createElement ([3a71031d](https://github.com/Rebelizer/pellet/commit/3a71031d3e94c96cb5dfbb3a4b7d2b22976765ea))


### 0.0.21 (2014-11-09)


#### Bug Fixes

* release script breaks if no git files to stash ([280429bb](https://github.com/Rebelizer/pellet/commit/280429bb83c71610972115e4c4b304fef195caac))


### 0.0.20 (2014-11-09)


### 0.0.19 (2014-11-09)


#### Bug Fixes

* change the internationalization component key props to index (because key is res ([9aa3fdb8](https://github.com/Rebelizer/pellet/commit/9aa3fdb83f0cf8a6ec166c47add1cad1e05e10a5))


### 0.0.18 (2014-11-09)


#### Bug Fixes

* merging {foo:null} was not overriding foo with null but with {0:null} this is wr ([d5c99d84](https://github.com/Rebelizer/pellet/commit/d5c99d84462e0e7b27aaa145b7d6220e0336ee98))
* load order for (code/coordiantor) because pellet.js is required to be last becau ([cdc62d1e](https://github.com/Rebelizer/pellet/commit/cdc62d1e2ed5591d95cd1846e4944344491a0ef5))
* bugs in react 0.12 upgrade ([aa64c07b](https://github.com/Rebelizer/pellet/commit/aa64c07b7ae08e340c4e469fb59d67b8071dc6a0))
* gulp release task someone gets no response from github ([52f909ef](https://github.com/Rebelizer/pellet/commit/52f909ef844fcc5186b7a7960aa7ddad5b8e1d47))
* unit test breaking because file rename ([ad2f9c93](https://github.com/Rebelizer/pellet/commit/ad2f9c93bfb4d3f8275c675a1c7b78a24ac19a35))


#### Features

* as a dev I want a easy way to add child component to isomorphic route ([e53758b5](https://github.com/Rebelizer/pellet/commit/e53758b5304a5085fed61c0ed47d0bd3f41b6f31))
* as a dev I want better way to layout ([b7937cb4](https://github.com/Rebelizer/pellet/commit/b7937cb4b62a628fde3ea6f977e69b54ab445f27))
* as a dev I want a new system to make messaging between components easier ([b9675410](https://github.com/Rebelizer/pellet/commit/b96754109c694a153f18c43b93f9ea1433a95517))
* as a dev I want international number and data formatting ([9a01b5b9](https://github.com/Rebelizer/pellet/commit/9a01b5b9c6f68263b466171f7511d882bd5d7b12))
* as a dev I want to pass options to my registered coordinators ([58831fd1](https://github.com/Rebelizer/pellet/commit/58831fd1ef6c1704f6a937bce73b162f252f5eb0))
* add support for coordinator to tree link shared contexts i.e. have child coordin ([e752be7d](https://github.com/Rebelizer/pellet/commit/e752be7d4a24a5b3746442a6b091d77c50b6e84a))
* as a dev I want to have unit tests around core base coordinator logic ([bfcda462](https://github.com/Rebelizer/pellet/commit/bfcda462047dc6d09c67978c31ef6f9e2dd20651))
* as a dev I want to have some basic unit tests around observables ([191e1be7](https://github.com/Rebelizer/pellet/commit/191e1be7d888959cb7724d7835e3368b63b1ceec))
* as a dev I want observables to track the owner/sender of the events to help filt ([99159073](https://github.com/Rebelizer/pellet/commit/99159073d257953e967144a4d2ea78b2e80b2eb9))
* as a dev I want a cleaner api around the isomorphic route ([71750225](https://github.com/Rebelizer/pellet/commit/71750225729e24ce783b12967fa783f11fa1eef7))
* as a dev I want to setInitialState in the preflight to the get route data ([b4b26744](https://github.com/Rebelizer/pellet/commit/b4b267440e8b5680261d881ed874d429ac2ce1b5))
* as a dev I want to add coordinators and raw code file into the manifest ([d9c201c5](https://github.com/Rebelizer/pellet/commit/d9c201c53529130bd46d804c4b175417b8c19022))
* as dev I want jade includes to be watched ([e86d3a0b](https://github.com/Rebelizer/pellet/commit/e86d3a0beb71a319d9d0676f0b19d1928ea8d7ed))
* as a dev I want !{this....} to get passed at react elements ([be438251](https://github.com/Rebelizer/pellet/commit/be4382518587cb2f82a146864b6ab274d2216b64))
* as a dev I want jade support to auto load comp and have better lang syntax ([e5fd578d](https://github.com/Rebelizer/pellet/commit/e5fd578d8ce36d21fa4684cfe10f469fd4b0e9a0))
* upgrade to react 0.12 and fix breaking changes ([3c477f29](https://github.com/Rebelizer/pellet/commit/3c477f2905c506d764c49d2ef68db6659a386a83))


### 0.0.17 (2014-10-30)


#### Bug Fixes

* Display error message with correct stack trace ([fa35d878](https://github.com/Rebelizer/pellet/commit/fa35d878c441e558ba27731e0d692f7f7be388c3))
* update json5 to be included in package.json ([56f604fe](https://github.com/Rebelizer/pellet/commit/56f604fe5ca102cd1f6e5a67975f944faebda901))
* initialize new coordinators ([d2a209b9](https://github.com/Rebelizer/pellet/commit/d2a209b9a891103713d97c0884ac67ee741c1bb9))
* can not defined utils because some fn need pellet scope, so revert until I have  ([f80cdbbf](https://github.com/Rebelizer/pellet/commit/f80cdbbf1cc31f719291861b83fa3da8c87620e8))


#### Features

* as a dev I want support of isomorphic FRP and a more flexible store ([4b6272bb](https://github.com/Rebelizer/pellet/commit/4b6272bb42c8bdc9fd02e6b77877cb97857beb35))
* as a dev I want to set head tags like meta tags, titles, rel canonical ([fdd685a5](https://github.com/Rebelizer/pellet/commit/fdd685a5f5b9fce8c0564428560f9acfbea92fa9))
* as a dev I want comments in my config files ([757f277d](https://github.com/Rebelizer/pellet/commit/757f277d7be84679c4a54d4ba2f469cd2eeb61f3))
* as a dev I want pellet template accurate and to support jade output options ([fbe1cbfe](https://github.com/Rebelizer/pellet/commit/fbe1cbfebbd2576866d0b40bc908761f9a2a81be))
* as a dev I want to use jade and not jsx for my template logic ([99652142](https://github.com/Rebelizer/pellet/commit/99652142c85594be0ba215db06fa184261a22102))
* as a dev I want pellet internationalization to be accessible anywhere ([e36ac96a](https://github.com/Rebelizer/pellet/commit/e36ac96a685c3b2e5caf674df9603b504783691b))


### 0.0.16 (2014-10-21)


#### Features

* as a dev I want to have full control over what routing component/logic is loaded ([55264479](https://github.com/Rebelizer/pellet/commit/55264479d256e60cdbc548107076c5349b1eadb1))


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

