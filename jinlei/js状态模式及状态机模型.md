# JavaScript状态模式及状态机模型  #

这是一篇，我自己都看不完的文章...

 文章大体就两部分：

1. 状态模式的介绍
2. 状态机模型的函数库javascript-state-machine的用法和源码解析



## 场景及问题背景： ##
我们平时开发时本质上就是对应用程序的各种状态进行切换并作出相应处理。最直接的解决方案是将这些所有可能发生的情况全都考虑到，然后使用if... ellse语句来做状态判断来进行不同情况的处理。但是对复杂状态的判断就显得代码逻辑特别的乱。随着增加新的状态或者修改一个状态，if else或switch case语句就要相应的的增多或者修改，程序的可读性，扩展性就会变得很弱。维护也会很麻烦。

来个例子来，魂斗罗啊有木有玩过？：
 	
先来看看最简单的一个动作的简单实现：

	class Contra {
	  constructor () {
	    //存储当前待执行的动作
	    this.lastAct = {};
	  }
	  //执行动作
	  contraGo (act){
	    if(act === 'up'){
	      //向上跳
	    }else if(act === 'forward'){
	      //向前冲啊
	    }else if(act === 'backward'){
	      //往老家跑
	    }else if(act === 'down'){
	      //趴下
	    }else if(act === 'shoot'){
	      //开枪
	    }
	    this.lastAct = act;
	  }
	};
	var littlered = new Contra();
	littlered.contraGo('shoot');
那要是有两个组合动作呢？改一下：

	function contraGo (act){
	
	  constructor () {
	    //存储当前待执行的动作
	    this.lastAct1 = "";
	    this.lastAct2 = "";
	  }
	
	  contraGo (act1, act2){
	    const actArr = [act1, act2];
	    if(actArr.indexOf('shoot') !== -1 &&  actArr.indexOf('up') !== -1){
	      //跳着开枪吧
	    }else if(actArr.indexOf('shoot') !== -1 &&  actArr.indexOf('forward') !== -1){
	      //向前跑着开枪吧
	    }else if(actArr.indexOf('shoot') !== -1 &&  actArr.indexOf('down') !== -1){
	      //趴着开枪吧
	    }else if(actArr.indexOf('shoot') !== -1 &&  actArr.indexOf('backward') !== -1){
	      //回头跑着开枪吧
	    }else if(actArr.indexOf('up') !== -1 &&  actArr.indexOf('forward') !== -1){
	      //向前跳吧
	    }else if(actArr.indexOf('up') !== -1 &&  actArr.indexOf('down') !== -1){
	      //上上下下吧
	    }
	  ...//等等组合
	    this.lastAct1 = act1;
	    this.lastAct2 = act2;
	  }
	}
	var littlered = new Contra();
	littlered.contraGo('shoot');



缺点很明显了，大量的if else判断，加入哪天要给小红小蓝加一个回眸的动作，好嘛我又要修改contraGo方法，加一堆排列组合了，这使得contraGo成为了一个非常不稳定的方法，而且状态越多越庞大，升华一下，contraGo方法是违反开放-封闭原则的！

然后“**状态模式**”下凡来救人...

