## 说说React组件的State
React的核心思想是组件化的思想，应用由组件搭建而成， 而组件中最重要的概念是State（状态）。
### 正确定义State
React把组件看成一个状态机。通过与用户的交互，实现不同状态，然后渲染UI，让用户界面和数据保持一致。组件的任何UI改变，都可以从State的变化中反映出来；State中的所有状态都用于反映UI的变化，不应有多余状态。

那么什么样的变量应该做为组件的State呢：
1. 可以通过props从父组件中获取的变量不应该做为组件State。
2. 这个变量如果在组件的整个生命周期中都保持不变就不应该作为组件State。
3. 通过其他状态（State）或者属性(Props)计算得到的变量不应该作为组件State。
4. 没有在组件的render方法中使用的变量不用于UI的渲染，那么这个变量不应该作为组件的State  。这种情况下，这个变量更适合定义为组件的一个普通属性。
### React中的immutability
React官方建议把State当做是不可变对象，State中包含的所有状态都应该是不可变对象，当State中的某个状态发生变化，我们应该重新创建这个状态对象，而不是直接修改原来的状态。State根据状态类型可以分为三种。
1. 数字，字符串，布尔值，null，undefined这五种不可变类型。

因为其本身就是不可变的，如果要修改状态的话，直接赋新值就可以，例如：
 ```
 this.setState({
   num: 1,
   string: 'hello',
   ready: true
 });
 ```
 2、数组类型
 
 js中数组类型为可变类型。假如有一个state是数组类型，例如students。修改students的状态应该保证不会修改原来的状态，
 例如新增一个数组元素，应使用数组的concat方法或ES6的数组扩展语法。
 ```
   let students = this.state.students;
   this.setState({
     students: students.concat(['xiaoming'])
   });
   
   //或者
   this.setState(preState => ({
     students: [ ...preState.books, 'xiaogang']
   });
 ```
 从数组中截取部分作为新状态时，应使用slice方法;当从数组中过滤部分元素后，作为新状态时，使用filter方法。不应该使用push、pop、shift、unshift、splice等方法修改数组类型的状态，因为这些方法都是在原数组的基础上修改的。应当使用不会修改原数组而返回一个新数组的方法，例如concat、slice、filter等。
 3. 普通对象
  
 对象也是可变类型，修改对象类型的状态时，应该保证不会修改原来的状态。可以使用ES6的Object.assign方法或者对象扩展语法。
```
//Object.assign方法
this.setState(preState => ({
  school: Object.assign({}, preState.school, {classNum: 10})
}));

//对象扩展语法
let school = this.state.school;
this.setState({
  school: { ...school, { classNum: 10 } }
})
```
### 不同方式创建的组件中的State
1. 无状态组件（Stateless Functional Component)

这种组件自身没有状态，不需要管理state状态，所有数据都是从props传入。
```
const Teacher = ({
  name,
  age
}) => {
  return (
    <div>Teacher {name} is {age} years old.</div>
  )
}
```
相同的输入（props）必然有相同的输出，因此这种组件可以写成无副作用的纯函数，且适合函数式编程（函数的compose，curring等组合方式）
2. 纯组件（PureComponent)

我们知道，当组件的props或者state发生变化的时候React会对组件当前的Props和State分别与nextProps和nextState进行比较，当发现变化时，就会对当前组件以及子组件进行重新渲染，否则就不渲染。有时候我们会使用shouldUpdateComponent来避免不必要的渲染。当然有时候这种简单的判断，显得有些多余和样板化，于是react就提供了PureComponent来自动帮我们完成这件事，简化了我们的代码，提高了性能。例如：
```
class CounterButton extends React.pureComponent {
  constructor(props) {
    super(props)
    this.state = { count: 1 };
  }
  render() {
    return (
      <button 
        color={this.props.color}
        onClick={() => this.setState(state = > ({count: state.count + 1}))}
      >
       Count: {this.state.coount}
      </button>
    )
  }
}
```
在上例中，虽然没有添加shouldUpdateComponent代码，但是react自动完成了props和state的比较，当props和state没有发生变化时不会对组件重新渲染。但是PureComponent的自动为我们添加的shouldComponentUpate函数，只是对props和state进行浅比较(shadowcomparison)，当props或者state本身是嵌套对象或数组等时，浅比较并不能得到预期的结果，这会导致实际的props和state发生了变化，但组件却没有更新的问题。

