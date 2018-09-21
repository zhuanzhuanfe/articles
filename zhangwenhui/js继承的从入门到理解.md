### 开场白

大三下学期结束时候，一个人跑到帝都来参加各厂的面试，免不了的面试过程中经常被问到的问题就是JS中如何实现继承，当时的自己也是背熟了实现继承的各种方法，回过头来想想却不知道\_\_proto\_\_是什么，prototype是什么，以及各种继承方法的优点和缺点，想必有好多刚入坑的小伙伴有着跟我一样的体验，这篇文章将从基础概念出发，进一步说明js继承，以及各种继承方法的优缺点，希望对看这篇文章的你有所帮助，如果你是见多识广的大佬，既然看到这里了，不妨继续看下去，指点一二，让新入坑的小伙伴更好的成长。（如果你都看到这了，透露一下文末有彩蛋嗷！）下面，我们进入正题：

### 设计思想
如果你没看过，也会听别人说JavaScript的继承不同于Java和c++，js中没有“类”和“实例”的区分，而是靠一种原型链的一级一级的指向来实现继承。那么当时的创造JavaScript这种的语言的人为什么要这样实现js独有的继承，大家可以阅读阮一峰老师的[Javascript继承机制的设计思想](http://www.ruanyifeng.com/blog/2011/06/designing_ideas_of_inheritance_mechanism_in_javascript.html)，就像讲故事一样，从古代至现代说明了js继承这种设计模式的缘由。

### prototype对象
了解了js继承的设计思想后，我们需要学习原型链上的第一个属性prototype，这个属性是一个指针，指向的是原型对象的内存堆。从阮一峰老师的文章中，我们可以知道prototype是为了解决构造函数的属性和方法不能共享的问题而提出的，下面我们先实现一个简单的继承：

```javascript
function constructorFn (state, data) {
	this.data = data;
	this.state = state;
	this.isPlay = function () {
		return this.state + ' is ' + this.data;
	}
}
var instance1 = new constructorFn ('1', 'doing');
var instance2 = new constructorFn ('0', 'done');
console.log(instance1.isPlay()); // 1 is doing
console.log(instance2.isPlay()); // 0 is done
```

此时，实例1 和实例2 都有自己的data属性、state属性、isPlay方法，造成了资源的浪费，既然两个实例都需要调用isPlay方法，便可以将isPlay方法挂载到构造函数的prototype对象上，实例便有了本地属性方法和引用属性方法，如下：

```javascript
function constructorFn (state, data) {
	this.data = data;
	this.state = state;
}
constructorFn.prototype.isPlay = function () {
	return this.state + ' is ' + this.data;
}
constructorFn.prototype.isDoing = 'nonono!';
var instance1 = new constructorFn ('1', 'doing');
var instance2 = new constructorFn ('0', 'done');
console.log(instance1.isPlay()); // 1 is doing
console.log(instance2.isPlay()); // 0 is done
console.log(instance1.isDoing); // nonono!
console.log(instance2.isDoing); // nonono!
```


我们将isPlay方法挂载到prototype对象上，同时增加isDoing属性，既然是共享的属性和方法，那么修改prototype对象的属性和方法，实例的值都会被修改，如下：


```javascript
constructorFn.prototype.isDoing = 'yesyesyes!';
console.log(instance1.isDoing); // yesyesyes!
console.log(instance2.isDoing); // yesyesyes!
```


问题来了，为什么实例会取到prototype对象上的属性和方法，别急，没多久就会结合其他问题综合解答。

同时，你可能会问，如果修改实例1的isDoing属性的原型，实例2的isDoing会不会受到影响？

```javascript
instance1.isDoing = 'yesyesyes!';
console.log(instance1.isDoing); // yesyesyes!
console.log(instance2.isDoing); // nonono!
```

问题又来了，可以看到修改实例1的isDoing属性，实例2的实例并未受到影响。这是为什么呢？

那如果修改实例1的isDoing属性的原型属性，实例2的isDoing会不会受到影响？如下：

```javascript
instance1.__proto__.isDoing = 'yesyesyes!';
console.log(instance1.isDoing); // yesyesyes！
console.log(instance2.isDoing); // yesyesyes！
```


问题又又来了，为什么修改实例1的\_\_proto\_\_属性上的isDoing的值就会影响到构造函数的原型对象的属性值？

我们先整理一下，未解决的三个问题：
1.	为什么实例会取到prototype对象上的属性和方法？
2.	为什么修改实例1的isDoing属性，实例2的实例没有受到影响？
3.	为什么修改实例1的\_\_proto\_\_属性上的isDoing的值就会影响到构造函数的原型对象的属性值？

这时候不得不背后真正的操作者搬出来了，就是new操作符，同样是面试最火爆的问题之一，new操作符干了什么？相信有人也是跟我一样，已经背的滚瓜烂熟了，以 Var instance1 = new constructorFn();为例，就是下面三行代码：


```javascript
var obj = {};
obj.__proto__ =  constructorFn.prototype;
constructorFn.call(obj);

```
第一行声明一个空对象，因为实例本身就是一个对象。
第二行将实例本身的\_\_proto\_\_属性指向构造函数的原型，obj新增了构造函数prototype对象上挂载的属性和方法。
第三行将构造函数的this指向替换成obj，再执行构造函数，obj新增了构造函数本地的属性和方法。

理解了上面三行代码的含义，那么三个问题也就迎刃而解了。<br/>
**问题1**：实例在新建的时候，本身的\_\_ptoto\_\_指向了构造函数的原型。<br/>
**问题2**：实例1和实例2 在新建后，有了各自的this，修改实例1的isDoing属性，只是修改了当前对象的isDoing的属性值，并没有影响到构造函数。<br/>
**问题3**：修改实例1的\_\_proto\_\_，即修改了构造函数的原型对象的共享属性<br/>

到此处，涉及到的内容大家可以再回头捋一遍，理解了就会觉得醍醐灌顶。

### \_\_proto\_\_

同时，你可能又会问，\_\_proto\_\_是什么？<br/>
简单来说，\_\_proto\_\_是对象的一个隐性属性，同时也是一个指针，可以设置实例的原型。
实例的\_\_proto\_\_指向构造函数的原型对象。

**需要注意的是，**

>每个对象都有内置的\_\_proto\_\_属性，函数对象才会有prototype属性。

>用chrome和FF都可以访问到对象的\_\_proto\_\_属性，IE不可以。


我们继续用上面的例子来说明：

```javascript
function constructorFn (state, data) {
	this.data = data;
	this.state = state;
}
constructorFn.prototype.isPlay = function () {
	return this.state + ' is ' + this.data;
}
constructorFn.prototype.isDoing = 'nonono!';
var instance1 = new constructorFn ('1', 'doing');
console.log(instance1.__proto__ === constructorFn.prototype); // true
```

构造函数的原型对象也是对象，那么constructor.prototype.\_\_proto\_\_指向谁呢？

定义中说对象的\_\_proto\_\_指向的是构造函数的原型对象，下面我们验证一下constructor.prototype.\_\_proto\_\_的指向：

```javascript

console.log(instance1.__proto__ === constructorFn.prototype); // true
console.log(constructorFn.prototype.__proto__ === Object.prototype) // true
```
用图形表示的话，如下：

<img src="./assets/1_1.png" />

可以看出，constructor.prototype.\_\_proto\_\_的指向是Object的原型对象。<br/>
那么，Object.prototype.\_\_proto\_\_的指向呢？


```javascript

console.log(instance1.__proto__ === constructorFn.prototype); // true
console.log(constructorFn.prototype.__proto__ === Object.prototype) // true
console.log(Object.prototype.__proto__); // null
```
用图形表示的话，如下：

<img src="./assets/1_2.png" />

可以发现，Object.prototype.\_\_proto\_\_ === null;
这样也就形成了原型链。通过将实例的原型指向构造函数的原型对象的方式，连通了实例-构造函数-构造函数的原型，原型链的特点就是逐层查找，从实例开始查找一层一层，找到就返回，没有就继续往上找，直到所有对象的原型Object.prototype。

### 继承的方法

了解了上面的基础概念，就要将学到的用在实际当中，到底要怎么实现继承呢？实现的方式有哪些？下面主要说明实现继承最常用的三用方式，可以满足基本的开发需求，想要更深入的了解，可以参考[阮一峰老师的网络博客](http://www.ruanyifeng.com/blog/)。


>原型链继承

实现原理：将父类的实例作为子类的原型

```javascript
function Animal (name) {
    this.name = name;
}
Animal.prototype = {
    canRun: function () {
        console.log('it can run!');
    }
}
function Cat () {
    this.speak = '喵！';
} 
Cat.prototype = new Animal('miao');
Cat.prototype.constructor = Cat;

```
**注：**
1. 这种继承方式需要将子类的构造函数指回本身，因为从父类继承时同时也继承了父类的构造函数。
2. 简单的使用Cat.prototype = Animal.prototype将会导致两个对象共享相同的原型，一个改变另一个也会改变。
3. 不要使用Cat.prototype = Animal，因为不会执行Animal的原型，而是指向函数Animal。因此原型链将会回溯到Function.prototype,而不是Animal.prototype,因此canRun将不会在Cat的原型链上。


>使用call、apply方法实现

实现原理：改变函数的this指向

```javascript
function Animal (name) {
    this.name = name;
}
Animal.prototype = {
    canRun: function () {
        console.log('it can run!');
    }
}
function Cat (name) {
    Animal.call(this, name);
    this.speak = '喵！';
} 
```
**注：**
1. 该方法将子类Cat的this指向父类Animal，但是并没有拿到父类原型对象上的属性和方法

>使用混合方法实现

实现原理：原型链可以继承原型对象的属性和方法，构造函数可以继承实例的属性且可以给父类传参

```javascript
function Animal (name) {
    this.name = name;
}
Animal.prototype = {
    canRun: function () {
        console.log('it can run!');
    }
}
function Cat (name, age) {
    Animal.call(this, name);
    this.speak = '喵！';
    this.age = age;
} 
Cat.prototype = new Animal();
Cat.prototype.constructor = Cat;
var cat = new Cat('tom', '12');
```

每一种继承方式都有自己的优点和不足，读者可以根据实际情况选择相应的方法。为了在实际开发中更方便的使用继承，可以封装一个继承的方法，如下：

```javascript
function extend (child, parent) {
    var F = function () {};
    F.prototype = parent.prototype;
    child.prototype = new F();
    child.prototype.construtor = child;
    child.superObj = parent.prototype;
    //修正原型的constructor指向
    if(!parent.prototype.contrucotor == Object.prototype.constructor){
        parent.prototype.constructor = parent;
    }
}

```

结合一开始的例子，可以这样实现继承的关系：

```javascript
function constructorFn (state, data) {
	this.data = data;
	this.state = state;
}
constructorFn.prototype.isPlay = function () {
	return this.state + ' is ' + this.data;
}
constructorFn.prototype.isDoing = 'nonono!';
function subFn (state, data) {
	subFn.superObj.constructor.call(this, state, data);
	//从superFn.constructor中调用 
}
extend(subFn,  constructorFn ); // 获取构造函数原型上的属性和方法


```

javaScript的继承远不止这些，，只希望可以让新学js的小伙伴不那么盲目的去刻意记一些东西，当然学习最好的办法还是要多写，最简单的就是直接打开浏览器的控制台，去验证自己各种奇奇怪怪的想法，动起来吧~

|-------赤裸裸的分割线-------|

彩蛋来啦：本周我们的客户端app 5.6版本就要正式发版啦，新版本新增了小视频功能呢，大家可以通过小视频分享自己各种购物经验，也可以发挥自己的脑洞，展示自己的才华，快来给我们的开发小哥哥打call吧~

[快速入口](https://app.zhuanzhuan.com/zz/redirect/download?channel=923)💗