------------------------------------------------------------------------------
> **这里插一句开放封闭原则，到下一个分割线结束，大家可以跳一跳**
> 　
> 
> 有什么痛点 —— 开发过程中，因为变化、升级和维护等原因需要对原有逻辑进行修改时，很有可能会给旧代码中引入错误，也可能会使我们不得不对整个功能进行重构，并且需要原有功能新测试。
> 
> 怎么解决 —— 我们应该尽量通过扩展实体的行为来实现变化，而不是通过修改已有的代码来实现变化
> 
> 具体一点呢 —— 类、模块和函数应该对扩展开放，对修改关闭。模块应该尽量在不修改原代码的情况下进行扩展。
> 
> 核心 —— 用抽象构建框架，用实现扩展细节。
> 
> 总结一下 —— 开发人员应该对程序中呈现的频繁变化的那些部分作出抽象，然后从抽象派生的实现类来进行扩展，当代码发生变化时，只需要根据需求重新开发一个实现类来就可以了。要求我们对需求的变更有一定的前瞻性和预见性，同时拒绝对于应用程序中的每个部分都刻意的进行抽象。
> 
> 
**包含开闭原则在内，设计模式的六大原则，这里不详细介绍，简单列下：**
> 
> 1. **单一原则 （SRP）:** 实现类要职责单一,一个类只做一件事或者一类事，不要将功能无法划分为一类的揉到一起，答应我好吗
> 2. **里氏替换原则（LSP）：** 不要破坏继承体系，子类可以完全替换掉他们所继承的父类，可以理解为调用父类方法的地方换成子类也可以正常执行调用，爸爸打下的江山儿子继位得无压力好吗
> 3. **依赖倒置原则（DIP）:**我说下我的理解，如果某套功能或者业务逻辑可能之后会出现并行的另外一种模式或者较大的调整，那不如把这部分逻辑抽象出来，创建一个包含相关方法的抽象类，而实现类继承这个抽象类来重写抽象类中的方法，完成具体的实现，调用这些功能方法的类不需要关心自己调用的这些个方法的具体实现，只管调用这些抽象类中定义好的形式上的方法即可，不与实际实现这些方法的类发生直接依赖关系，方便之后的实现逻辑的替换更改；
> 4. **接口隔离原则(ISP) :** 在设计抽象类的时候要精简单一,白话说就是，A需要依赖B提供的一些方法，A我只用B的3个方法，B就尽量不要给A用不到的方法啦；
> 5. **迪米特法则（LoD）**降低耦合,尽量减少对象之间的直接的交互，如果其中一个类需要调用另一个类的某一个方法的话，可通过一个关系类发起这个调用，这样一个模块修改时，就可以最大程度的减少波及。
> 6. **开放-封闭原则（OCP）**告诉我们要对扩展开放，对修改关闭，你可以继承扩展我所有的能力，到你手里你想咋改咋改，但是，别 动我 本人 好吗？好的
> 
> 23种设计模式基于以上6大基本原则结合具体开发实践总结出来的，万变不离其宗，有了这些基本的意识规范，你写出来的，搞不好就是某种设计模式٩(๑>◡<๑)۶ 


---------------------------------------------------------------------------------



## 解决方案 ##
**状态模式：**允许一个对象在其内部状态改变的时候改变它的行为，对象看起来似乎修改了它的类。


**先看下采用状态模式修改后的代码：**
	
	class Contra {
	  constructor () {
	    //存储当前待执行的动作 们
	    this._currentstate = {};
	  }
	  //添加动作
	  changeState (){
	    //清空当前的动作集合
	    this._currentstate = {};
	    //遍历添加动作
	    Object.keys(arguments).forEach(
	      (i) => this._currentstate[arguments[i]] = true
	    )
	    return this;
	  }
	  //执行动作
	  contraGo (){
	    //当前动作集合中的动作依次执行
	    Object.keys(this._currentstate).forEach(
	      (k) => Actions[k] && Actions[k].apply(this)
	    )
	    return this;
	  }
	};
	
	const Actions = {
	  up : function(){
	    //向上跳
	    console.log('up');
	  },
	  down : function(){
	    //趴下
	    console.log('down');
	  },
	  forward : function(){
	    //向前跑
	    console.log('forward');
	  },
	  backward : function(){
	    //往老家跑
	    console.log('backward');
	  },
	  shoot : function(){
	    //开枪吧
	    console.log('shoot');
	  },
	};
	var littlered = new Contra();
	littlered.changeState('shoot','up').contraGo();

控制台会输出： shoot up


## 解决思路： ##

