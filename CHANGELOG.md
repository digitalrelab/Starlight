# Changelog

## [0.5.0](https://github.com/digitalrelab/Starlight/compare/v0.4.0...v0.5.0) (2026-11-27)


### Features

* **agent:** add Codex as a provider ([#68](https://github.com/digitalrelab/Starlight/issues/68)) ([bb9408c](https://github.com/digitalrelab/Starlight/commit/bb9408cdf2bc8aadc934e7f390fe593abde0109a))
* **agent:** chats sidebar with rename and delete ([#48](https://github.com/digitalrelab/Starlight/issues/48)) ([bd60bbf](https://github.com/digitalrelab/Starlight/commit/bd60bbfdb11e9adc17c2afe8b9edcb0ed8a0e17c))
* **agent:** favourite models with their reasoning, and curated model lists ([#73](https://github.com/digitalrelab/Starlight/issues/73)) ([f717839](https://github.com/digitalrelab/Starlight/commit/f7178395b0f62430221a47d221f7b5f274fb1a81))
* **agent:** write chat messages in the markdown editor ([#70](https://github.com/digitalrelab/Starlight/issues/70)) ([6b93947](https://github.com/digitalrelab/Starlight/commit/6b939471301d86faabcfdf5f7697849afa696fd3))
* **browser:** captioned grid tiles and a folder shelf ([#56](https://github.com/digitalrelab/Starlight/issues/56)) ([a2626b1](https://github.com/digitalrelab/Starlight/commit/a2626b1b4a8612702fb77c8291dd94d508957da6))
* **browser:** prefetch a folder when it is hovered or selected ([#46](https://github.com/digitalrelab/Starlight/issues/46)) ([07c05a8](https://github.com/digitalrelab/Starlight/commit/07c05a8e2ce7769a9de04adb13c8e01dd01c043a))
* **browser:** work ahead on the open folder's previews and subfolders ([#49](https://github.com/digitalrelab/Starlight/issues/49)) ([e244f05](https://github.com/digitalrelab/Starlight/commit/e244f05d97aee3b8a532a2c0fdee9f9e37c847f8))
* **catalog:** extract palettes and pixel traits as properties, shown in the viewer ([#67](https://github.com/digitalrelab/Starlight/issues/67)) ([5f87162](https://github.com/digitalrelab/Starlight/commit/5f8716261efac742b9e975aaec4ca44907e939c4))
* **catalog:** give files stable ids that follow renames, moves and safe saves ([#60](https://github.com/digitalrelab/Starlight/issues/60)) ([1a62e2a](https://github.com/digitalrelab/Starlight/commit/1a62e2ae2b58b2cff5ef9a326e1e44defed0d30d))
* **catalog:** process pixel facts in the background, starting with ThumbHash placeholders ([#54](https://github.com/digitalrelab/Starlight/issues/54)) ([dc99b02](https://github.com/digitalrelab/Starlight/commit/dc99b02e1578b405f6d146a7c204d1b17d04872d))
* **catalog:** treat MP4 and MOV videos as media with dimensions, duration and frame previews ([#79](https://github.com/digitalrelab/Starlight/issues/79)) ([9720084](https://github.com/digitalrelab/Starlight/commit/9720084ea6c3d50a628fc461bb3231582fe892a7))
* **core:** keep entry and media watches in step with mounts and folder contents ([#75](https://github.com/digitalrelab/Starlight/issues/75)) ([2d47ac5](https://github.com/digitalrelab/Starlight/commit/2d47ac558566d3ad9cf6a7a9088b3f3ef1caeb3e))
* **desktop:** back and forward from the Go menu, swipes and mouse buttons ([#78](https://github.com/digitalrelab/Starlight/issues/78)) ([3744001](https://github.com/digitalrelab/Starlight/commit/3744001387659941d7273c7df9157e9459d430ec))
* **desktop:** follow the theme setting in the window and native UI ([#84](https://github.com/digitalrelab/Starlight/issues/84)) ([adc649f](https://github.com/digitalrelab/Starlight/commit/adc649fc52497739fcee2f8592bf9dd60a555407))
* **desktop:** step the interface size with the zoom shortcuts ([#43](https://github.com/digitalrelab/Starlight/issues/43)) ([738d289](https://github.com/digitalrelab/Starlight/commit/738d289ddf0fc59de08429376045cc9c379ee75e))
* **files:** save edited files through a versioned write pipeline, starting with Markdown ([#50](https://github.com/digitalrelab/Starlight/issues/50)) ([0fea058](https://github.com/digitalrelab/Starlight/commit/0fea058a1b37157833801d80969b7da796563047))
* **inspector:** show a file's details in a side panel in the browser and viewer ([#72](https://github.com/digitalrelab/Starlight/issues/72)) ([490b68b](https://github.com/digitalrelab/Starlight/commit/490b68b5669c40f752e659de8829a13ec8dbb6ee))
* **media-player:** add a shared player and use it for video in the viewer ([#62](https://github.com/digitalrelab/Starlight/issues/62)) ([081968d](https://github.com/digitalrelab/Starlight/commit/081968d23dd721999c8cfe42ae5b818893758e6a))
* **media-player:** play audio in the viewer with a frequency visualizer ([#71](https://github.com/digitalrelab/Starlight/issues/71)) ([1ae1e66](https://github.com/digitalrelab/Starlight/commit/1ae1e667f9a9c877fc64df882053e44e9daca3a3))
* **projects:** chats belong to a project ([#64](https://github.com/digitalrelab/Starlight/issues/64)) ([91c5b1e](https://github.com/digitalrelab/Starlight/commit/91c5b1ebcee790059aec5f88a82191b63394228e))
* **projects:** manage projects explicitly ([#59](https://github.com/digitalrelab/Starlight/issues/59)) ([851e581](https://github.com/digitalrelab/Starlight/commit/851e5816c63ec74ab54c392ecf6b70f03c83e34c))
* **settings:** add chat font and text size to Appearance ([#58](https://github.com/digitalrelab/Starlight/issues/58)) ([1a075d2](https://github.com/digitalrelab/Starlight/commit/1a075d28f4254298bb5956e9e2e52dec0ab049e2))
* **settings:** hide hidden files unless shown in Settings → Files ([#74](https://github.com/digitalrelab/Starlight/issues/74)) ([796963f](https://github.com/digitalrelab/Starlight/commit/796963fe490480b62bdccb1896ee81c4d8e88eef))
* **settings:** list the default chat font first ([#82](https://github.com/digitalrelab/Starlight/issues/82)) ([9cd827e](https://github.com/digitalrelab/Starlight/commit/9cd827e8dde9a2d8efccd0857621d1b5fefd16d7))
* **shell:** back and forward buttons in the sidebar titlebar ([#81](https://github.com/digitalrelab/Starlight/issues/81)) ([787aadf](https://github.com/digitalrelab/Starlight/commit/787aadf400ea16c10d880a6609f7556ee8e46381))
* **ui:** breadcrumbs primitive, current crumb no longer bold ([#69](https://github.com/digitalrelab/Starlight/issues/69)) ([f655ebc](https://github.com/digitalrelab/Starlight/commit/f655ebcb29bf4b9d0aaa4f5733aa00f2bc40d34f))
* **viewer:** mark unsaved changes with a dot beside the file name ([#52](https://github.com/digitalrelab/Starlight/issues/52)) ([484a3f8](https://github.com/digitalrelab/Starlight/commit/484a3f847aeb74661e538829c52f9c9dcfcc1728))


### Bug Fixes

* **desktop:** show the window once the page has rendered with its settings ([#63](https://github.com/digitalrelab/Starlight/issues/63)) ([157ba52](https://github.com/digitalrelab/Starlight/commit/157ba5215248d461214f6f19fc13cf4a88fdf749))
* **viewer:** give opened files their own history entry ([#66](https://github.com/digitalrelab/Starlight/issues/66)) ([a59ec99](https://github.com/digitalrelab/Starlight/commit/a59ec995ad97a925943ab2f82e9271c32d821f0d))


### Performance Improvements

* **agent:** keep Claude Code warm between turns ([#57](https://github.com/digitalrelab/Starlight/issues/57)) ([5cb2d2b](https://github.com/digitalrelab/Starlight/commit/5cb2d2bdb309c093b1956f1d8fb17c142bb4396f))
* **agent:** virtualize the chat transcript ([#76](https://github.com/digitalrelab/Starlight/issues/76)) ([94df414](https://github.com/digitalrelab/Starlight/commit/94df414a6fb3ca19d9ca40edcd8e43c21f96e1c1))
* **markdown:** keep typing fast in large files ([#65](https://github.com/digitalrelab/Starlight/issues/65)) ([56bbaea](https://github.com/digitalrelab/Starlight/commit/56bbaea665399e0beb2dc2e74676363e13b9f433))
* **previews:** key cached previews by file id so renames and moves keep them ([#83](https://github.com/digitalrelab/Starlight/issues/83)) ([ecefc8a](https://github.com/digitalrelab/Starlight/commit/ecefc8a3761f283f3d585976fbd27eee8f97046b))

## [0.4.0](https://github.com/digitalrelab/Starlight/compare/v0.3.0...v0.4.0) (2026-11-27)


### Features

* **agent:** chat with agent providers on an Agent page ([#29](https://github.com/digitalrelab/Starlight/issues/29)) ([40c826d](https://github.com/digitalrelab/Starlight/commit/40c826d743f7b6f7c2ee71da89fb793184a5fc0b))
* **agent:** pick the model and reasoning effort per message ([#39](https://github.com/digitalrelab/Starlight/issues/39)) ([4b40537](https://github.com/digitalrelab/Starlight/commit/4b4053721ed250b3a69213623d6b517c3a81638e))
* **core:** persist file facts in a versioned catalog, starting with image dimensions ([#40](https://github.com/digitalrelab/Starlight/issues/40)) ([ea4e295](https://github.com/digitalrelab/Starlight/commit/ea4e295003ae2409c0b1d2b4c944bacd1357b189))
* **desktop:** add an interface size setting to appearance ([#42](https://github.com/digitalrelab/Starlight/issues/42)) ([77f8c89](https://github.com/digitalrelab/Starlight/commit/77f8c89111408d7a0f4301539ae9737d2ba58955))
* **desktop:** add an Updates settings page with the version and a manual check ([#35](https://github.com/digitalrelab/Starlight/issues/35)) ([28eb3f4](https://github.com/digitalrelab/Starlight/commit/28eb3f46b2f4c31288e113a38636cded331cd519))
* **files:** classify files into kinds with colored icons ([#33](https://github.com/digitalrelab/Starlight/issues/33)) ([e9993f7](https://github.com/digitalrelab/Starlight/commit/e9993f7d5dd1d18758497804596ee8c98bfb5b00))
* **markdown:** add a markdown engine for release notes, files and chats ([#37](https://github.com/digitalrelab/Starlight/issues/37)) ([aa4e2ed](https://github.com/digitalrelab/Starlight/commit/aa4e2ed0772db70e0e1c55be623c10a4995b6399))
* **settings:** show disk usage by part in Settings › Disk ([#34](https://github.com/digitalrelab/Starlight/issues/34)) ([87b1448](https://github.com/digitalrelab/Starlight/commit/87b1448edb7d61d2a033b4cc910f94fe8ad213da))
* **ui:** use ScrollArea for the sidebar, settings pages and browser layouts ([#38](https://github.com/digitalrelab/Starlight/issues/38)) ([70e93f7](https://github.com/digitalrelab/Starlight/commit/70e93f796c4dce061ff24a5f0452a9fcc9bc0f74))


### Bug Fixes

* **desktop:** pre-bundle Base UI as one dependency to stop duplicate React in dev ([#31](https://github.com/digitalrelab/Starlight/issues/31)) ([a6d53c5](https://github.com/digitalrelab/Starlight/commit/a6d53c54c5a502de9fdd7643e74fa86aba0c1780))


### Performance Improvements

* **desktop:** cache thumbnails on disk and load them by visibility ([#30](https://github.com/digitalrelab/Starlight/issues/30)) ([edeb5bc](https://github.com/digitalrelab/Starlight/commit/edeb5bc029a55ea9bc48b1301d5d002fee9de07f))

## [0.3.0](https://github.com/digitalrelab/Starlight/compare/v0.2.0...v0.3.0) (2026-11-27)


### Features

* **agents:** detect agent providers, starting with Claude Code ([#18](https://github.com/digitalrelab/Starlight/issues/18)) ([106b69d](https://github.com/digitalrelab/Starlight/commit/106b69d7dbbbc96c4108fad68748ef6735206177))
* **desktop:** add Starlight app icon ([#25](https://github.com/digitalrelab/Starlight/issues/25)) ([e8b235e](https://github.com/digitalrelab/Starlight/commit/e8b235e20955cc9a10e809acd2af338f124b69f0))
* **desktop:** give each dev instance its own debugging port and a run skill ([#28](https://github.com/digitalrelab/Starlight/issues/28)) ([8b01335](https://github.com/digitalrelab/Starlight/commit/8b013352e76b383c90fce96d97c8003c99d92b31))
* **desktop:** reopen the last location and show update failures ([#26](https://github.com/digitalrelab/Starlight/issues/26)) ([3bdb348](https://github.com/digitalrelab/Starlight/commit/3bdb348a907d728abda7321db8bc47926c7a0a8c))
* **desktop:** scope dev instances to their checkout ([#22](https://github.com/digitalrelab/Starlight/issues/22)) ([f93ab7d](https://github.com/digitalrelab/Starlight/commit/f93ab7da2e5beefd1c51727915f2656f268a92e6))
* **settings:** back arrow in the settings footer and instant provider status ([#24](https://github.com/digitalrelab/Starlight/issues/24)) ([be17eaf](https://github.com/digitalrelab/Starlight/commit/be17eaf11fd8262f023678901883ea1e513d31e4))
* **viewer:** open images and videos in a full-window viewer ([#20](https://github.com/digitalrelab/Starlight/issues/20)) ([7b2b02f](https://github.com/digitalrelab/Starlight/commit/7b2b02fdc742c0cc04685cb4fce77f1d3edf8426))

## [0.2.0](https://github.com/digitalrelab/Starlight/compare/v0.1.0...v0.2.0) (2026-11-27)


### Features

* **desktop:** check for updates on focus and every 15 minutes ([#19](https://github.com/digitalrelab/Starlight/issues/19)) ([b948bce](https://github.com/digitalrelab/Starlight/commit/b948bce07c60ed457bb0311afe8fe94463357388))
* **workspaces:** model files as source entries mounted into workspaces ([#13](https://github.com/digitalrelab/Starlight/issues/13)) ([b15f19d](https://github.com/digitalrelab/Starlight/commit/b15f19d988bc76a1dfa25a974805bf12c05d98fe))

## 0.1.0 (2026-11-27)

### Features

- **browser:** add switchable layouts with a justified photo grid ([#8](https://github.com/digitalrelab/Starlight/issues/8)) ([019b8d7](https://github.com/digitalrelab/Starlight/commit/019b8d7e3a98576f65df6c1340ca2b686b6d8486))
- **desktop:** add settings with appearance pointer cursors ([#5](https://github.com/digitalrelab/Starlight/issues/5)) ([5ae77d2](https://github.com/digitalrelab/Starlight/commit/5ae77d2e81f5ffb51c372896960872b18a75953d))
- **desktop:** add sidebar app shell ([7981dbd](https://github.com/digitalrelab/Starlight/commit/7981dbd49208da180e486548c059522e3c6f39f3))
- **desktop:** add sidebar app shell ([4be7ac1](https://github.com/digitalrelab/Starlight/commit/4be7ac1ea39f83749b0014cef00e4632c02525a5))
- **desktop:** auto-update macOS builds from GitHub Releases ([3785ee2](https://github.com/digitalrelab/Starlight/commit/3785ee29edfd436f9d9113ba02853adcea458862))
- **desktop:** auto-update macOS builds from GitHub Releases ([f614f53](https://github.com/digitalrelab/Starlight/commit/f614f53eb5cac3f4c9600592e58ea1d2d3f74387))
- **desktop:** on-demand updates from the sidebar footer with release notes ([#6](https://github.com/digitalrelab/Starlight/issues/6)) ([dcbb171](https://github.com/digitalrelab/Starlight/commit/dcbb171468a678927a6563a00b2814c0032d918f))
- **desktop:** theme and appearance preferences like nova-web ([#10](https://github.com/digitalrelab/Starlight/issues/10)) ([795b19d](https://github.com/digitalrelab/Starlight/commit/795b19d11cfea2acf95d34e2a24ea23a6e85bb61))
- **host:** watch workspace entries with @parcel/watcher ([#9](https://github.com/digitalrelab/Starlight/issues/9)) ([7d2d98f](https://github.com/digitalrelab/Starlight/commit/7d2d98fe93fe82a31e23b652a0dc0b0eca4349b8))
- **ui:** adopt Starchive brand theme ([#7](https://github.com/digitalrelab/Starlight/issues/7)) ([e1d72cf](https://github.com/digitalrelab/Starlight/commit/e1d72cfbf5b9c704901700b7729381b4eb827220))
- **ui:** use Hugeicons Pro icons ([b755d8d](https://github.com/digitalrelab/Starlight/commit/b755d8db06544df844e02d551758e7edddd62374))

### Bug Fixes

- **browser:** fall back to the nearest existing folder ([#11](https://github.com/digitalrelab/Starlight/issues/11)) ([82ded9e](https://github.com/digitalrelab/Starlight/commit/82ded9ee169f8862707513ae94f5909090cc3613))
- **ci:** authenticate private registry and start versions at 0.1.0 ([103f29a](https://github.com/digitalrelab/Starlight/commit/103f29a626f660eef9353624f19e5d7d5d57a8d5))
- **desktop:** isolate dev data per worktree ([c58bd9e](https://github.com/digitalrelab/Starlight/commit/c58bd9e4b35e3b5229efb37566427cb61b9659c5))
- **desktop:** ship Intel builds alongside Apple Silicon ([#12](https://github.com/digitalrelab/Starlight/issues/12)) ([1df3feb](https://github.com/digitalrelab/Starlight/commit/1df3febce3d2430453a2534e0b760769a590c5a7))
- **ui:** selected nav item keeps its tint on hover ([#14](https://github.com/digitalrelab/Starlight/issues/14)) ([3bac8fe](https://github.com/digitalrelab/Starlight/commit/3bac8fe7888674d0ca32e4f5405532e2eee3ee52))
