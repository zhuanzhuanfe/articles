# 带你快速了解React Hooks

> 「福利」 ✿✿ ヽ(°▽°)ノ ✿：文章最后有抽奖，**转转纪念T恤**，走过路过不要错过哦

## 什么是Hooks
Hook 是 React 16.8 的新增特性。

Hooks本质上就是一类特殊的函数，它们可以为你的函数型组件（function component）注入一些特殊的功能，让您在不编写类的情况下使用 state(状态) 和其他 React 特性。


## 为什么要使用 React Hooks
- **状态逻辑难以复用：** 业务变得复杂之后，组件之间共享状态变得频繁，组件复用和状态逻辑管理就变得十分复杂。使用redux也会加大项目的复杂度和体积。
- **组成复杂难以维护：** 复杂的组件中有各种难以管理的状态和副作用，在同一个生命周期中你可能会因为不同情况写出各种不相关的逻辑，但实际上我们通常希望一个函数只做一件事情。
- **类的this指向性问题：** 我们用class来创建react组件时，为了保证this的指向正确，我们要经常写这样的代码：`const that = this`，或者是`this.handleClick = this.handleClick.bind(this)>`；一旦this使用错误，各种bug就随之而来。

为了解决这些麻烦，hooks 允许我们使用简单的特殊函数实现class的各种功能。

## useState
在 React 组件中，我们经常要使用 state 来进行数据的实时响应，根据 state 的变化重新渲染组件更新视图。

因为纯函数不能有状态，在 hooks 中，`useState`就是一个用于为函数组件引入状态（state）的状态钩子。

``` js
const [state, setState] = useState(initialState);
```

`useState` 的唯一参数是状态初始值（initial state），它返回了一个数组，这个数组的第[0]项是当前当前的状态值，第[1]项是可以改变状态值的方法函数。

### 延迟初始化
initialState 参数是初始渲染期间使用的状态。 在随后的渲染中，它会被忽略了。 如果初始状态是高开销的计算结果，则可以改为提供函数，**该函数仅在初始渲染时执行**：

``` js
function Counter({initialCount = 0}) {
  // 初始值为1
  const [count, setCount] = useState(() => initialCount + 1);
  return (
    <>
      Count: {count}
      <button onClick={() => setCount(0)}>Reset</button>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(prevCount => prevCount - 1)}>-</button>
    </>
  );
}
```

### 函数式更新对比普通更新
如果需要使用前一时刻的 state(状态) 计算新 state(状态) ，则可以将 **函数** 传递给 setState 。**该函数将接收先前 state 的值，并返回更新的 state**。

那么`setCount(newCount)`和`setCount(preCount => newCount)`有什么区别呢，我们写个例子来看下：
```js
function Counter() {
  const [count, setCount] = useState(0);
  function add() {
    setTimeout(() => {
      setCount(count + 1);
    }, 3000);
  }
  function preAdd(){
    setTimeout(() => {
      // 根据前一时刻的 count 设置新的 count
      setCount(count => count + 1);
    }, 3000);
  }
  // 监听 count 变化
  useEffect(() => {
    console.log(count)
  }, [count])
  return (
    <>
      Count: {count}
      <button onClick={add}>add</button>
      <button onClick={preAdd}>preAdd</button>
    </>
  );
}
```