**浅比较：比较 Object.keys(state | props) 的长度是否一致，每一个 key 是否两者都有，并且是否是一个引用，也就是只比较了第一层的值，确实很浅，所以深层的嵌套数据是对比不出来的。**

例如

```
class Ul extends PureComponent {
  constructor(props) {
    super(props)
    this.state = { 
      items: [1, 2, 3] 
    };
  }
  handleClick = () => {
    let { items } = this.state;
    items.push(4);
    this.setState({ items });
  }
  render() {
    return (
    <div>
      <ul>
        {this.state.items.map(i => <li key={i}>{i}</li>)}
      </ul>
      <button onClick={this.handleClick}>add</button>
    </div>)
  }
}
```
会发现，无论怎么点 add 按钮， li 都不会变多，因为 pop方法是在原数组上进行的修改，items的preState与nextState 用的是一个引用， shallowEqual 的结果为 true 。改正：
```
handleClick = () => {
  let { items } = this.state;
  this.setState({ items: items.concat([4]) });
}
```
这样每次改变都会产生一个新的数组，items的preState与nextState 用的是不同引用， shallowEqual 的结果为 false，也就可以 render 了。
在PureComponent中要避免可变对象作为props和state，你可以考虑使用Immutable.js来创建不可变对象，Immutable Data就是一旦创建，就不能再被更改
的数据。对 Immutable 对象的任何修改或添加删除操作都会返回一个新的 Immutable 对象。从而避免出现props和state发生改变而组件没有重新渲染的问题。
3. Component

与PureComponent不同的是，Component需要开发者显示定义shouldUpdateComponent且定制性更强。对于一些无论怎么修改都不应该让组件重新渲染的props就不必在shouldUpdateComponent中进行比较。同PureComponent一样Component中的state也应该是不可变对象。

使用Object.assign或者concat等方法避免修改原来的对象或数组是通过将属性/元素从一个对象/数组复制到另一个来工作,这种拷贝方式只是浅拷贝。Object.assign()方法实行的就是浅拷贝，而不是深拷贝。也就是说源对象某个属性的值是对象，那么目标对象拷贝得到的是这个对象的引用。例如有school状态：
```
this.state = {
  school: {
    classOne: {
      ...
    },
    classTwo: {
      ...
    }
  }
}
```
通过Object.assign修改状态
```
let classOne = {
  teacher: [...],
  students: [...],
};
this.setState(preState => ({
  school: Object.assign({}, preState.school, {classOne: classOne})
}));
```
上面代码中Object.assign拷贝的只是classOne对象的引用,任何对classOne的改变都会反映到React的State中。深拷贝并不是简单的复制引用，而是在堆中重新分配内存，并且把源对象实例的所有属性都新建复制，以保证复制的对象的引用不指向任何原有对象上或其属性内的任何对象，复制后的对象与原来的对象是完全隔离的(关于深拷贝可参考[这篇文章](https://mp.weixin.qq.com/s?__biz=MzU0OTExNzYwNg==&mid=2247483838&idx=1&sn=e91c94e9c1c9c848daf1fa257c2a0dbb&chksm=fbb58a77ccc203617486956d7e155ce7b5d3ebc4650523739d6cb34b0dd8146e79e8a594524f#rd))。
深拷贝通常需要把整个对象递归的复制一份，十分影响性能。对于大型对象/数组来说，操作比较慢。当应用复杂后，props和state也变得复杂和庞大，通过浅拷贝和深拷贝就会影响性能和造成内存的浪费。且对象和数组默认是可变的，没有什么可以确保state是不可变对象，你必须时刻记住要使用这些方法。

使用immutable.js可以很好的解决这些问题。Immutable.js 的基本原则是对于不变的对象返回相同的引用，而对于变化的对象，返回新的引用。同时为了避免 deepCopy 把所有节点都复制一遍带来的性能损耗，Immutable 使用了 Structural Sharing（结构共享），即如果对象树中一个节点发生变化，只修改这个节点和受它影响的父节点，其它节点则进行共享。(关于immutab.js可以看[这篇文章](https://github.com/camsong/blog/issues/3)或者[immutable.js](https://github.com/facebook/immutable-js))

### 总结
正确的定义state不仅便于状态的管理与调试，而且在复杂应用中保持state的简洁，在组件更新时能减少比较次数，提高性能。保证state的不可变性不仅保证数据更容易追踪、推导，而且能避免组件更新时shouldComponent出现状态比较错误。
