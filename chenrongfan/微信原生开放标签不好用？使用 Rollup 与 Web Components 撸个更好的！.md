# 微信原生开放标签不好用？使用 Rollup 与 Web Components 撸个更好的！
![作者](https://pic2.zhuanstatic.com/zhuanzh/99d03805-edb1-4f87-9057-85ff0875fb4b.jpg)

>微信提供了 wx-open-launch-weapp、wx-open-launch-app 两个开放标签，支持在微信公众号页面上跳转到小程序或绑定了的 app，这为 h5 页面引流提供新的手段。比起过往的一些方式，开放标签更为方便直接。特别是 wx-open-launch-weapp，在微信朋友圈对小程序不友好的今天，朋友圈 h5 拉起小程序也算一种曲线救国的手段。但由于一些原因，这些标签在使用的过程中多少有些让人不愉快。

**网页拉起微信小程序**

![](https://pic1.zhuanstatic.com/zhuanzh/a3cb9ba5-fe84-4a72-9fba-fd5ab67088f5.gif?h=400&t=2)
<br />

## 开放标签的那些坑
以 `wx-open-launch-weapp`<sup>[1]</sup> 为例来说
- 样式问题比较严重，如项目中的样式无法影响到 template 中的节点，需要将样式用 style 标签或内联的方式写到 template 中；标签无法自适应宽高，js 监听节点变化后修改步骤繁琐；标签必须有内容才能正常触发等等。
- 后续其他平台跟进的话会有多种逻辑类似的标签存在，有一定的维护管理成本。
- 开发体验不好，使用特殊写法可以使用但不符合正常的编写习惯，如不使用标签嵌套，而是让开放标签直接浮动在内容之上。但这样的方式需要每个使用到的节点都需要注意嵌套关心、样式、事件等等。
- 流行框架的支持需要对修改模版标签。如果同时有多个框架打算用的话会有复用上的烦恼。

在对着网络一顿搜索后发现，现在在网上的各种文章中对于开放标签的解决方案大多集中在使用标签的前置条件跟开发框架的简单结合上，基本上都没有解决样式、复用性、开发体验上的问题。

鉴于有上面的总总问题，为了 ~~保住发际线~~ 保持良好的开发体验，需要尽量填平这些坑。解决开发体验虽然可以通过在所选技术框架的模块化机制封装开放标签，但由于上面提到的这个方案会受限于技术框架，只能在同框架中使用。在一番斟酌后决定使用 `Web Components`<sup>[2]</sup> 来做模块封装，用 `rollup.js`<sup>[4]</sup> 来处理多个环境中使用的问题。

选择 `Web Components`<sup>[2]</sup> 主要有以下的原因：
* 由浏览器支持，不受技术框架限制。
* 生命周期支持。
* 可以有效隔离内外部逻辑。
* 支持正常的标签嵌套写法。
* 轻量。

rollup<sup>[4]</sup> 是一个构建工具，不但支持打包成 `ES Module` 也支持打包成其他解决方案的模块（如 `CommonJS`）。相比起 webpack ，rollup 在做通用模块、类库上更为简单易用。我们使用 rollup 来让模块可以在多个技术环境中使用，支持多种加载模式，并且在开发过程中放心使用各种新特性。

>关于开放标签使用的前置条件请到模块仓库查阅 README.md 中的相关事项或查看官方文档

<br />

**提示** 为了节省篇幅，本文在代码部分做了一些简略用了一些注释替代，具体的代码请到模块仓库查看。仓库地址于文章末尾附上。

<br />

## 基础工程搭建
对于 rollup 工程来说，一般是使用 `rollup.config.js` 文件来配置工程。rollup 会根据返回的配置数量来决定输出什么类型的模块。我们需要支持 `CommonJS` 方案，直接加载方案及 `ES Module` 方案，因此需要配置三个方案配置文件，并根据方案调整配置。

### 主要依赖模块与基础配置字段
rollup 跟其他的构建工具一样，需要定义输入与输出，并通过各种 plugin 来实现各种功能的支持。在我们这个场景，入口文件都是同一个，通过不同的配置让 rollup 输出成不同的模式。
- `input` 入口文件配置，可以是一个或多个文件。
- `output` 输出配置，这里的配置决定了最后会输出什么内容。主要是由输出配置中的 `format` 字段决定。
- `plugins` 类型配置中用到的插件。

```typescript
const isProduction = process.env.NODE_ENV === "production";
const cwd = __dirname;

// 入口文件
const input = join(cwd, "src/index.ts");

// 基本的配置结构
const baseConfig = {
    // 入口配置
    input
    // 输出配置
    ,"output": [
        //...
    ]
    // 插件配置
    ,"plugins": [
        //...
    ]
}

```

这里需要注意的是如果有依赖外部模块，如工具库那种可能包含多个未使用函数的模块，使用 `external` 配置去加载的时候要注意确认，防止把整个库都给打包进来。有必要的时候应使用按需支持加载的 `plugin` 来处理，保证 `Tree-Shaking` 能正常生效。

### CommonJS 与 UMD
```typescript
const baseConfig = {
    input
    ,"output": [
        {
            "file": join(cwd, "dist/index.js")
            // 指定输出格式为 CommonJS
            , "format": "cjs"
            , "sourcemap": true
            , "exports": "named"
        }
    ]
    ,"plugins": [
        resolve({
            //...
        })
        , cjs()
        , babel({
            //...
        })
        , typescript({
            // ...
        })
        , buble({
            //..
        })
    ]
}
```

UMD 的配置与 `CommonJS` 大同小异。但是由于 UMD 可能会在浏览器中直接使用，所以所以我们在发布的时候启用压缩。

```typescript
const umdConfig = {
    input
    , "output": [
        {
            "file": join(cwd, "dist/index.umd.js")
            // 指定为 UMD 格式
            , "format": "umd"
            , "sourcemap": false
            , "exports": "named"
            , "name": "xLaunch"
        }
    ]
    , "plugins": [
        ...baseConfig.plugins
        , isProduction && terser()
    ]
}
```
### ES Module
```typescript
const esmConfig = {
    input
    ,"output": {
        "sourcemap": true
        // 指定为 ES Module
        , "format": "es"
        , "file": join(cwd, "dist/index.esm.js")
    }
    , "plugins": [
        babel({
            //...
        })
        , alias({
            //...
        })
        , typescript()
    ]
}
```
### 导出配置
最后只需要将配置文件放在数组中导出给 rollup 使用。
```typescript
module.exports = [baseConfig, umdConfig, esmConfig];
```

### 配置模块 package.json 中的相关字段
由于我们同时支持了多种模式，所以需要对 `package.json` 中的相关字段进行配置没，方便我们的开发以及使用者的使用。主要有模块入口 `main`、`module`，Typescript 相关 `types`，开发相关 `scripts`，发布相关 `files`。具体字段定义可以查看相关官方相关文档<sup>[6]</sup><sup>[7]</sup>。

```json
{
    "main": "dist/index.js",
    "module": "dist/index.esm.js",
    "types": "dist/index.d.ts",
    "scripts": {
        "build": "cross-env NODE_ENV=production rollup -c",
        "dev": "rollup -c -w"
    },
    "files": [
        "dist"
    ]
}
```

<br />

## 模块开发

### 一个基本的 Web Components
在处理好基础的开发环境之后我们就可以进入 `Web Components` 的开发。开发一个 Web Components Demo 需要的核心代码很少：实现一个继承于 `HTMLElement` 的 `class`，然后使用 `customElements.define` 注册它。

```typescript
/**H5 唤起模块 */
class XLaunch extends HTMLElement {
    constructor() {
        super();
    }

    /**模块根节点 */
    private root: ShadowRoot;

    /**模块节点加载 */
    connectedCallback(){
        this.root = this.attachShadow({
            "mode": "open"
        });

        this.root.innerHTML = "<div>Hi there~</div>";
    }
}

/**注册模块名称 */
customElements.define("x-launch", XLaunch);
```
运行 `npm run dev`，在项目中把我们编译出来的的模块引入后即可在页面上如普通标签般直接使用。如 Vue 中:

```html
<template>
    <x-launch></x-launch>
</template>

<script>
import "your_web_components_project_dir/dist/index.esm";
export default {
    data() {
        return {};
    }
}
</script>
```
可以看到标签的位置出现了 `Hi there~` 字样。

在这里使用 `shadow DOM` 将模块内部的样式于结构与外部隔离，内外不会互相影响，这样就可以放心的使用各种结构与样式来实现模块的布局。

我们后续将继续在这个继承代码上实现我们的各种功能。

### 内部结构的处理
由于开放标签在显示上的支持比较差，如：
- 外部样式无法影响到模版标签内部，只能在标签内到内链中定义或者行内样式。
- 不支持 rem。
- 不会继承样式。
- 内部结构需要定义在模版标签内部。

这些问题还是比较影响功能实现与开发的。特别在现在大多数移动端应用都做了响应式的今天，那几个样式问题是在是让人难受。

好在 `Web Components` 支持 `slot`，结合 `shadow DOM` 的隔离特性我们可以让模块的内部形成一个双层结构，使用定位让开放标签永远处于最顶层且占满整个标签。
```html
<style>
/*定义整个标签的样式*/
:host {
    /*...*/
}
/*插槽样式*/
.X-launch-slot {
    /*...*/
}
/*开放标签样式*/
.X-launch-btn {
    /*...*/
}
</style>
<div class="X-launch">
    <div class="X-launch-btn">
        <wx-open-launch-weapp style="width:100%;height:100%;display:block;">
        <template>
            <div></div>
        </template>
        </wx-open-launch-weapp>
    </div>
    <div class="X-launch-slot">
        <slot></slot>
    </div>
</div>
```

我们把整个结构字符串作为模块根节点的 `innerHTML`，这样标签就具备了初步的嵌套特性，由于 `slot` 不属于 `shadow DOM` 内部，所以我们项目中的样式也可以正常影响到我们开放标签嵌套的标签。

```html
<style>
.testWc {
    width: 200px;
    height: 67px;
    display: inline-block;
}
.testWc img { width: 100%; }
</style>
<x-launch class="testWc">
    <img src="./imgs/btn.png" />
</x-launch>
```

但是这样子还是不够，由于开放标签无法自适应宽高而且必须实际的宽高或者内容才能正常触发（点击），所以我们需要动态处理一下标签的尺寸。同时由于我们希望这个模块可以在未来具备一定的扩展性，所以我们需要根据条件来生成内部的结构。

- 定义一个标签映射对象，方便外部使用与后续的扩展。
    ```typescript
    /**支持的平台对应的标签 */
    const LaunchType = {
        /**微信拉起小程序 */
        "wechat": "wx-open-launch-weapp"
        /**微信拉起 app */
        , "wechatapp": "wx-open-launch-app"
    };
    ```
- 鉴于整个结构并不是很复杂，我们可以使用模版字符串<sup>[5]</sup>来生成我们的模版。
    ```typescript
    /**
    * 模版处理函数
    * @param strs 模版静态字符串段落数组
    * @param rest 模版插值数组
    */
    function getTypeTpl(strs, ...rest:string[]) {
        return strs.reduce((tpl, str, index) => {
            tpl += str;

            switch (rest[index]) {
                // cases
            }
            return tpl;
        }, "");
    }

    /**
    * 获取目标平台的模版
    * @param type 模版类型
    */
    function getTplStr(type: string = "wechat") {
        const typeProps = `${type}-props`;
        return getTypeTpl`<style>
        // ... 模板
        </div>`;
    }
    ```
- 在节点挂载的时候获取标签的尺寸并替换模版字符串里被花括号包裹的内容，使得开放标签能正确渲染。在挂载的时候通过直接拿自身的尺寸的方式也比其他的方案来的要更简捷，同时通过 `getAttribute` 与 `getBoundingClientRect` 获取节点上我们需要的属性来生成最终的 html。
    ```typescript
    connectedCallback() {
        this.root = this.attachShadow({
            "mode": "open"
        });

        // 标签类型
        const type = this.getAttribute("type");
        // 是否开启 debug
        this.isDebug = this.hasAttribute("debug");

        // ... 其他属性

        // 容器实际的宽高
        const { width, height } = this.getBoundingClientRect();
        const style = `width:${width}px;height:${height}px;display:block;${this.isDebug ? "background:#e92a2a54;" : ""}`;

        // labelReplace 为替换花括号内容的处理函数
        this.root.innerHTML = labelReplace(
            getTplStr(type)
            , {
                style
                // ... 其他属性
                , "id": this.xid
            }
        );
    }
    ```
### 标签事件
模块开发至此在渲染上已经没有太大问题，剩下的事情就是需要监听开放标签的相关事件，然后转发给使用者使用（`dispatchEvent`<sup>[8]</sup> 与 `CustomEvent`<sup>[3]</sup>），并在节点被移除时主动解除节点的事件监听。

```typescript
class XLaunch extends HTMLElement {
    // ...

    /**平台开放标签对象 */
    private openNode: Element;

    /**
     * 触发一个事件
     * @param type   事件类型
     * @param detail 事件数据
     */
    private bubbling(type: string, detail: any) {
        this.dispatchEvent(
            new CustomEvent(
                type
                , {
                    "bubbles": false
                    , "composed": false
                    , detail
                }
            )
        );
    }

    /**平台开放标签触发响应函数 */
    private onLaunch = (e) => {
        this.bubbling("launch", e.detail);
    }

    // ... 其他事件的响应函数

    /**模块节点加载 */
    connectedCallback() {
        // ...
        this.openNode = this.root.querySelector(`#X_LAUNCH_COM_${this.xid}`);

        if (this.openNode) {
            this.openNode.addEventListener("launch", this.onLaunch);
            // ... 其他事件
        }

    }

    /**模块节点卸载 */
    disconnectedCallback() {
        if (this.openNode) {
            // 移除监听
            this.openNode.removeEventListener("launch", this.onLaunch);
            // 其他事件及节点
        }
    }
}
```

<br/>
<br/>

----

<br />

至此我们就可以在我们的项目中比较正常的使用开放标签这个功能了，标签内嵌套的内容可以按照正常的开发习惯进行开发，不用再为样式、目录、嵌套关系等等问题的困扰。在不同框架中使用也能保持较为一致的体验与效果。

有了这样的一个模块作基础，后续有不同平台跟进我们也可以在整个模块的基础上做支持，也可对不同的地方做针对性的优化，或者给这个功能提供一些便捷的辅助函数等。

```html
<template>
    <x-launch
        type="wechat"
        path="/pages/custom/custom-page?id=1234"
        username="gh_2333333333333"
        class="testWc"
        @launch="onlaunch"
    >
        <img src="./imgs/btn.png" />
    </x-launch>
