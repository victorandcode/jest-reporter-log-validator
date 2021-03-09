# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.1.5](https://github.com/victorandcode/jest-reporter-log-validator/compare/v0.1.4...v0.1.5) (2021-03-09)

### [0.1.3](https://github.com/victorandcode/jest-reporter-log-validator/compare/v0.1.2...v0.1.3) (2021-01-24)


### Features

* add module to validate config schema ([e27e467](https://github.com/victorandcode/jest-reporter-log-validator/commit/e27e467169357d962c2dde59cecd64447f61aee3))
* run config schema validation when running the reporter ([0c96538](https://github.com/victorandcode/jest-reporter-log-validator/commit/0c9653839b385cf34fc51b6845a958301874e6e7))

### [0.1.2](https://github.com/victorandcode/jest-reporter-log-validator/compare/v0.1.1...v0.1.2) (2021-01-09)

### 0.1.1 (2021-01-09)


### Features

* **reporting:** display multiple errors at the same time if reporter failed ([8c04447](https://github.com/victorandcode/jest-reporter-log-validator/commit/8c04447bfe50cad8b9bfda4dddbe294943d3bb13))
* make unknown errors only be reported if they are unique ([89ec8f6](https://github.com/victorandcode/jest-reporter-log-validator/commit/89ec8f6480ce20908aad60630e04bc83b754c0b1))
* **config:** rename json config file ([41c03f5](https://github.com/victorandcode/jest-reporter-log-validator/commit/41c03f5bb54afc65fa0ba839c9a3994df4f3f7ce))
* **configuration:** add failIfUnknownWarningsFound config ([74ce5a8](https://github.com/victorandcode/jest-reporter-log-validator/commit/74ce5a82a75c6fd08c03166757cd6413e3946177))
* **configuration:** add module to load config from different sources ([8f0f467](https://github.com/victorandcode/jest-reporter-log-validator/commit/8f0f467890c0e506daa7cd4ed251e337a24fbd93))
* **configuration:** add possibility to configure via reporter options ([a20ae62](https://github.com/victorandcode/jest-reporter-log-validator/commit/a20ae62928a43ffaea2918b151472ea861503689))
* **configuration:** add support for logsWithoutLimit array ([48afb37](https://github.com/victorandcode/jest-reporter-log-validator/commit/48afb374fc328e1136196eda5431d4a8722fc0a4))
* **reporter:** make reporter fail if verbose isn't set to false ([64d55f0](https://github.com/victorandcode/jest-reporter-log-validator/commit/64d55f027e76501c1a8d12c0f243548f9743a4e4))
* **reporting:** colorize output and use tables when possible ([da0e2c5](https://github.com/victorandcode/jest-reporter-log-validator/commit/da0e2c5f6ec3641e558d76be212deb7d5292d804))
* improve log messages ([aa9204a](https://github.com/victorandcode/jest-reporter-log-validator/commit/aa9204ab9b4194eedc9bab44a93ae2a9663b0cc1))
* initial commit with subset of features from reporter ([adacdd5](https://github.com/victorandcode/jest-reporter-log-validator/commit/adacdd531342b75aed54f6da99aa3354b15cfe9e))


### Bug Fixes

* require all patterns in message validations to match the message before validating ([b490875](https://github.com/victorandcode/jest-reporter-log-validator/commit/b490875743cb6e2b8978ed033dbf4cb7054cf68b))
