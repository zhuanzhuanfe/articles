---

1.4.0发布25天后，Nuxt2就即将来临。超过330次提交，320次更改文件，8,200次添加和7,000次删除（不包括其他nuxt repositories）！好吧，似乎很多变化，但不用担心，我们会尽最大努力减少breaking changes的数量，更多的关注于稳定性，性能和更好的开发体验。我们对这些变化进行了总结：

## 🏎 Webpack 4 (Legato)

仅这个改进就值得一篇专门的文章。有什么新特性呢？

*   🏎 Webpack 4, is FAST!
*   😍 Mode, #0CJS, and sensible defaults
*   ✂ Goodbye CommonsChunkPlugin
*   🔬WebAssembly Support
*   🐐 Module Type’s Introduced + .mjs support

想了解更多信息请看 [Sean T. Larkin][2]的 [这篇文章][1] 以及Webpack [Release Notes][3].

其他改进:

*   Default dev tool for client bundle is the webpack default `eval` which is the fastest option.
*   Module Concatenation (Scope Hoisting) optimization is enabled by default.
*   删除了实验属性`build.dll`。它不稳定，而webpack 4速度已经足够快。

💡 **迁移提示:** 好消息是，你不需要更改项目中的任何代码。只要升级到Nuxt 2，所有东西都会立刻迁移。

## 👋 弃掉了venders

我们以前一直使用 `vendors` chunk，这次发布后，我们不再使用CommonsChunkPlugin，所以不必明确指定`vendors`。Nuxt自动添加了核心的packages(包括vue,vue-router,babel-runtime...)到**Cache Group**中。这使得webpack可以用最合理的方式拆分你的代码。

💡 **迁移提示:** 如果你在项目的`nuxt.config.js`中配置了`vendors`，直接去掉即可。 如果你是一个module author,你可以继续使用`this.addVendor()`，但我们可能会有弃用提示。

## ✂️ chunk splitting的完全控制

以前，Nuxt被选择用于代码分割。尽管Nuxt试图提供最有效的分割，但现在可以使用`build.splitChunks`选项完全控制它，并且可以选择禁用每个路由的异步块。

⚠️ **BREAKING CHANGE:** nuxt默认不再拆分layout chunks，它们将像nuxt core, plugins, middleware和store一样被加载进主入口。你也可以通过`build.splitChunks.layouts: true`使得layout拆分。另外为了更好的控制** webpack **块分割，你可以使用`build.optimization.splitChunks`选项。

⚠️ **BREAKING CHANGE:** 对于生产环境，我们不再使用文件名作为 chunk names 的一部分( `/_nuxt/pages/foo/bar.[hash].js`变成`[hash.js]`)这样容易让别人意外发现工程内部的漏洞。你也可以使用`build.optimization.splitChunks.name: true`强制开启。 (如果未指定，names仍然在 `dev`和`--analyze` 模式下启用)

⚠️ **BREAKING CHANGE:** webpack默认不会拆分runtime（manifest）chunk以减少异步请求而是将其移入main chunk。你可以使用`build.optimization.runtimeChunk: true`启用。

⚠️ **注意:** Nuxt的默认设置基于最佳实践，并在与实际项目应用之后进行了优化。建议阅读 [Tobias Koppers][5]写的[RIP CommonsChunkPlugin][4]并在每次更改之后使用`nuxt build --analyze`.

💡 **迁移提示:** 保持默认值。根据您的需求对您的实际项目进行基准测试并根据需要定制选项。

## 🔥 Vue Loader 15 and mini-css-extract-plugin

如果您没有听过[vue-loader][6], 其实他就是把 `.vue` 文件解析为可运行的JS/CSS and HTMl。Vue-Loader 15进行了完全的重写，它使用了一种完全不同的新架构，能够将webpack配置中定义的任何规则应用于`* .vue`文件内。

对于CSS抽取，我们使用一个新的插件`mini-css-extract-plugin`，它支持CSS和SourceMaps（CSS splitting）的按需加载，并构建在新的webpack v4特性（module types）上。

两者都是新的，所以在我们最终的2.0.0版本发布之前，预计会有一些不一致。 

## Nuxt 💖 ES modules

现在你可以在`nuxt.config.js`中使用`import` and `export` , 服务器middleware和modules要感谢[std/esm][7]. A fast, production ready, zero-dependency package to enable ES modules in Node 6+ by [John-David Dalton][8].