</template>

<script>
import "your_web_component_project_dir/dist/index.esm";
export default {
    data() {
        return {};
    }
    ,"methods": {
        onlaunch(e) {
            console.log(e);
        }
    }
}
</script>
```

最后，发布成 npm 包，方便其他人使用。

```shell
npm run build
#... 提交代码
npm publish
```

<br />

## 一些扩展
- 如果不用 `Web Components`，是否有什么方法可以让某一个模块在不同的技术栈中正常使用？
- 模块已发布到 [npm](https://www.npmjs.com/package/@x-drive/x-launch)，欢迎大家使用。
- 完整的代码在 >> [模块仓库](https://github.com/x-dirve/launch)
- 唤起 app 可以参看前面发布的 [[唤起App在转转的实践](https://mp.weixin.qq.com/s?__biz=MzU0OTExNzYwNg==&mid=2247486327&idx=1&sn=a4ed8b1b012638a60bd4065a6e5ee309&lang=zh_CN#rd)]。

<br />

## 相关文档
1. [开放标签说明文档](https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/Wechat_Open_Tag.html)
1. [MDN Web Components](https://developer.mozilla.org/zh-CN/docs/Web/Web_Components)
1. [MDN CustomEvent](https://developer.mozilla.org/zh-CN/docs/Web/API/CustomEvent/CustomEvent)
1. [rollup.js 官网](https://rollupjs.org/guide/en/)
1. [MDN 模板字符串](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Template_literals)
1. [NPM package.json](https://docs.npmjs.com/cli/v6/configuring-npm/package-json)
1. [rollup pkg.module](https://github.com/rollup/rollup/wiki/pkg.module)
1. [MDN EventTarget.dispatchEvent](https://developer.mozilla.org/zh-CN/docs/Web/API/EventTarget/dispatchEvent)