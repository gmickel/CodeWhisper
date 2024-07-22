## [1.0.12](https://github.com/gmickel/CodeWhisper/compare/v1.0.11...v1.0.12) (2024-07-22)


### Bug Fixes

* improve export-templates command ([ef6cab6](https://github.com/gmickel/CodeWhisper/commit/ef6cab676c86e40c5b36af3b9bb35401fe7135e9))

## [1.0.11](https://github.com/gmickel/CodeWhisper/compare/v1.0.10...v1.0.11) (2024-07-22)


### Bug Fixes

* programmatic usage of getAvailableTemplates ([b385bcf](https://github.com/gmickel/CodeWhisper/commit/b385bcf1b8f31ff6095fd3b4d04f068abc9beefd))

## [1.0.10](https://github.com/gmickel/CodeWhisper/compare/v1.0.9...v1.0.10) (2024-07-22)


### Bug Fixes

* template path resolution ([ce9e6d9](https://github.com/gmickel/CodeWhisper/commit/ce9e6d9e09b4918d5760028c079ce8f4d467eae6))
* trigger release after fixing template path resolution ([96696e2](https://github.com/gmickel/CodeWhisper/commit/96696e20dee5cf1c80e7e58c2fe2fe3a56d99c45))

## [1.0.9](https://github.com/gmickel/CodeWhisper/compare/v1.0.8...v1.0.9) (2024-07-22)


### Bug Fixes

* worker-paths in different environments ([ed1336c](https://github.com/gmickel/CodeWhisper/commit/ed1336c2d2f2ce1427acf6ac6e572d775f819fd0))

## [1.0.8](https://github.com/gmickel/CodeWhisper/compare/v1.0.7...v1.0.8) (2024-07-22)


### Bug Fixes

* entry point and worker paths ([a4b7510](https://github.com/gmickel/CodeWhisper/commit/a4b75104485dec328cc43bd596644b7ecf9c5f28))

## [1.0.7](https://github.com/gmickel/CodeWhisper/compare/v1.0.6...v1.0.7) (2024-07-22)


### Bug Fixes

* improve path resolution in different environments ([44bbe2b](https://github.com/gmickel/CodeWhisper/commit/44bbe2b606e3c24c7a4c7cb76f888445a96e8446))

## [1.0.6](https://github.com/gmickel/CodeWhisper/compare/v1.0.5...v1.0.6) (2024-07-22)


### Bug Fixes

* Update interactive-filtering.ts to disable going to the upper directory ([d2faa93](https://github.com/gmickel/CodeWhisper/commit/d2faa93df9cc547869fd46eba17bb6a7887baacc))

## [1.0.5](https://github.com/gmickel/CodeWhisper/compare/v1.0.4...v1.0.5) (2024-07-22)


### Bug Fixes

* trigger release after fixing programatic usage ([8053d24](https://github.com/gmickel/CodeWhisper/commit/8053d24a650362daadbce254a779ebfb45860e2e))

## [1.0.4](https://github.com/gmickel/CodeWhisper/compare/v1.0.3...v1.0.4) (2024-07-22)


### Bug Fixes

* programmatic usage ([34aae91](https://github.com/gmickel/CodeWhisper/commit/34aae91a8fc9bb6f6049381960dbb6b1fc79b766))
* trigger release after fixing programatic usage ([1be5054](https://github.com/gmickel/CodeWhisper/commit/1be5054ab944eb0d2f16134f5ad5e2adbecbae6c))

## [1.0.3](https://github.com/gmickel/CodeWhisper/compare/v1.0.2...v1.0.3) (2024-07-22)


### Bug Fixes

* Update package.json exports and built to allow programmatic usage ([89e759a](https://github.com/gmickel/CodeWhisper/commit/89e759a97a2a71d341336452bc9334923cfd5148))

## [1.0.2](https://github.com/gmickel/CodeWhisper/compare/v1.0.1...v1.0.2) (2024-07-21)


### Bug Fixes

* npm cli.js entrypoint ([265a481](https://github.com/gmickel/CodeWhisper/commit/265a481a3f7d6d527c8a3dafbeb316004b896406))

## [1.0.1](https://github.com/gmickel/CodeWhisper/compare/v1.0.0...v1.0.1) (2024-07-21)


### Bug Fixes

* trigger release after fixing permissions ([d077481](https://github.com/gmickel/CodeWhisper/commit/d077481d2ad5a7f9e294202e462939b0cd286ef4))

# 1.0.0 (2024-07-21)


### Bug Fixes

* **cli:** also set a default value for invert in the commander options ([405c96e](https://github.com/gmickel/CodeWhisper/commit/405c96e92bcea63e3f46ca6baa7ff91ee2a41f3d))
* **cli:** invert is set to false by default ([4050f59](https://github.com/gmickel/CodeWhisper/commit/4050f59ad95faed5d08e82366ef5829e453bb693))
* e2e test cross platform compatibility ([4e8ca51](https://github.com/gmickel/CodeWhisper/commit/4e8ca5102c968557d362df10d53818273447a68e))
* template dir for when run via npx/npm ([7817b0b](https://github.com/gmickel/CodeWhisper/commit/7817b0b4a93101ae474decb051419061fc17c253))
* test paths ([76c9ff9](https://github.com/gmickel/CodeWhisper/commit/76c9ff9797af07a30b3d31b8a0be0d1c10a241c3))
* windows paths and line-endings ([21743e2](https://github.com/gmickel/CodeWhisper/commit/21743e2937313f307e4438b1315c0cbaa5922ab4))
* windows paths in tests ([22993f4](https://github.com/gmickel/CodeWhisper/commit/22993f4793b0ff8e2c449d84fdeb3a46aab85d2f))


### Features

* add line-numbers option ([7fd314f](https://github.com/gmickel/CodeWhisper/commit/7fd314fe1793aa66ff35e9916ff1442104be75bf))
* Add new template file for minimal layout ([b898fa6](https://github.com/gmickel/CodeWhisper/commit/b898fa6c642f3fd57c747538d2b34ba0425cbda1))
* add respect gitignore flag ([df9a406](https://github.com/gmickel/CodeWhisper/commit/df9a4062ed2cd0ed8a3f40aaeb7c4ea7b283229e))
* **cache:** add FileCache tests and fix Date serialization ([c09f1f8](https://github.com/gmickel/CodeWhisper/commit/c09f1f83fbdb6a400ea01b4f63b250543a80428c))
* **cli:** add --invert option for interactive filtering ([535a95f](https://github.com/gmickel/CodeWhisper/commit/535a95f85996a7a0aedbf040e95be175dfad101b))
* **cli:** fix custom data and tests ([e1ca88d](https://github.com/gmickel/CodeWhisper/commit/e1ca88d66c29893ef0b0e4a2f3c91ca8221b8f81))
* **core:** add support for additional file extensions ([4c136d7](https://github.com/gmickel/CodeWhisper/commit/4c136d7b10eeaa0b70bfed089833503d8e5c9f31))
* Fix implementation and tests for interactive mode and cache ([fd03855](https://github.com/gmickel/CodeWhisper/commit/fd038554cb6ba0e7f5d3c24617c2f0fe0cc20c8f))
* improve file cache handling and normalize paths ([a87735d](https://github.com/gmickel/CodeWhisper/commit/a87735da0b2b733c36803eae3847438eab255052))
* **interactive mode:** fix implementation and tests ([02b3569](https://github.com/gmickel/CodeWhisper/commit/02b3569fdd75f3cabd76909d802009789f1a736a))
* start on interactive-filtering ([627e26a](https://github.com/gmickel/CodeWhisper/commit/627e26aa56d45693a37c8018f0fe1dccb459dba0))
* update relative path in table of contents ([47827bb](https://github.com/gmickel/CodeWhisper/commit/47827bb5526b1e4d0eb5763eb5229071623decbf))
