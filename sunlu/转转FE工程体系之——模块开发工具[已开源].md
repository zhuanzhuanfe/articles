> 「福利」 ✿✿ ヽ(°▽°)ノ ✿：文章最后有抽奖，**转转纪念T恤**，走过路过不要错过哦

## 背景

很多同学可能已经发现，当业务或者团队初具规模时，常常会遇到以下场景：我在解决业务需求的时候，写了一个非常酷炫的工具或者算法，我认为它在别的项目中也有适用场景。所以，作为一个对技术有追求的页面仔，我决定把它抽离出来并发布到 npm 上，方便别的同学直接引用，用得好的话还可以在全公司范围内推广，未来说不定还能在 GitHub 上开源，成为 star 收割机，吊打面试官...

![](https://pic1.zhuanstatic.com/zhuanzh/19c0b685-dd9b-4b15-95dc-f370c2bddb80.png)

于是我撸起袖子就干，新建项目...添加依赖...复制代码...`npm publish`，大功告成…等等，事情并没有这么简单：

* 业务项目使用我的模块时，并不会好心地帮我把`es6`的代码编译成`es5`，为了兼容低端设备，我需要自己配置`babel`，使我的模块开箱可用...
* 我的模块提供了多个方法，而业务只想用其中的一两个方法，为了追求极致性能，我必须支持按需加载...
* 模块如果要可持续迭代，我必须引入`eslint`和单元测试来提高代码的可靠性，必要时甚至还要写一个 demo ，确保项目能在本地启动以快速排查问题...
* 很明显一个月之后我肯定自己都忘了自己写了啥了，所以我需要这个模块能够自动构建文档，越详细越好...

![](https://pic3.zhuanstatic.com/zhuanzh/361db56d-6ace-4ac6-ab30-1eb6f43c6255.png)

为什么事情会变得这么复杂，我只想~~吊打面试官啊~~，不，我只想抽离一段代码啊...

## 需求

在转转内部的 npm 源上，转转 FE 团队的同学们开发了上百个这样的公共模块，这些模块极大地帮助了各个 FE 团队提升开发效率和代码质量，是转转前端基建的重要组成部分。但同时，如果每一个开发和维护公共模块的同学都要刀耕火种般地去独自处理上述这一系列问题，那这本身就是一种低效的行为。所以我们需要提供一套完整的模块开发工具，辅助并规范公共模块的开发工作，让每一个同学只需要专注于代码本身的逻辑开发，真正实现一键发布。

这正是`commander-tools`项目的设计初衷。

首先我们来梳理一下，当我开发一个公共模块时，我希望获得哪些基础能力支持：

* 项目模板
* 项目配置
* 代码规范
* 单元测试
* 本地调试
* 代码构建、分析与发布
* 文档生成、预览与上传
* ...

所以我们将围绕以上内容设计`commander-tools`项目。

## 设计思路

事实上，上述需求可以分为三大板块：生成项目模板、初始化项目配置和指令集。所以我们并没有把所有的工作都放在`commander-tools`中完成，`commander-tools`只负责指令集的部分。下面，我们会分步解析三个板块。

### 生成项目模板

这一步使用转转脚手架`zz-cli`的生成项目指令，通过问答式的交互生成。

![](https://pic1.zhuanstatic.com/zhuanzh/e2e58611-1b09-4547-a4cd-ebf6d039e17f.png)

生成的模板项目结构大致如下：

```plain
├── demo                    // demo 模板
├── docs                    // 后续自动生成的文档
├── dist                    // 后续自动生成的 umd 模块的代码
├── lib                     // 后续自动生成的 commonJS 模块的代码
├── es                      // 后续自动生成的 es module 模块的代码
├── src                     // 开发目录
│    ├── module1
│    ├── module2
│    └── index.js           // 模块汇总
├── test                    // 测试目录
│    ├── module1.test.js
│    └── module2.test.js
├── .browserlistrc          // 浏览器兼容配置
├── .eslintrc.js            // eslint 配置
├── .gitignore
├── .npmignore
│── babel.config.js         // babel 配置
│── doc.config.json         // 文档路径配置
│── prettier.config.js      // prettier 配置
│── index.js                // 入口文件
├── package.json            // 项目配置
│── CHANGELOG.md            // 更新日志
└── README.md
```

在模板的`package.json`文件中，已经默认将`commander-tools`作为`devDependencies`引入，并内置了`commander-tools`的指令集。

> 模板项目[zz-module-tpl](https://github.com/zhuanzhuanfe/zz-module-tpl 'zz-module-tpl')已开源，可以访问文章末尾的附录中的链接，查看模板的详细结构、按需加载的用法等。

```javascript
// package.json
{
  "scripts": {
    "lint": "commander-tools run lint",
    ...
  },
  "devDependencies": {
    "zz-commander-tools": "^1.0.0"
  },
}
```

原则上，我们希望一个公共模块项目将只需要依赖这一个包，就可以满足开发过程中需要用到的所有基础能力。

### 初始化项目配置

转转 FE 团队有着一套实践已久，且广泛推行的前端开发规范，通过提高代码风格和项目配置的一致性，降低代码维护成本，提高多人协作的效率。在较大规模的前端团队中，这一点显得尤为重要。显然我们的公共模块项目的初始配置，是遵循这一套规范的，下面我们将介绍几个在本项目中用到的若干规范：

1. 浏览器兼容规范

```bash
# .browserlistrc
> 1%
last 3 versions
iOS >= 8
Android >= 4
Chrome >= 40
```

`.browserlistrc`文件用于配置需要兼容的浏览器版本，`babel`、`postcss`等插件都会读取这个文件。这里我们和业务项目的配置保持一致，对于移动端项目，我们兼容到`iOS 8`和`Android 4`。

2. `babel`规范

```javascript
// babel.config.js
module.exports = (api) => {
  const { BABEL_MODULE, RUN_ENV, NODE_ENV } = process.env;
  const useESModules =
    BABEL_MODULE !== 'commonjs' &&
    RUN_ENV !== 'PRODUCTION' &&
    NODE_ENV !== 'test';
 
  api.cache(false);

  return {
    presets: [
      ['@babel/preset-env', {
        modules: useESModules ? false : 'commonjs',
        useBuiltIns: 'usage',
        corejs: 3
      }]
    ],
    plugins: [
      ['@babel/plugin-transform-runtime', { useESModules }]
    ]
  }
}
```

`babel.config.js`文件用于配置`babel`插件。这个文件初看之下略显复杂，但其实这只是因为我们用了一个`useESModules`变量区分目标文件的模块，前面提到我们会把代码编译成`es module`和`commonJS`两种模块，正是在这里做了区分。

实际上我们只用了

* 一个预设：`@babel/preset-env`
* 一个插件：`@babel/plugin-transform-runtime`

非常简单。

最后解释一下`@babel/preset-env`的两个参数：`useBuiltIns: 'usage'`可以实现垫片的按需加载，而`corejs: 3`则在`corejs@2`的基础上，支持为原型方法提供垫片。这个配置也是`babel 7`的最佳实践之一。

3. `eslint`规范

```javascript
// .eslintrc.js
module.exports = {
  "root": true,
  "extends": "eslint:recommended",
  "env": {
    "browser": true,
    "node": true,
    "es6": true
  },
  "parserOptions": {
    "sourceType": "module",
    "ecmaVersion": 10
  },
  "rules": {
    "semi": ["error", "never"],
    "quotes": ["error", "single"]
  }
}
```

关于`.eslintrc.js`文件，在转转的前端规范体系中，对于`Vue`或`React`项目，我们根据业务场景，做了很多个性化的配置；而对于公共模块等更偏向于纯`js`的项目，则只是做了最朴素的配置，支持了`es module`和`es10`最新语法，在此也不赘述。

另外，在执行`eslint`校验或者修复之前，会通过`prettier`插件格式化代码，配置文件`prettier.config.js`也已自动生成。这种`prettier`+`eslint`的方式也是业界流行的代码风格校验方案之一，也能很好地解决两者的不兼容之处。

### 指令集

接下来介绍`commander-tools`：一个高聚合度的指令集工具。

它的用法很简单：假如我想用`eslint`校验并修复代码，我既不需要安装`eslint`，也不需要手动输入`eslint --config 'path/to/config' --fix 'src/**'`这一串命令，我只需要在`package.json`文件中注册指令

```javascript
// package.json
{
  "scripts": {
    "fix": "commander-tools run lint --fix"
  }
}
```

然后执行`npm run fix`就行了，`commander-tools`已经内置了`eslint`依赖，它会执行上述的这一串指令——而且是经过封装的，比如：它会先用`prettier`格式化代码。

实现这个功能，`commander-tools`的核心原理分为两点：

1. 指令代理

通过调用`nodejs`的子进程`child_process`模块下的`spawn`函数，实现调用系统命令的功能。进一步地，我们直接使用第三方模块`cross-spawn`代替`spawn`，解决原生`nodejs`的跨平台问题。

```javascript
// runCmd.js
const getRunCmdEnv = require('./utils/getRunCmdEnv')

function runCmd(cmd, _args, fn) {
  const args = _args || []
  const runner = require('cross-spawn')(cmd, args, {
    stdio: 'inherit',
    env: getRunCmdEnv(),
  })

  runner.on('close', (code) => {
    if (fn) {
      fn(code)
    }
  })
}
module.exports = runCmd

// 相当于在命令行中直接执行 npm start
runCmd('npm', ['start'])
```

> 这里也对选择`child_process`模块的`spawn`而非`exec`做一个说明。两者都是新开一个子进程执行系统命令，不同的是`exec`返回一个`Buffer`，默认限制`200kb`的大小；而`spawn`返回一个`Stream`，处理大文件也不在话下。显然`commander-tools`有着批处理大量文件的需求，`spawn`是更可靠的。

1. 指令串联

对于复杂的任务，比如执行`commander-tools run pub`一键发布时，它会依次执行`git`校验、编译`commonJS`模块代码、编译`es module`代码、编译文档、上传文档、发布`npm`包、更新`git tag`这一系列操作。而这，是通过`gulp.series`的串联任务实现的。

```javascript
/**
 * 发布 npm 正式包
 */
gulp.task('pub',
  gulp.series(
    'check-git',
    'compile-es',
    'compile-lib',
    'doc-upload',
    done => {
      pub('pub', program, done)
    }
  )
)
```

就这样，通过指令代理和指令串联，我们实现了万物皆可`commander-tools`。

`commander-tools`满足了前文列出的公共模块项目所需要的所有常见需求，详细功能可以参见文后附录中的[commander-tools](https://github.com/zhuanzhuanfe/commander-tools 'commander-tools')源码的`README.md`，在此不再列出。

## 成果

通过指令封装，`commander-tools`支持了开发过程中所有的常见基础能力，项目的`devDependencies`目录再也不需要安装一大坨让人头大的`bebel`插件、`webpack`插件和开发工具，只管把脏活累活交给`commander-tools`就行。FE 同学只需要专注于自己的酷炫的工具或算法，一切都是那么自然和恰到好处。

目前，在转转的前端工程化体系中，`commander-tools`配合脚手架和前端开发规范，已经在团队中推广已久，且日趋稳定，帮助每一位 FE 同学更轻松地开发出更稳定、更健壮、可用性更高的公共模块。

## 附加功能

在年初的`3.x`大版本升级中，我们进一步集成了前端开发规范中的`commit`规范：

1. 内置了友好的问答式填写`commit`信息的`commitizen`，帮助 FE 同学更轻松、规范地填写`commit`信息
2. 配合`husky`，校验`commit-msg`和`pre-commit`钩子，更好地规范`commit`信息和暂存区的代码，开发更省心

![](https://pic5.zhuanstatic.com/zhuanzh/n_v2dded52be953c44268e0e4c8f72937363.jpg)

## 项目源码
- `commander-tools` 项目地址：https://github.com/zhuanzhuanfe/commander-tools
- `zz-module-tpl` 项目地址：https://github.com/zhuanzhuanfe/zz-module-tpl

## 本月文章预告
预告下，接下来我们会陆续发布转转在微前端、Umi、组件库等基础架构和中台技术相关的实践与思考，欢迎大家关注，期望与大家多多交流

## 文末福利
转发本文并留下评论，我们将抽取第 10 名留言者（依据公众号后台排序），送出转转纪念 T 恤一件，大家转发起来吧~
