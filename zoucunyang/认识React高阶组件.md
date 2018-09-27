## 认识React高阶组件
---
#### 概况：

#### 什么是高阶组件？
>高阶部件是一种用于复用组件逻辑的高级技术，它并不是 React API的一部分，而是从React 演化而来的一种模式。 具体地说，高阶组件就是一个接收一个组件并返回另外一个新组件的函数！

这是官方文档说的，我没有截全，因为后面的解释会造成误解，但简单讲高阶组件（函数）就好比一个加工厂，同样的，屏幕、cpu、扬声器、键盘按键、外壳、电池，小米手机工厂组装完就是小米手机，魅族手机组装完就是魅族手机，基本材料都是相同的，不同工厂（高阶组件）有不同的实现及产出，当然这个工厂（高阶组件）也可能是针对某个基本材料的处理。
总之产出的结果拥有了输入组件不具备的功能，输入的组件可以是一个组件的实例，也可以是一个组件类，还可以是一个无状态组件的函数。

#### 解决什么问题？

随着项目越来越复杂，开发过程中，多个组件需要某个功能，而且这个功能和页面并没有关系，所以也不能简单的抽取成一个新的组件，但是如果让同样的逻辑在各个组件里各自实现，无疑会导致重复的代码。比如页面有三种弹窗一个有title，一个没有，一个又有右上角关闭按钮，除此之外别无它样，你总不能整好几个弹窗组件吧，这里除了tilte,关闭按钮其他的就可以做为上面说的基本材料。

---
#### 高阶组件总共分为两大类

- 代理方式
  1. 操纵prop
  2. 访问ref（不推荐）
  3. 抽取状态
  4. 包装组件
- 继承方式
  1. 操纵生命周期
  2. 操纵prop

#### 代理方式之 操纵prop

###### 删除prop
```javascript
import React from 'react'
function HocRemoveProp(WrappedComponent) {
  return class WrappingComPonent extends React.Component {
    render() {
      const { user, ...otherProps } = this.props;
      return <WrappedComponent {...otherProps} />
    }
  }
}
export default HocRemoveProp;

```
###### 增加prop
接下来我把简化了写法，把匿名函数去掉，同时换成箭头函数
```javascript
import React from 'react'

const HocAddProp = (WrappedComponent，uid) =>
  class extends React.Component {
    render() {
      const newProps = {
        uid,
      };
      return <WrappedComponent {...this.props}  {...newProps}  />
    }
  }

export default HocAddProp;

```
上面HocRemoveProp高阶组件中，所做的事情和输入组件WrappedComponent功能一样，只是忽略了名为user的prop。也就是说，如果WrappedComponent能处理名为user的prop,这个高阶组件返回的组件则完全无视这个prop。

```javascript
const { user, ...otherProps } = this.props;
```
这是一个利用es6语法技巧，经过上面的语句，otherProps里面就有this.props中所有的字段除了user.
假如我们现在不希望某个组件接收user的prop,那么我们就不要直接使用这个组件，而是把这个组件作为参数传递给HocRemoveProp，然后我们把这个函数的返回结果当作组件来使用
两个高阶组件的使用方法：
const  newComponent = HocRemoveProp(SampleComponent);
const  newComponent = HocAddProp(SampleComponent,'1111111');

也可以利用decorator语法糖这样使用
```javascript
import React, { Component } from 'React';

@HocRemoveProp 
class SampleComponent extends Component {
render() {}
}
export default SampleComponent;
```
#### 代理方式之 抽取状态
将所有的状态的管理交给外面的容器组件，这个模式就是 抽取状态
外面的容器就是这个高阶组件
```javascript
const HocContainer = (WrappedComponent) =>
  class extends React.Component {
    constructor(props) {
      super(props)
      this.state = {
        name: ''
      }
    }
    onNameChange = (event) => {
      this.setState({
        name: event.target.value
      })
    }
    render() {
      const newProps = {
        name: {
          value: this.state.name,
          onChange: this.onNameChange
        }
      }
      return <WrappedComponent {...this.props} {...newProps} />
    }
  }
```
```javascript
@HocContainer
class SampleComponent extends React.Component {
  render() {
    return <input name="name" {...this.props.name}/>
  }
}
```
这样当我们在使用这个已经被包裹的input组件（SampleComponent）时候
它的值就被放在了HocContainer高阶组件中，当很多这样的input组件都用这个HocContainer高阶组件时，那么它们的值都将保存在这个HocContainer高阶组件中