状态模式，将条件判断的结果转化为状态对象内部的状态（代码中的up,down,backward,forward），内部状态通常作为状态对象内部的私有变量（this._currentState），然后提供一个能够调用状态对象内部状态的接口方法对象(changeState,contraGo)，这样对状态的改变，对状态方法的调用的修改和增加也会很容易，方便了对状态对象中内部状态的管理。

同时，状态模式将每一个条件分支放入一个独立的类中，也就是代码中的Actions。这使得你可以根据对象自身的情况将对象的状态(动作——up,down,backward,forward)作为一个对象(Actions.up，Actions.down这样)，这一对象可以不依赖于其他对象而独立变化（一个行为一个动作，互不干扰）。

可以看出，状态模式就是一种适合多种状态场景下的设计模式，改写之后代码更加清晰，提高代码的维护性和扩展性，不用再牵一发动全身

## 状态模式的使用场景： ##
1. 一个由一个或多个动态变化的属性导致发生不同行为的对象，在与外部事件产生互动时，其内部状态就会改变，从而使得系统的行为也随之发生变化，那么这个对象，就是有状态的对象
1. 代码中包含大量与对象状态有关的条件语句，像是if else或switch case语句，且这些条件执行与否依赖于该对象的状态。

如果场景符合上面两个条件，那我们就可以想象状态模式是不是可以帮忙了

## 状态模式的优缺点： ##

**优点:**

1. 一个状态状态对应行为，封装在一个类里，更直观清晰，增改方便
2. 状态与状态间，行为与行为间彼此独立互不干扰
3. 避免事物对象本身不断膨胀，条件判断语句过多
4. 每次执行动作不用走很多不必要的判断语句，用哪个拿哪个



**缺点:**

1. 需要将事物的不同状态以及对应的行为拆分出来，有时候会无法避免的拆分的很细，有的时候涉及业务逻辑，一个动作拆分出对应的两个状态，动作就拆不明白了，过度设计
2. 必然会增加事物类和动作类的个数，有时候动作类再根据单一原则，按照功能拆成几个类，会反而使得代码混乱，可读性降低


## 状态模式场景实例 ##

**组件开发中的状态模式——导航**

我们平时开发组件时很多时候要切换组件的状态，每种状态有不同的处理方式，这个时候就可以使用状态模式进行开发。

用和上面一样的思路，我们来举一个React组件的小例子，比如一个Banner导航，最基本的两种状态，显示和隐藏，如下：

	const States = {
	  "show": function () {
	    console.log("banner展现状态，点击关闭");
	    this.setState({
	      currentState: "hide"
	    })
	  },
	  "hide": function () {
	    console.log("banner关闭状态，点击展现");
	    this.setState({
	      currentState: "show"
	    })
	  }
	};
同样通过一个对象States来定义banner的状态，这里有两种状态show和hide，分别拥有相应的处理方法，调用后再分别把当前banner改写为另外一种状态。接下来来看导航类Banner：
	
	class Banner extends Component{
	  constructor(props) {
	    super(props);
	    this.state = {
	      currentState: "hide"
	    }
	    this.toggle = this.toggle.bind(this);
	  }
	  toggle () {
	    const s = this.state.currentState;
	    States[s] && States[s].apply(this);
	  }
	
	  render() {
	    const { currentState } = this.state;
	    return (
	      <div className="banner" onClick={this.toggle}>
	      </div>
	    );
	  }
	};
	
	export default Banner;
这个导航类有一个toggle方法用来切换状态，然后调用相应的处理方法。

如果有第三种状态，我们只需要States添加相应的状态和处理程序即可。


**经典示例——红绿灯**


红绿灯的基本功能大家都懂，这里直接贴代码，实现思路一样，再换个写法：


	var trafficLight = (function () {
	  var currentLight = null;
	  return {
	    change: function (light) {
	      currentLight = light;
	      currentLight.go();
	    }
	  }
	})();
	
	function RedLight() { }
	RedLight.prototype.go = function () {
	  console.log("this is red light");
	}
	function GreenLight() { }
	GreenLight.prototype.go = function () {
	  console.log("this is green light");
	}
	function YellowLight() { }
	YellowLight.prototype.go = function () {
	  console.log("this is yellow light");
	}
	
	trafficLight.change(new RedLight());
	trafficLight.change(new YellowLight());

