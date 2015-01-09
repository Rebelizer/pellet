### 0.0.38 (2015-01-09)


#### Features

* as a dev I want to sample process into and send it to statsd ([a71192e5](https://github.com/Rebelizer/pellet/commit/a71192e54d55e6c3b3a1b18b5bc620da67893836))
* as a dev I want the lates stylus-loader package ([e115df9b](https://github.com/Rebelizer/pellet/commit/e115df9b48dd0a2b3fe0ca60fc3ca2f1f39b79df))


### 0.0.37 (2015-01-08)


#### Features

* as a dev I want to have access to the locales info in pipeline and have a isomor ([419eccdd](https://github.com/Rebelizer/pellet/commit/419eccdde55182baa6f97ae9c190db24f0a880b1))
* as a dev I want to excluded items from the manifest by flag not deleting the def ([09d112ba](https://github.com/Rebelizer/pellet/commit/09d112bad0d1519cb5b4cb6d1c3351dc8b71f054))


### 0.0.36 (2015-01-08)


#### Bug Fixes

* airbag bug on pellet create ([2d9ed0bf](https://github.com/Rebelizer/pellet/commit/2d9ed0bf8e495e66bd4fbb1055a285cc39168c89))
* as a dev I want translation error better formatted ([285b75bb](https://github.com/Rebelizer/pellet/commit/285b75bb482822cebf26741a5467f63a9bed9d6f))


#### Features

* as a dev I want to use my intl locale-data (so I can fix intl data format bugs e ([6a2ee137](https://github.com/Rebelizer/pellet/commit/6a2ee137b0871ec6473bc67560abc38831aaebb2))
* as a dev I want better error handling around translations ([16e6c7ac](https://github.com/Rebelizer/pellet/commit/16e6c7aceaf504805cd2490597e46ebc6fca85ed))
* add keywords for package.json to help people file us ([c7345630](https://github.com/Rebelizer/pellet/commit/c7345630097dae39712b46220397e42cef41fe0c))


### 0.0.35 (2014-12-28)


#### Bug Fixes

* need to handle both cases (if we created a child isolator or using parent) ([3105155f](https://github.com/Rebelizer/pellet/commit/3105155fa01881900a4c742c3b5f9003f5039f7e))
* as a dev I want isolatedConfig in the browser to maintain between routes ([63e3effa](https://github.com/Rebelizer/pellet/commit/63e3effa098cd9e49bf9fabe3c919106b3c61514))
* addToHead should support meta tags with properties ([db7f89b3](https://github.com/Rebelizer/pellet/commit/db7f89b354378cb900298cff352fab6b1fd98302))


#### Features

* as a dev I want user-agian to be parsed and passed to the component for mobile r ([2eefdd96](https://github.com/Rebelizer/pellet/commit/2eefdd96844332517955ca57911c71360ce915fa))
* as a dev I want property based events on my isolator ([46e2ad92](https://github.com/Rebelizer/pellet/commit/46e2ad92d971557f25646ad6c7b3fb750b7c52bf))
* as a dev i want to add a meta tag with a property attr to the head ([e17a5ffc](https://github.com/Rebelizer/pellet/commit/e17a5ffc3e69924ab57cd252003b384444b3d365))
* as a dev I need pellet.cookie in the browser ([f3e76fd4](https://github.com/Rebelizer/pellet/commit/f3e76fd4a6b44ba2b235028ca8fa6689004fd873))
* as a dev I want touch events ([b9b8f937](https://github.com/Rebelizer/pellet/commit/b9b8f9370a3e2c819e988b4ff081a2881a92012f))
* as a dev I want a the polyfill to have a hash to bust cdn caching ([caefc638](https://github.com/Rebelizer/pellet/commit/caefc638fdc3a39f6714faaa62f34845eea08109))


### 0.0.31 (2014-12-14)


#### Bug Fixes

* the polyfill server ([1529a9b1](https://github.com/Rebelizer/pellet/commit/1529a9b1903005447705d934513a0f0714497f0c))


### 0.0.30 (2014-12-11)


#### Bug Fixes

* bad default config logic we need to test using get not a set ([2889e227](https://github.com/Rebelizer/pellet/commit/2889e227b02dec9ee3d9774054bf843833efa24b))
* using the wrong respose need to use routeContext.respose ([1079eede](https://github.com/Rebelizer/pellet/commit/1079eedeb1467c0af723c07d1ddafe77c1ce73ae))
* make sure the polyfillPath is used in the route not just in the skeleton ([97cddda3](https://github.com/Rebelizer/pellet/commit/97cddda3f92326409327b5189f16ae09d1d82b46))
* when inlcuding translations (locale data) the path was wrong case ([4f1d1081](https://github.com/Rebelizer/pellet/commit/4f1d108115ca6f1a62041792d25a90804dd13c35))
* bad/old template examples ([705302bd](https://github.com/Rebelizer/pellet/commit/705302bd3931b459f76eb0107f5497b264f51dbf))


#### Features

* as a dev I want better plumbing for locales so server renders can pass isolated  ([0f245d24](https://github.com/Rebelizer/pellet/commit/0f245d24856d39583c5a074fb210fa4e700e964c))
* as a dev I want to read/write headers via isomorphic http interface ([c0980f3a](https://github.com/Rebelizer/pellet/commit/c0980f3a60bacb77497675b8816c013c042f051b))
* as a dev I want stats on http the number of 404 and 500 responses ([c5f32597](https://github.com/Rebelizer/pellet/commit/c5f32597d58fdb892d397584a093aff98cc104fb))
* as a dev I want the jsMountPoint to be public in the isomorphic broswer environm ([e6e5f7ed](https://github.com/Rebelizer/pellet/commit/e6e5f7ed9bfeaace9b59a5132faa7ff94d395705))
* as a dev I want to use nodejs api directly unless we are using expressjs ([6d8c4b0f](https://github.com/Rebelizer/pellet/commit/6d8c4b0f10a5eb80f253d9bb273f547b9861d0e6))
* as a dev I want better error handling around building the translations file. ([66d36049](https://github.com/Rebelizer/pellet/commit/66d36049d8266eca8ee152e55b140403c2f9810f))
* Add more verbose error messaging for i18n ([baceb532](https://github.com/Rebelizer/pellet/commit/baceb532f73f47992974d2147fb541612e54739b))
* Add syntactic sugar for intl helper ([8388641e](https://github.com/Rebelizer/pellet/commit/8388641e4763a5d51ac34dde7bd00ceca5a1f170))
* as a dev I want better built in internationalization support ([0d26134c](https://github.com/Rebelizer/pellet/commit/0d26134ceb102fee6c1a9cc365f69f00aa8689d8))


### 0.0.29 (2014-12-06)


#### Bug Fixes

* change the default lang to "en-US" from "en" ([08e260ff](https://github.com/Rebelizer/pellet/commit/08e260ffbcb09248e8adb6cc175a1b8705f2fb33))
* html lang attribute should only be 2 chars and the default lang should be "en-US ([b5abd781](https://github.com/Rebelizer/pellet/commit/b5abd781bd5bf75c8559da9ea093c9e56084317f))
* as I dev I need access to base url that I can find locale files in the broswer ([dd400bff](https://github.com/Rebelizer/pellet/commit/dd400bff5ec6d966d310fd72f18ce882f7c6a3aa))
* caching API call using cache prefix ([2200ccad](https://github.com/Rebelizer/pellet/commit/2200ccadb9a6e25238354471ee61b41c1c4fc30a))
* pass the isolatedConfig so mount componented can shae the config ([89c80607](https://github.com/Rebelizer/pellet/commit/89c8060754db977eccce50921a8feb3ed40bff62))
* refactor our private react preflite function referance to a standare _$ not __$ ([032c899b](https://github.com/Rebelizer/pellet/commit/032c899bc613476b335132cc13c22396910f8c80))
* refactor coordinator ([9100517d](https://github.com/Rebelizer/pellet/commit/9100517d7e3d91075a1b4a06e77ea25cd579ab70))
* the first time polyfill build it does not have a last modified date ([bfad959e](https://github.com/Rebelizer/pellet/commit/bfad959e197d8265dd4ab829c572124bd296236d))
* in production mode hide the progress bar because it fills the log with junk ([5b922824](https://github.com/Rebelizer/pellet/commit/5b922824249d13bd635e313d079dcbb0abc5f035))
* when refactoring coordinator I missed upgrade coordinator (good thing the unit t ([711f3820](https://github.com/Rebelizer/pellet/commit/711f382003d3efb1b1c3c22860fe270147ef8067))
* add missing npm package ([79f3c405](https://github.com/Rebelizer/pellet/commit/79f3c405a38e106929151757ac9ddf219a700407))


#### Features

* as a dev I want to include unicode CLDR data into translation file to support nu ([5b304c52](https://github.com/Rebelizer/pellet/commit/5b304c52a9edf18c7cdc7d9320be4b4969bf9017))
* as a dev I want a way to load translation file dynalicly ([f98c6c92](https://github.com/Rebelizer/pellet/commit/f98c6c928f350a3bace2ef6d176b858bcecfea99))
* as a dev I want isolated config per request/pipeline ([3604866d](https://github.com/Rebelizer/pellet/commit/3604866d71e359a684f881ff3f0390f3669b2ab2))
* as a dev I want a better core organization ([29798771](https://github.com/Rebelizer/pellet/commit/2979877176d897f24c740fed53ff299492ff0a9b))
* as a dev I want to refactor coordinators into a isolator and coordinator classes ([7d24d22d](https://github.com/Rebelizer/pellet/commit/7d24d22d8d9d44f59b60ae804ccc43d5c3e2da12))
* add better instructions to creating a project ([8573a926](https://github.com/Rebelizer/pellet/commit/8573a9261f4fcebd9ed1286ca90d4475b8128624))


#### Breaking Changes

* changed __$construction to _$construction

 ([032c899b](https://github.com/Rebelizer/pellet/commit/032c899bc613476b335132cc13c22396910f8c80))
* We rename and broke up coordinator's into isolator and pipelines

 ([9100517d](https://github.com/Rebelizer/pellet/commit/9100517d7e3d91075a1b4a06e77ea25cd579ab70))


### 0.0.28 (2014-11-28)


#### Bug Fixes

* when pellet creates a new project it overwrites the wrong file ([019aad31](https://github.com/Rebelizer/pellet/commit/019aad3147e1c4090a6bbf4ce6ed1386e3ae0dae))
* when no translations show a useful message not "Translations Breakdown: {" ([4fa11970](https://github.com/Rebelizer/pellet/commit/4fa119701ab6a82d6726440c3cdfb37204ae7698))
* as a dev I want a more declarative pellet config session ([6dff57c9](https://github.com/Rebelizer/pellet/commit/6dff57c9f4d3dcfaca9d1a4b0c467b139bea24e5))


#### Features

* as a dev I want the first time experience of pellet to be easy ([2273e87b](https://github.com/Rebelizer/pellet/commit/2273e87bc29238f8c82fcf16f8fda867dfa1ce5e))
* as a dev I want pellet to decode son body (POST) automatically ([2dd23615](https://github.com/Rebelizer/pellet/commit/2dd23615b4226100e87e78c815e6019725f1ec22))
* as a dev I want to support isomorphic cookie (to allow client/server cookie acce ([e3d566cc](https://github.com/Rebelizer/pellet/commit/e3d566cc9b32676187ca04a06650b4c970931233))


### 0.0.27 (2014-11-24)


#### Bug Fixes

* when pellet inits with out config we need default that will not crash pellet ([c825a047](https://github.com/Rebelizer/pellet/commit/c825a0472bb615625f68bf1fe1975a8cc443ae3a))


### 0.0.26 (2014-11-23)


#### Bug Fixes

* allow pellet to get initialized with out args ([e7862ede](https://github.com/Rebelizer/pellet/commit/e7862eded9055d4519bd272b77c5369ed6e8a0f0))
* remove the cap Intl from webpack not needed ([8fb9b015](https://github.com/Rebelizer/pellet/commit/8fb9b015ba83714f211b383fc51c67474d5b1a87))


#### Features

* as a dev I want basic stats around rendering, request, boot times ([a04e14b6](https://github.com/Rebelizer/pellet/commit/a04e14b65aa0ea6a9a0f7f72b1743592d29aeb8c))
* as a dev I want to instrument my code using StatsD ([db27a919](https://github.com/Rebelizer/pellet/commit/db27a91990658576b2dcb16665d7ff920caffa99))
* as a dev I want access to pallet config before startInit is called ([70bb4881](https://github.com/Rebelizer/pellet/commit/70bb48810dca2fc8f18f2b8cbb0edbf3a25b2931))


### 0.0.25 (2014-11-22)


### 0.0.24 (2014-11-22)


#### Bug Fixes

* allow both upper and lower case Intl npm packages ([aaf59c5f](https://github.com/Rebelizer/pellet/commit/aaf59c5fde74ace88b23ebbfc302f9855fde2f99))


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