## 🖥️ CLI 改善

我们非常感谢开发人员，并相信他们需要优雅的开发经验才能创造美好的事物，所以我们重写了很多关于CLI的东西。

在使用 `nuxt dev`时, 即使CLI显示Nuxt准备就绪，您也可能感觉到构建延迟。这是因为webpack运行两次。一次用于客户端，一次用于SSR捆绑。第二个是隐藏的！因此，我们创建了 [WebpackBar][9] ，使得开发模式更加顺畅。

现在，所有debug信息都默认隐藏（可以使用`DEBUG=nuxt:*` 环境变量启用），相反，我们会为builder和generator展示更好的信息。

Nuxt经常要求的增强功能支持Test and CI（持续集成）环境。 Nuxt 2自动检测配置项和测试环境，并将切换到一个称为minimalCLI的特殊模式，其中包含更少的详细消息。

## 🤷 Nuxt 1.0中删除的功能

*   Removed `context.isServer` and `context.isClient` (Use `process.client` and `process.server`)
*   Removed `options.dev` in `build.extend()` (Use `options.isDev`)
*   Removed tappable hooks (`nuxt.plugin()`) in modules (Use new hooks system)
*   Removed callback for modules (Use `async` or return a `Promise`)

## 🎌 Experimental Multi-Thread Compiler

虽然这将是webpack 5的官方功能，但你可以使用实验性的`options.build.cache：true`来启用[cache-loader] [10]和babel cache以及`options.build.parallel：true`启用[thread-loader] [11]。

## ⭕ SPA改善

Nuxt.js是Vue.js开发人员的通用框架，这意味着它可以用于SSR或仅用于客户端（单页面应用）模式。我们重新修改了SPA的一些重要内容。

SPA重要的组件之一是页面加载指示器。它被重新设计，如果发生任何问题就会进入错误状态，并会在约2秒后自适应地开始在DOM中显示。如果SPA应用加载速度够快，这将有助于不必要的闪屏。我们还添加了aria标签，以帮助屏幕阅读器和搜索引擎正确检测启动画面。

SPA模式使用特殊的meta渲染器将`nuxt.config.js`中定义的所有meta标签添加到页面标题中，以实现SEO和HTTP2支持！我们也为SPA模式增加了`options.render.bundleRenderer.shouldPrefetch`和`options.render.bundleRenderer.shouldPreload`

⚠️ **BREAKING CHANGE:** `shouldPrefetch`默认是禁用的。许多用户反馈不需要的页面块prefetch，尤其是在中型项目上。此外，所有不必要的资源提示在非生产模式下都会被禁用，以便于调试。

## 🐰 等不及发布了吧? 使用nuxt-edge!

您可以通过删除`[nuxt] [12]`并安装`[nuxt-edge] [13]`NPM package来帮助我们试验最新功能。随意留下您的评论标上`[edge]`。

对于yarn，你可以使用这个命令安装: `yarn add nuxt@npm:nuxt-edge` (Thanks to [t][14]he [Benoît Emile][15]’s suggestion)

### 💭 期待你的反馈 :)

Nuxt 2 即将来临。我们正在做最后的检查，优化和测试以便发布更加稳定的版本。同时我们期待您的反馈 [**https://nuxtjs.cmty.io**][16]

[1]: https://medium.com/webpack/webpack-4-released-today-6cdb994702d4
[2]: https://medium.com/@TheLarkInn
[3]: https://github.com/webpack/webpack/releases
[4]: https://gist.github.com/sokra/1522d586b8e5c0f5072d7565c2bee693
[5]: https://medium.com/@sokra
[6]: https://vue-loader.vuejs.org/en/
[7]: https://github.com/standard-things/esm
[8]: https://medium.com/@jdalton
[9]: https://github.com/nuxt/webpackbar
[10]: https://github.com/webpack-contrib/cache-loader
[11]: https://github.com/webpack-contrib/thread-loader
[12]: https://www.npmjs.com/package/nuxt
[13]: https://www.npmjs.com/package/nuxt-edge
[14]: https://medium.com/@bemile?source=user_popover "Go to the profile of Benoît Emile"
[15]: https://medium.com/@bemile
[16]: https://nuxtjs.cmty.io