trafficLight是一个红绿灯的实例，传入一个构造函数，对象暴露change方法改变内部状态，也就是灯的颜色，change接收的同样是一个状态的对象，调用对象的方法触发响应的动作，这里的动作都叫go,不同颜色的灯对象有着不同的go的实现。

通过传入灯对象到change方法中，从而改变红绿灯的状态，触发其相应的处理程序，这就是一个典型的状态模式的应用。

上面三个例子我们可以感觉到，采用状态模式的代码，代码结构都差不多，功能说白了也差不多，都是一种状态对应一种操作，然后可能会改变对象的状态。

这些场景其实可以用一个通用模型来表示，就是“有限状态机”。

## 有限状态机 Finite-state machine ##

就是状态模式的一个模型，在日常开发中很多具有多种状态的对象，都可以用有限状态机模型来模拟，一般都具有以下特点：

1. 事物拥有多种状态，任一时间只会处于一种状态不会处于多种状态；
2. 动作可以改变事物状态，一个动作可以通过条件判断，改变事物到不同的状态，但是不能同时指向多个状态，一个时间，就一个状态，就，一个。
（*这里有人可能会疑问上面的魂斗罗例子，小红和小蓝为什么可以同时跳着打枪或者跑着打枪，这不就是同时处于两种状态吗？我说下我的理解哈，我认为两个行为“跳”和“打枪”共同决定了一种状态“跳着打枪”，人物一共有的状态其实是可能同时发生的行为的排列组合，组合不排列吧，因为跳着打枪和打枪跳着应该是一样的，所以还是一种状态，一种）*
1. 状态总数是有限的；

既然符合上述场景的都可以用状态机模型描述，那么我们是不是可以将这种模式抽象出来，通过传入参数来实现不同的状态流程，不用每次都把这个流程写这么一遍呢？

github上有一个**有限状态机的函数库javascript-state-machine**，来来来了解一下

## 有限状态机函数库Javascript Finite State Machine##

**使用方法**