![简单计数器](https://pic5.zhuanstatic.com/zhuanzh/e0604fa7-8c57-48fe-8c93-113cba3dc417.png)

我们首先快速点击add按钮三次，三秒后count变为1；然后快速点击preAdd三下，三秒后依次出现了2、3、4。测试结果如下：

![三次add三次preAdd](https://pic1.zhuanstatic.com/zhuanzh/8d777acd-ad13-4697-902a-09893ce28e8a.gif)

为什么`setCount(count + 1)`好像只执行了一次呢，因为**每次更新都是独立的闭包，当点击更新状态的时候，函数组件都会重新被调用。** 快速点击时，当前count为0，即每次点击传入的值都是相同的，那么得到的结果也是相同的，最后count变为1后不再变化。

为什么`setCount(count => count + 1)`好像能执行三次呢，因为当传入一个函数时，**回调函数将接收当前的 state，并返回一个更新后的值。** 三秒后，第一次`setCount`获取到最新的count为1，然后执行函数将count变为2，接着第二次获取到当前count为2，执行函数将count变为了3。每次获取到的最新count不一样，最后结果自然也不同。

那么进行第二次实验，我先快速点击preAdd三下，然后接着快速点击add按钮三次，三秒后结果会怎么样呢。根据以上结论猜测，preAdd是根据最新值，所以count依次变为1、2、3，然后add是传入的当前count为0，最后变为1。最后结果应该是1、2、3、1，测试结果正确：
![三次preeAdd三次add](https://pic5.zhuanstatic.com/zhuanzh/fa171851-138f-40e3-838b-7c2f4d2cde1e.gif)



## useReducer
```js
const [state, dispatch] = useReducer(reducer, initialState, initialFunc);
```

useReducer 可以接受三个参数，第一个参数接收一个形如`(state, action) => newState` 的 reducer纯函数，使用时可以通过`dispatch(action)`来修改相关逻辑。

第二个参数是 state 的初始值，它返回当前 state 以及发送 action 的 dispatch 函数。

你可以选择惰性地创建初始 state，为此，需要将 init 函数作为 useReducer 的第三个参数传入，这样初始 state 将被设置为 init(initialArg)。

### 对比useState的优势
useReducer是React提供的一个高级Hook，它不像useEffect、useState等hook一样必须，那么使用它有什么好处呢？如果使用useReducer改写一下计数器例子:

```js
//官方示例
function countReducer(state, action) {
  switch (action.type) {
    case 'add':
      return state + 1;
    case 'minus':
      return state - 1;
    default:
      return state;
  }
}
```

```js
function initFunc(initialCount) {
  return initialCount + 1;
}
```

```js
function Counter({initialCount = 0}) {
  const [count, dispatch] = useReducer(countReducer, initialCount, initFunc);
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => { dispatch({ type: 'add' }); }} >
        点击+1
      </button>
      <button onClick={() => { dispatch({ type: 'minus' }); }} >
        点击-1
      </button>
    </div>
  );
}
```

对比useState可知，看起来我们的代码好像变得复杂了，但实际应用到复杂的项目环境中，将状态管理和代码逻辑放到一起管理，使我们的代码具有更好的可读性、可维护性和可预测性。


## useEffect
```js
useEffect(create, deps);
```

useEffect()用来引入具有副作用的操作，最常见的就是向服务器请求数据。该 Hook 接收一个函数，**该函数会在组件渲染到屏幕之后才执行**。

和 react 类的生命周期相比，useEffect Hook 可以当做 componentDidMount，componentDidUpdate 和 componentWillUnmount 的组合。默认情况下，react 首次渲染和之后的每次渲染都会调用一遍传给 useEffect 的函数。

### useEffect 的性能问题
因为 React 首次渲染和之后的每次渲染都会调用一遍传给 useEffect 的函数，所以大多数情况下很有可能会产生性能问题。

为了解决这个问题，可以将数组作为可选的第二个参数传递给 useEffect。数组中可选择性写 state 中的数据，代表只有当数组中的 state 发生变化是才执行函数内的语句，以此可以**使用多个`useEffect`分离函数关注点**。如果是个空数组，代表只执行一次，类似于 componentDidUpdata。


### 解绑副作用
在 React 类中，经常会需要在组件卸载时做一些事情，例如移除监听事件等。
在 class 组件中，我们可以在 componentWillUnmount 这个生命周期中做这些事情，而在 hooks 中，我们可以通过 useEffect 第一个函数中 return 一个函数来实现相同效果。以下是一个简单的清除定时器例子：
```js
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount(count => count + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      Count: {count}
    </>
  );
}
```


## useLayoutEffect
```js
useLayoutEffect(create, deps);
```
它和 useEffect 的结构相同，区别只是调用时机不同。

- **useEffect 在渲染时是异步执行，要等到浏览器将所有变化渲染到屏幕后才会被执行。**
- **useLayoutEffect 会在 浏览器 layout 之后，painting 之前执行，**
- 可以使用useLayoutEffect来读取 DOM 布局并同步触发重渲染
- 尽可能使用标准的 useEffect 以避免阻塞视图更新

### useEffect 和 useLayoutEffect 的差别
为了更清晰的对比useEffect和useLayoutEffect，我们写个demo来看看两种hook的效果：

```js
function Counter() {
  function delay(ms){
    const startTime = new Date().getTime();
    while (new Date().getTime() < startTime + ms);
  }
  const [count, setCount] = useState(0);

  // useLayoutEffect(() => {
  //   console.log('useLayoutEffect:', count)
  //   return () => console.log('useLayoutEffectDestory:', count)
  // }, [count]);

  useEffect(() => {
    console.log('useEffect:', count)
    // 延长一秒看效果
    if(count === 5) {
      delay(1000)
      setCount(count => count + 1)
    }
    return () => console.log('useEffectDestory:', count)
  }, [count]);

  return (
    <>
      Count: {count}
      <button onClick={() => setCount(5)}>set</button>
    </>
  );
}
```
首先我们先看看useEffect的执行效果：

![useEffect效果](https://pic2.zhuanstatic.com/zhuanzh/eacd0df4-bb1a-4212-9ac4-3f2dae2f5aef.gif)
useEffect和useEffectDestroy的执行顺序也很好理解，先执行了useEffectDestroy销毁了0，然后在useEffect修改count为5，这时，count可见已经变成了5，然后销毁5，设置count为6，然后渲染6。

整个渲染过程可以很明显的看到count 0->5->6 的过程，如果在实际项目中，这种情况会出现闪屏效果，很影响用户体验。因为**useEffect 在渲染时是异步执行，并且要等到浏览器将所有变化渲染到屏幕后才会被执行**，所以，我们尽量不要在useEffect里面进行DOM操作。

再将setCount操作放到useLayoutEffect里的执行看看效果：

![useLayoutEffect效果](https://pic2.zhuanstatic.com/zhuanzh/ab96e57f-7843-47e6-a158-827b318f6990.gif)
useLayoutEffect和useLayoutEffectDestroy的执行顺序和useEffect一样，**都是在下一次操作之前先销毁**，但是整个渲染过程和useEffect明显不一样。虽然在打印的useLayoutEffect中有明显停顿，但在渲染过程只能看到count 0->6 的过程，**这是因为 useLayoutEffect 的同步特性，会在浏览器渲染之前同步更新 DOM 数据，哪怕是多次的操作，也会在渲染前一次性处理完，再交给浏览器绘制。这样不会导致闪屏现象发生，但是会阻塞视图的更新。**。

最后，我们同时看看两个setCout分别在两个hook的执行时机;

在useEffect执行效果：
![useEffect混合效果](https://pic2.zhuanstatic.com/zhuanzh/483f028e-2e32-4965-992d-ce6341f392d3.gif)

在useLayoutEffect执行效果：
![useLayoutEffect混合效果](https://pic4.zhuanstatic.com/zhuanzh/f6bca6f4-f3e8-4d20-88f3-dc6b390bfce0.gif)

我们可以发现无论在哪儿执行setCount，hooks的先后顺序都不变，始终是先useLayoutEffect 销毁，然后useLayoutEffect执行，再然后才是useEffect销毁，useEffect执行。但是页面渲染的不同和打印时的明显卡顿，我们知道hooks的执行时机应该是`useLayoutEffectDestory -> useLayoutEffect -> 渲染 -> useEffectDestory -> useEffect`。


## useMemo
```js
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
```
> 把“创建”函数和依赖项数组作为参数传入 useMemo，它仅会在某个依赖项改变时才重新计算 memoized 值。这种优化有助于避免在每次渲染时都进行高开销的计算。

### useMemo 和 useEffect 的区别
useMemo看起来和useEffect很像，但是如果你想在useMemo里面setCount或则其他修改了DOM的操作，那你可能会遇到一些问题。因为**传入 useMemo 的函数会在渲染期间执行**，你可能看不到想要的效果，所以请不要在这个函数内部执行与渲染无关的操作。

useMemo 还返回一个 memoized 值，之后仅会在某个依赖项改变时才重新计算 memoized 值。这种优化有助于避免在每次渲染时都进行高开销的计算，具体应用看以下例子：
```js
function Counter() {
  const [count, setCount] = useState(1);
  const [val, setValue] = useState('');

  const getNum = () => {
    console.log('compute');
    let sum = 0;
    for (let i = 0; i < count * 100; i++) {
      sum += i;
    }
    return sum;
  }

  const memoNum = useMemo(() => getNum(), [count])

  return <div>
    <h4>总和：{getNum()} {memoNum}</h4>
    <div>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <input value={val} onChange={event => setValue(event.target.value)}/>
    </div>
  </div>;
}
```

useMemo效果：
![useMemo效果](https://pic4.zhuanstatic.com/zhuanzh/344321e2-5d38-40dd-a7d2-075fb3ab3bb8.gif)

正常情况下，当你在input框输入时，因为修改了val，所以页面会重新渲染，那么就需要重新计算getNum，但使用useMemo后，因为依赖的count 没变，则memoNum不会重新计算。


## useCallback

```js
const memoizedCallback = useCallback(
  () => {
    doSomething(a, b);
  },
  [a, b],
);
```
> 返回一个 memoized 回调函数。

> 把内联回调函数及依赖项数组作为参数传入 useCallback，它将返回该回调函数的 memoized 版本，该回调函数仅在某个依赖项改变时才会更新。当你把回调函数传递给经过优化的并使用引用相等性去避免非必要渲染（例如 shouldComponentUpdate）的子组件时，它将非常有用。

> `useCallback(fn, deps)`相当于 `useMemo(() => fn, deps)`。


## useRef

```js
const refContainer = useRef(initialValue);
```
- 类组件、React 元素用 React.createRef，函数组件使用 useRef
- useRef 返回一个可变的 ref 对象，其 current 属性被初始化为传入的参数（initialValue
- **useRef 返回的 ref 对象在组件的整个生命周期内保持不变，也就是说每次重新渲染函数组件时，返回的ref 对象都是同一个（使用 React.createRef ，每次重新渲染组件都会重新创建 ref）**

```js
// 官网例子
function TextInputWithFocusButton() {
  const inputEl = useRef(null);
  const onButtonClick = () => {
    // `current` 指向已挂载到 DOM 上的文本输入元素
    inputEl.current.focus();
  };
  return (
    <>
      <input ref={inputEl} type="text" />
      <button onClick={onButtonClick}>Focus the input</button>
    </>
  );
}
```

## useImperativeHandle

```js
useImperativeHandle(ref, createHandle, [deps])
```
useImperativeHandle 可以让你在使用 ref 时自定义暴露给父组件的实例值。

如下，渲染 `<FancyInput ref={inputRef} />` 的父组件可以调用 `inputRef.current.focus()`：
```js
// 官网例子
function FancyInput(props, ref) {
  const inputRef = useRef();
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current.focus();
    }
  }));
  return <input ref={inputRef} ... />;
}
FancyInput = forwardRef(FancyInput);
```


## useContext

在 hooks 中，组件都是函数，所以我们可以通过参数的方式进行传值，但是有时候我们也会遇到兄弟组件和爷孙组件之间的传值，这时候通过函数参数传值就不太方便了。hooks 提供了 useContext（共享状态钩子）来解决这个问题。

useContext 接受一个 context 对象（从 React.createContext 返回的值）并返回当前 context 值，由最近 context 提供程序给 context 。

当组件上层最近的 `<Context.Provider>` 更新时，该 Hook 会触发重渲染，并使用最新传递给 Context provider 的 context value 值。

在 hooks 中使用 content，需要使用 createContext，useContext：

```js
// context.js  新建一个context
import { createContext } from 'react';
const AppContext = React.createContext({});
```

```js
// HooksContext.jsx  父组件，提供context
import React, { useState } from 'react';
import AppContext from './context';

function HooksContext() {
  const [count, setCnt] = useState(0);
  const [age, setAge] = useState(16);

  return (
    <div>
      <p>年龄{age}</p>
      <p>你点击了{count}次</p>
      <AppContext.Provider value={{ count, age }}>
        <div className="App">
          <Navbar />
          <Messages />
        </div>
      </AppContext.Provider>
    </div>
  );
}
```

```js
// 子组件，使用context
import React, { useContext } from 'react';
import AppContext from './context';

const Navbar = () => {
  const { count, age } = useContext(AppContext);
  return (
    <div className="navbar">
      <p>使用context</p>
      <p>年龄{age}</p>
      <p>点击了{count}次</p>
    </div>
  );
}
```


## 构建自定义 Hook
当我们想要在两个 JavaScript 函数之间共享逻辑时，我们会将共享逻辑提取到第三个函数。 组件和 Hook 都是函数，所以通过这种办法可以调用其他 Hook。

例如，我们可以把判断朋友是否在线的功能抽出来，新建一个 useFriendStatus 的 hook 专门用来判断某个 id 是否在线：

```js
// 官网例子
import { useState, useEffect } from 'react';

function useFriendStatus(friendID) {
  const [isOnline, setIsOnline] = useState(null);

  function handleStatusChange(status) {
    setIsOnline(status.isOnline);
  }

  useEffect(() => {
    ChatAPI.subscribeToFriendStatus(friendID, handleStatusChange);
    return () => {
      ChatAPI.unsubscribeFromFriendStatus(friendID, handleStatusChange);
    };
  });

  return isOnline;
}
```

这时候我们就可以在需要 FriendStatus 组件的地方为所欲为、为所欲为：

```js
function FriendStatus(props) {
  const isOnline = useFriendStatus(props.friend.id);

  if (isOnline === null) {
    return 'Loading...';
  }
  return isOnline ? 'Online' : 'Offline';
}
```

```js
function FriendListItem(props) {
  const isOnline = useFriendStatus(props.friend.id);

  return (
    <li style={{ color: isOnline ? 'green' : 'black' }}>
      {props.friend.name}
    </li>
  );
}
```


## 简单总结
| hook       | 功能                    |
| :---------: | :-------------------: |
| useState |设置和改变state，代替原来的state和setState |
| useReducer |代替原来redux里的reducer，方便管理状态逻辑|
| useEffect|引入具有副作用的操作，类比原来的生命周期|
| useLayoutEffect |与 useEffect 作用相同，但它会同步调用 effect|
| useMemo |可根据状态变化控制方法执行，优化无用渲染，提高性能|
| useCallback |类似useMemo，useMemo优化传值，usecallback优化传入的方法|
| useContext |上下文爷孙组件及更深层组件传值|
| useRef |返回一个可变的 ref 对象|
| useImperativeHandle |可以让你在使用 ref 时自定义暴露给父组件的实例值|

## 参考文章
[React Hooks](https://zh-hans.reactjs.org/docs/hooks-intro.html)

[React Hooks 入门教程 - 阮一峰](http://www.ruanyifeng.com/blog/2019/09/react-hooks.html)

[React Hooks 详解 【近 1W 字】+ 项目实战](https://juejin.im/post/6844903985338400782?utm_source=gold_browser_extension)

## 文末福利
转发本文并留下评论，我们将抽取第 10 名留言者（依据公众号后台排序），送出转转纪念 T 恤一件，大家转发起来吧~

<div algin="center">
  <img src="https://pic4.zhuanstatic.com/zhuanzh/9d1732f7-6f1c-4291-b2a0-45c1778cba0b.png" alt="奖品">
</div>
