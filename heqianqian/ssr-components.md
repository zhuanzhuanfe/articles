<!--
 标题：编写支持SSR的通用组件指南
 封面：images/vue-components/cover.png
 翻译作者：贺倩倩
-->
>原文来自：https://blog.lichter.io/posts/the-guide-to-write-universal-ssr-ready-vue-compon?utm_campaign=Vue.js%20News&utm_medium=email&utm_source=Revue%20newsletter

### 介绍
作为Vue开发人员，你可能听说过服务器端渲染（SSR）。 即使你没有使用像Nuxt.js或SSR-plugin这样的框架，你也要知道如何编写在服务器端和客户端都支持的通用组件。
如果你想找到基于SSR的方法或与人共享你的组件，这些知识肯定会让你更轻松！如果作为一个库/插件作者，我认为这些知识是必须掌握的。
猜猜看，它甚至都不难！

### 常见的陷阱

在编写通用组件时，开发人员应该考虑三个非常常见的警告。

1.window, document, and friends - platform-specific APIs
    
在服务器端处理组件时，不会发生动态更新。 这就是为什么在服务器上只执行两个生命周期钩子：beforeCreate和created。 这也意味着，这两个钩子将被调用两次， 一次在服务器上，一次在客户端。但是在服务器端，没有window，document，也没有其他特定于浏览器的API，如fetch。如果你试图在这两个钩子中调用它们，服务器上会抛出一个错误，组件就不能在服务器端渲染了！
这只是服务器端环境下“普通”组件或第三方库的最常见问题。

经验法则：不要在created或beforeCreate中调用特定于浏览器的API。 如果必须这样做，那么至少要执行可用性检查：

```js
export default {
  created() {
    if(typeof window !== 'undefined'){
        window.scroll(/*...*/)
    }
  }
}
```
但在大多数情况下，在beforeMount或mount中调用它们是完全没问题的。 如果必须在服务器和客户端上使用API，比如要发送AJAX请求，请确保双方都可以使用（例如使用isomorphic-fetch或axios）。此外，你有时需要在组件中用到this.$el（$el是组件本身的DOM元素）。在绑定事件侦听器或进行查询选择时，这可以派上用场。

2.Lifecycle hooks and side effects

说到生命周期钩子！你应该考虑另一件事：副作用。函数或表达式在修改本地环境之外的某些状态时具有副作用。比如API调用，I/O操作，设置计时器，添加侦听器等。

为了避免内存泄漏，你不希望在创建和beforeCreate挂钩中产生副作用，因为当这些钩子也从服务器端调用时，你无法关闭那里的连接。相反，这些对象将永远存在并加起来，导致内存泄漏！

经验法则：不要在created或beforeCreate中使用带副作用的代码。

3.No data reactivity(数据隔离性)

这通常不是什么大问题，但你需要知道。服务器端和客户端的值之间数据互不影响。如果你在服务器端操作data，则根本不会在客户端看到这些变更。

### 指令（Directives）

自定义Vue指令经常用于操纵DOM（例如，在滚动时显示元素或使元素固定到特定位置）。我们知道这在服务器端不起作用。那有什么解决办法呢？

嗯，最简单的方法是：不要使用Directives，使用component。我使用VueNextLevelScroll或vue-if-bot等组件做到了这一点，因为它更容易使它们普遍可用，并且它们也可以进行代码分割！使用components抽离，你不会失去任何东西。

如果你确实想使用指令，则可以在服务器端添加相同效果的一个指令。在Nuxt中，可以通过在nuxt.config.js中的this.options.render.bundleRenderer对象中设置指令对象来实现。一个好的（但很复杂的）例子是官方的v-model ssr指令。

注意：请注意以kebab-case（如：make-red而不是makeRed）传递你的指令。否则，他们将无法被识别！这是vue-server-renderer中的错误（有关详细信息，请看官方文档）。

### 总结

使用特定平台的API时要特别小心，尤其是window和document。
请记住，created和beforeCreate是在服务器端和客户端都会执行的。确保写的时候没有副作用，没有window，服务器端数据变更不会表现在客服端。使用指令并不总是最好的抽离方法。但是如果你确实使用它们，请提供服务器端指令
如果你想进一步阅读，我建议你阅读官方的vue-ssr-docs！