作者github上介绍的很详细，[https://github.com/jakesgordon/javascript-state-machine](https://github.com/jakesgordon/javascript-state-machine "贴链接")，这里我就偷懒简单说说。

实例化一个经典示例红绿灯的状态机，看我是不是行文照应的很好哈哈哈哈哈哈：


  	var StateMachine = require('javascript-state-machine');
	const StateMachine = require('javascript-state-machine');
	var fsm = new StateMachine({
	    init: 'green',
	    transitions: [
	      { name: 'warn',  from: 'green',  to: 'yellow' },
	      { name: 'panic', from: 'yellow', to: 'red'    },
	      { name: 'calm',  from: 'red',    to: 'yellow' },
	      { name: 'clear', from: 'yellow', to: 'green'  }
	    ]，
		methods: {
	      onWarn: function() {},
	      onBeforeWarn: function() {},
	      onLeaveWarn: function() {},
	      onEnterYellow: function() {},
		  onLeaveYellow: function() {},
		  //...
	    }	
  	})
红绿灯初始状态init属性是green,trainstions是来描述状态变化规则的数组，每一项是一个对象，可以理解为一个规则描述：

- form：当前行为从哪个状态来
- to:当前行为执行完会过渡到哪个状态
- name:当前行为的名字

生成实例后，获取当前状态机对象fsm的状态：

	fsm.state 

改变状态机状态的几个过渡方法

	fsm.warn()
	fsm.panic()
	fsm.calm()
	fsm.clear()

同时状态机提供一系列工具方法

	fsm.is(s) - return true 如果当前状态机状态为 s
	fsm.can(t) - return true 如果过渡方法t可以从当前状态触发
	fsm.cannot(t) - return true 如果当前状态下不能发生过渡方法t
	fsm.transitions() - 返回从当前状态可以过渡到的状态的列表
	fsm.allTransitions() - 返回所有过渡方法的列表
	fsm.allStates() - 返回状态机有的所有状态的列表


生命周期方法列举，变化的生命周期会按照下面的顺序依次执行:

	//注意，STATE是当前状态机所处的状态，TRANSITION是即将发生的动作

	onBeforeTransition 任何动作触发前触发
	onBefore<TRANSITION> 在特定动作TRANSITION前触发
	onLeaveState 离开任何一个状态的时候触发
	onLeave<STATE> 在离开特定状态STATE时触发
	onTransition 在任何动作发生期间触发
	onEnterState 当进入任何状态时触发
	onEnter<STATE> 进入一个特定的状态STATE时触发
	on<STATE> onEnter<STATE>的简写
	onAfterTransition 任何动作触发后触发
	onAfter<TRANSITION> 在特定动作TRANSITION后触发
	on<TRANSITION> onAfter<TRANSITION>的简写

结合声明周期方法，解释上面实例中的methods属性中的方法：

	methods: {
		onWarn: function() {},//在warn动作发生时触发
		onBeforeWarn: function() {},//在warn动作要发生时触发
		onLeaveWarn: function() {},//在warn动作发生后触发
		onEnterYellow: function() {},//在变成黄灯状态时触发
		onLeaveYellow: function() {},//在离开黄灯状态时触发
	}
生命周期时间如果需要监听，需要我们再methods中声明下，并把相应的操作传入

此外这个函数库还支持异步，容错等等很多强大的功能，具体用法作者github上写的超好，这里我就不啰嗦啦

懒就是...


------------------------------------------------------------------------------
**源码解析**



光会用不行啊，down下来源码，我们来看看这个下载量极高的状态机模型的函数库，到底是怎样一个流程

根据上面的例子，我们进入源码看下到底做了什么事：

	var fsm = new StateMachine({
	    init: 'green',
	    transitions: [
	      { name: 'warn',  from: 'green',  to: 'yellow' },
	      { name: 'panic', from: 'yellow', to: 'red'    },
	      { name: 'calm',  from: 'red',    to: 'yellow' },
	      { name: 'clear', from: 'yellow', to: 'green'  }
	    ]
	  })

先看这部分，实例化一个状态机StateMachine的过程，上StateMachine构造函数：

	function StateMachine(options) {
	  return apply(this || {}, options);//--下面进入这个方法里--
	}

	//下面是StateMachine的一些基础设置

	StateMachine.version  = '3.0.1';
	StateMachine.factory  = factory;
	StateMachine.apply    = apply;
	StateMachine.defaults = {
	  wildcard: '*',
	  init: {
	    name: 'init',
	    from: 'none'
	  }
	}

options就是我们传入的状态机的初始化对象：

	{
	    init: 'green',
	    transitions: [
	      { name: 'warn',  from: 'green',  to: 'yellow' },
	      { name: 'panic', from: 'yellow', to: 'red'    },
	      { name: 'calm',  from: 'red',    to: 'yellow' },
	      { name: 'clear', from: 'yellow', to: 'green'  }
	    ]
	  }

自定义的apply方法，传入当前状态机的上下文和上面的初始化数据对象：

	function apply(instance, options) {
	  var config = new Config(options, StateMachine);//--下面进入这个方法里--
	  build(instance, config);
	  instance._fsm();
	  return instance;
	}

Config，入参是初始化数据和StateMachine构造函数方法:

	function Config(options, StateMachine) {
	
	  options = options || {};

	  this.options     = options;  //初始化配置
	  this.defaults    = StateMachine.defaults; //状态机的基本设置
	  this.states      = []; //状态列表
	  this.transitions = []; //过渡动作列表
	  this.map         = {}; //状态和动作的映射
	  //-------------------------------------
	  this.lifecycle   = this.configureLifecycle();
 	  this.configureTransitions(options.transitions || []);
	  //------------------------------------停，我们看上面两行代码做了什么
	  this.init        = this.configureInitTransition(options.init);
	  this.map[this.defaults.wildcard] = {};
	  this.data        = this.configureData(options.data);
	  this.methods     = this.configureMethods(options.methods);

	}
	
	//mixin函数就是将接收到的除第一个之外的参数对象上的属性拷贝到第一个对象上
	
	mixin(Config.prototype, {
	//主要是初始化构造状态机一些属性的工具方法，具体实现这里不做展示
	  addState: function(name) {},
	
	  addStateLifecycleNames: function(name) {},
	
	  addTransition: function(name) {},
	
	  addTransitionLifecycleNames: function(name) {},
	
	  mapTransition: function(transition) {},
	  //......
	
	});
	
	module.exports = Config;



this.lifecycle中存储的是状态机基本的生命周期要监控的几个时机，分别为on，onBefore, onAfter, onEnter, onLeave

属于行为TRAISITION的时机——onBefore(行为发生前)，onAfter(行为发生后)

属于状态STATE的时机——onEnter(进入状态前)，onLeave(离开状态前)

既属于状态又属于行为的时机——on

this.configureLifecycle()定义了lifecycle的基本结构，this.configureTransitions()则为状态机的每一个状态和动作注册了响应时机的生命周期方法

我们直接看下初始化完成之后的lifecycle大家就明白了，对比上面的用法中列举的所有生命周期函数理解一下
![](https://i.imgur.com/8UuxH6S.png)



嗯接着回到Config往下看


	function Config(options, StateMachine) {
 	  //...省略上面
	  this.init        = this.configureInitTransition(options.init);
	  this.map[this.defaults.wildcard] = {};
	  //------------------------------------停，我们看这两行代码做了什么
	  this.data        = this.configureData(options.data);//传入初始化的一些数据，本例中没有，返回{}
	  this.methods     = this.configureMethods(options.methods);//传入自定义的一些数据，本例中没有，返回{}
	}

this.map存储的就是状态机所有的对象对应的行为的列表，可以理解为魂斗罗里面的Actions,只不过这里一个状态对应的不是一个行为，而是一个对象，这个对象里面是所有这个状态所能触发的行为的名字，名字对应的值是发生这个行为产生这个过渡的描述：

![](https://i.imgur.com/2LTwspl.png)

name是要发生的行为，to是发生行为后过渡到的状态，active是当前状态机应该发生的行为

我们看到，none并不是我们初始化注册的数据，init也不是我们注册的行为

其实状态机默认真正的起始状态都是一个不存在的"none",而从这个状态过渡到真正的初始化状态（green）对应的行为就是状态机内部的init方法。

状态机现在要从"none"过渡到我们真正设定的初始状态green，configureInitTransition方法将描述当前状态机应该发生的行为的描述对象{name: "init", from: "none", to: "green", active: true}返回给this.init

this.map[this.defaults.wildcard] = {}在map中注册一个任意状态 *,回到上面代码看Config的后两句，然后我们回到apply继续：

	function apply(instance, options) {

	  //instance是我们的状态机的上下文，options是传入的初始化的数据

	  var config = new Config(options, StateMachine);
	  build(instance, config);//进入下面build方法
	  instance._fsm();
	  return instance;
	}
	
	function build(target, config) {
	 //这里只列举了核心代码
	  mixin(target, PublicMethods);//PublichMethods是用法中状态机提供给我们的工具方法is,can,cannot......
	  mixin(target, config.methods);//config.methods是上面列举的状态机内部的工具方法
	  //------------------------------------
	  config.allTransitions().forEach(function(transition) {
	    target[camelize(transition)] = function() {
	      return this._fsm.fire(transition, [].slice.call(arguments))
	    }
	  });
     //------------------------------------看下这段代码
	  target._fsm = function() {
	    this._fsm = new JSM(this, config);
	    this._fsm.init(arguments);
	  }
	}
config.allTransitions()是状态机所有行为名称的列表["init","warm","panic","calm","clear"],遍历这个数组，将行为作为方法注册到状态机上

![](https://i.imgur.com/kRj2z2t.png)

这些方法的返回值是this._fsm.fire，这个我们后面讲下，回到build:

	function build(target, config) {
	 //省略上面
	  target._fsm = function() {
	    this._fsm = new JSM(this, config);
	    this._fsm.init(arguments);
	  }
	}
为状态机注册一个_fsm的方法，build执行完毕，接下来回到apply中便开始执行_fsm这个方法:

	function apply(instance, options) {
	  //省略上面
	  instance._fsm();//开始执行_fsm（）
	  return instance;
	}

_fsm这个方法，this._fsm = new JSM(this, config)首先实例化了一个真真正正的状态机JSM

	function JSM(context, config) {
	  this.context   = context;
	  this.config    = config; //上面config初始化的一堆数据
	  this.state     = config.init.from; //none
	  this.observers = [context];
	}
	
	mixin(JSM.prototype, {
	  //省略实现细节，用到的下面会详细说
	  init: function(args) {},
	
	  is: function(state) {},
	
	  isPending: function() {},
	
	  can: function(transition) {},
	
	  allTransitions: function() {},
	
	  transitions: function() {},
	
	  seek: function(transition, args) {},
	
	  fire: function(transition, args) {},
	  //......
	});

	module.exports = JSM;
回到_fsm方法，接下来就是真正的初始化函数了，this._fsm.init(arguments)

	mixin(JSM.prototype, {
	  //...上面定义的一堆方法
	  init: function(args) {
	   //只贴核心代码
	    if (this.config.init.active)
			return this.fire(this.config.init.name, []);//----进入下面fire方法
	  },
	  fire: function(transition, args) {
	    return this.transit(transition, this.state, this.seek(transition, args), args);
		//-----seek方法就是返回this.map[this.state][transition].to,就是当前状态none中的当前要发生行为init的行为描述中该行为过渡到的下一个状态，对照下上面的this.map,这里返回的是green

        //进入下面transit方法
	  },
	transit: function(transition, from, to, args) {
	
		//只贴核心代码
	    var lifecycle = this.config.lifecycle;
	
	    this.beginTransit();//方法就是将this.pending置为true，表示状态机执行中
	
	    args.unshift({            
	      transition: transition,
	      from:       from,
	      to:         to,
	      fsm:        this.context
	    });
		//------------------------------------
	    return this.observeEvents([
	                this.observersForEvent(lifecycle.onBefore.transition),
	                this.observersForEvent(lifecycle.onBefore[transition]),
	      			this.observersForEvent(lifecycle.onLeave.state),
	      			this.observersForEvent(lifecycle.onLeave[from]),
	                this.observersForEvent(lifecycle.on.transition),
      				[ 'doTransit', [ this ] ],
	      			this.observersForEvent(lifecycle.onEnter.state),
	      			this.observersForEvent(lifecycle.onEnter[to]),
	      			this.observersForEvent(lifecycle.on[to]),
	                this.observersForEvent(lifecycle.onAfter.transition),
	                this.observersForEvent(lifecycle.onAfter[transition]),
	                this.observersForEvent(lifecycle.on[transition])
	    ], args);
		//------------------------------------看下这段代码
	  },
	  //...下面定义的一堆方法
	}
observersForEvent方法会返回一个数组，第一个对象时当前这个动作对应的生命周期函数的名字。

第二个参数，是一个数组，每一项表示注册了这个生命周期方法的状态机，比较复杂的多状态机场景下才会返回长度大于一的数组，这个例子中我们只要关注数组长度为0和1的情况即可，0表示这个生命周期方法当前状态机没有注册，不用执行，1表示状态机注册了，那就将这个状态机作为数组第一项返回这个数组

第三个参数就是true，observersForEvent方法就不过多介绍，我们看下observeEvents实际接收到的入参:

events:
![](https://i.imgur.com/DQfv8ju.png)

因为我们初始化状态机的时候，什么方法都没有注册，所以所有onXXX的方法，第二个参数都是空数组，然而doTransit这个方法比较特殊，它是状态过渡需要默认执行的，所以它的第二个参数是包含当前的状态机的长度为一的数组

args是上面代码中构造的:

![](https://i.imgur.com/iiOPIvo.png)

	mixin(JSM.prototype, {
	  //...上面定义的一堆方法
	  observeEvents: function(events, args， previousEvent, previousResult) {
	    //贴核心代码
	    var event     = events[0][0],

	    args[0].event = event;

	    if (observers.length === 0) {
		  //如果这个生命周期方法该状态机没有注册，不用执行，执行下一个方法去
	      events.shift();
	      return this.observeEvents(events, args, event, previousResult);
	    }
	    else {
		 //敲黑板了，只有doTransit方法进来了
	      var observer = observers.shift(),
	          result = observer[event].apply(observer, args);
			  //上面这句是为了把args作为第二个参数传入doTransit方法并执行，看下面doTransit方法
上面这两句会直接events数组中当前正在执行的第0项改写，状态机列表清空，第三个参数返回undefined，当前event变为["doTransit", Array(0)]

	      if (result && typeof result.then === 'function') {
			//注册的方法返回一个promise的情况
	        return result.then(this.observeEvents.bind(this, events, args, event)).catch(this.failTransit.bind(this))
	      }
	      else if (result === false) {
			//执行完毕或者中途执行出错返回false
	        return this.endTransit(false);
	      }
	      else {
			//影响不只一个状态机时，当前状态机从第二个参数里删掉，继续执行下一个状态机里这个方法
	        return this.observeEvents(events, args, event, result);
	      }
	    }
	  },

	  doTransit:    function(lifecycle) { this.state = lifecycle.to; //状态机过渡到下一个状态},
 	  //...下面定义的一堆方法
	}

这样，状态机的初始化完成了，我们手动执行一个动作看看：

	fsm.warn()

我们上面讲的，动作方法实际上返回的是fire这个方法：

	return this._fsm.fire(transition, [].slice.call(arguments))

就像上面fire触发init方法一样的流程，因为没有注册监听方法，只有doTransit方法执行

我们注册一个监听方法执行看一下：

	var fsm = new StateMachine({
	    init: 'green',
	    transitions: [
	      { name: 'warn',  from: 'green',  to: 'yellow' },
	      { name: 'panic', from: 'yellow', to: 'red'    },
	      { name: 'calm',  from: 'red',    to: 'yellow' },
	      { name: 'clear', from: 'yellow', to: 'green'  }
	    ],
	    methods: {
	      onBeforeWarn:  function() { console.log("执行warn,state将变为yellow")                },
	    }
	  })

	fsm.warn();  
  	console.log(fsm.state)
我们直接看一下observerEents方法的第一个入参events:

![](https://i.imgur.com/zQMVg4v.png)

控制台输出：

![](https://i.imgur.com/Vbr7IJk.png)

这个状态机的核心流程大体就是这样了，很简单很简单的例子，想深入了解的同学可以去看看大牛的源码

## 总结 ##

能看到这儿的不容易了，我都要崩塌了，非要总结的话，那就是不是特别麻烦的场景也不用用这个状态机的函数库，自己了解核心思路实现一个也是极好极好的，然而真的需要用的话这个函数库支持的功能还是很强大的，大家可以去看看作者的代码和文档~

最后，遇到上面说的大量判断条件的场景，记得想想状态模式啊~