#### 代理方式之 包装组件

```javascript
const HocStyleComponent = (WrappedComponent, style) =>
  class extends React.Component {
    render() {
      return (
        <div style={style}>
          <WrappedComponent {...this.props} {...newProps} />
        </div>
      )
    }
  }
```
这样使用
```javascript
import HocStyleComponent from  './HocStyleComponent';
const colorSytle ={color:'#ff5555'}
const  newComponent = HocStyleComponent(SampleComponent, colorSytle);
```

- 代理方式的生命周期的过程类似于堆栈调用:
didmount 一> HOC didmount 一>(HOCs didmount) 一>(HOCs will unmount) 一>HOC will unmount一>unmount

#### 在说继承方式之前先看一个例子
```javascript
const MyContainer = (WrappedComponent) =>
  class extends WrappedComponent {
    render() {
      return super.render();
    }
  }
```
这个例子很简单，相当于把WrappedComponent组件的render方法，通过super.render()方法吐到了MyContainer 中，可以顺序调用。
- 继承方式的生命周期的过程类似于队列调用:
didmount 一> HOC didmount 一>(HOCs didmount) 一>will unmount一>HOC will unmount一>   (HOCs will unmount)

- 代理方式下WrappedComponent会经历一个完整的生命周期，产生的新组件和参数组件是两个不同的组件，一次渲染，两个组件都会经历各自的生命周期，
- 在继承方式下，产生的新组件和参数组件合二为一，super.render只是生命周期中的函数，变成一个生命周期。

来看下面的例子你就会明白了。
#### 继承方式之 操纵生命周期(渲染劫持)

首先创建一个高阶，在创建一个使用高阶组件的组件，也就是是输入组件，最后我在改变这个输入组件props


```javascript
import * as React from 'react';

const HocComponent = (WrappedComponent) =>
  class MyContainer extends WrappedComponent {
    render() {
      if (this.props.time && this.state.success) {
        return super.render()
      }
      return <div>倒计时完成了...</div>
    }
  }
```
这个高阶组件会直接读取输入组件中的props,state,然后控制了输入组件的render展示
只有在props.time和state.success同时为真的时候才会展示

```javascript
import * as React from 'react';
import HocComponent from './HocComponent'

@HocComponent

class DemoComponent extends React.Component {
  constructor(props) {
    super(props);
   this.state = {
    success: true,
   };
 }
  render() {
    return   <div>我是一个组件</div>
  }
} 
export default DemoComponent;
```
然后调用，递减time数值直到变为0
 <DemoComponent time={time}/>
最后页面的效果就是，当然他不是循环的。先展示”我是一个组件“，我设置了两秒，之后展示”倒计时完成“.
![image](images/demo.gif)
###### 由此可以看出高阶组件也可以控制state
但是最好要限制这样做，可能会让WrappedComponent组件内部状态变得一团糟。建议可以通过重新命名state，以防止混淆。

#### 继承方式之 操纵prop
 ```javascript
const HOCPropsComponent = (WrappedComponent) =>
  class extends WrappedComponent {
    render() {
      const elementsTree = super.render();
      let newProps = {
        color: (elementsTree && elementsTree.type === 'div') ? '#fff' : '#ff5555'
      };

      const props = Object.assign({}, elementsTree.props, newProps)
      const newElementsTree = React.cloneElement(elementsTree, props, elementsTree.props.children)
      return newElementsTree
    }
  }
```
这样就传入了新的props，。
React.cloneElement( element, [props], [...children])
参数：TYPE（ReactElement），[PROPS（object）]，[CHILDREN（ReactElement）]
克隆并返回一个新的 ReactElement ，新返回的元素会保留有旧元素的 props、ref、key，也会集成新的 props。

##### 最后还有一个方式，在传递props上有着强于高阶组件的优势不用关心命名，

 ```javascript
class addProps extends React.Component {
  render() {
    const newProps = 'uid'
    return this.props.children(newProps)
  }
} 
```
使用方式
 ```javascript
<addProps>
{
   (argument) => <div>{argument}</div>
}
</addProps>
```
感觉很方便，但是每次渲染都会重新定义一个新的函数，如果不想的话就不要定义匿名函数，
 ```javascript
showUid(argument) {
    return <div>{argument}</div>
}
```