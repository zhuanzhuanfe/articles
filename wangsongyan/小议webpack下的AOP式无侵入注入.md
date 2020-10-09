说起来, 面向切面编程(AOP)自从诞生之日起，一直都是计算机科学领域十分热门的话题，但是很奇怪的是，在前端圈子里，探讨AOP的文章似乎并不是多，而且多数拘泥在给出理论，然后实现个片段的定式）难免陷入了形而上学的尴尬境地，本文列举了两个生产环境的实际例子论述webpack和AOP预编译处理的结合，意在抛砖引玉。当然，笔者能力有限，如果有觉得不妥之处，还请大家积极的反馈出来， 共同进步哈。
### 重要的概念

> AOP: 面向切面编程，通过预编译方式和运行期动态代理实现程序功能的统一维护的一种技术。
> 
> Joint point：表示在程序中明确定义的点，典型的包括方法调用，对类成员的访问以及异常处理程序块的执行等等，它自身还可以嵌套其它 joint point。
> 
> Advice：Advice 定义了在 pointcut 里面定义的程序点具体要做的操作，它通过 before、after 和 around 来区别是在每个 joint point 之前、之后还是代替执行的代码。

通过前面的定义，我们可以提炼出一句更简单的定义，利用静/动态的方式使代码块在何时/何地运行。

### 性能统计
项目的背景是一个利用vue+webpack打造的多页面应用
（多入口点），她的结构大概是这个样子的

```
var baseConf = {
  // code here
  entry: {
    index: 'src/index',
    list: 'src/list',
    detail: 'src/detail',
    // and so on ...
  },
  // code here
}
```
然后以index入口点举例，大概代码为src/index/index.js

```
import Vue from 'vue'
import App from './app'
new Vue({
  el: '#app',
  render: h => h(App)
})
```
期望引入一个vue插件，能够自动的监控当前页面的性能，于是，代码看起来像是这个样子
```
import Vue from 'vue'
Vue.use(performance) //性能统计
import App from './app'
new Vue({
  el: '#app',
  render: h => h(App)
})
```
由于这种方式意味着每个入口点均需要进行修改，(实际上这个项目的入口点超过30个，而且随时可能继续增加下去)简直就是一个体力活。所以，让我们用AOP的思想来考虑一下如何处理这个问题

首先观察入口点逻辑

原：引入vue -> 引入app组件 -> 实例化vue组件

新：引入vue -> 应用性能统计组件 -> 引入app组件 -> 实例化vue组件

套用到我们的定义上，可以轻松的得到
- Joint point(何处) 引入vue
- advice(何时) 之后

这样理论上的东西似乎闭着眼睛都可以推论出来，但是如何将这样的步骤替换到每一个入口点就是一个大问题了orz。幸运的是这是一个import，而翻阅webpack的文档恰好有着这样一个神奇的属性--alias

```
 resolve: {
    alias: {
      'vue$': resolve('src/vueHook.js')
    }
```

src/vueHook.js

```
import vue from 'vue/dist/vue.common'

vue.use(performance)

export default vue
```

这样，我们就完成了一个vue的全局钩子模块，我们按照步骤归纳，并且找到注入的位置 ，最后利用替换的方式成功的完成了无侵入式的组件应用



### code spliting
可能上面的例子有点小打小闹的感觉，那么我们换一个案例，再来体验一下这种静态替换式的注入的威力，我们采用官方支持较差的react作为参考(vue在code spliting方面做得真心是超级棒~)


```
import SingleImage from '../../component-modules/magic-single-image/src/index';
import DoubleImage from '../../component-modules/magic-double-image/src/index';
import ThreeImage from '../../component-modules/magic-three-image/src/index';
// many component here


switch (componentName) {
  case 'SingleImage':
    PreviewingComponent = SingleImage;
    break;
  case 'DoubleImage':
    PreviewingComponent = DoubleImage;
    break;
  case 'ThreeImage':
    PreviewingComponent = ThreeImage;
    break;
  // many component here
}

return(<PreviewingComponent></PreviewingComponent>)
```

一段中规中矩的代码，对吧？相信大家已经发现了，在上述的代码里面似乎并不是每个组件都是必须的，那么，基于以上的思考，可以对上面组件进行按需加载处理。
Bundle.jsx
```
import React, { Component, PropTypes } from 'react';

class Bundle extends Component {
  static propTypes = {
    load: PropTypes.func,
    children: PropTypes.func,
  }

  state = {
    mod: null,
  }

  componentWillMount() {
    this.load(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.load !== this.props.load) {
      this.load(nextProps);
    }
  }


  load(props) {
    this.setState({
      mod: null,
    });
    props.load().then((mod) => {
      this.setState({
        // handle both es imports and cjs
        mod: mod.default ? mod.default : mod,
      });
    });
  }

  render() {
    return this.state.mod ? this.props.children(this.state.mod) : null;
  }
}

export default Bundle;

```
以及相应的alias hook
```
export default (
    <Bundle
      load={() => import(/* webpackChunkName: "widget" */
        `../../component-modules/magic-single-image/src/index`
      )}
    >
      {Widget => <Widget {...props} />}
    </Bundle>
  )
```

> 思考，当组件多的时候每一个模块都需要一个人口点吗，可以从webpack.context角度简化这个问题吗？

以上两个例子均是模块引用作为join point来进行注入操作的，而且完成了无侵入式的功能增强，这得益于webpack将js模块作为一等公民。我们拥有着超多的权利完成静态式的注入工作。
本文并没有在技术上涉及太多，还是那句话，抛砖引玉哈~~~