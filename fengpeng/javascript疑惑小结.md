今天在写代码的时候，我犯了一个low的错误，废话不多说，直接上代码：
function (){console.log(‘hello world’)}()。大家看到之后，第一反应肯定是想：这不是很简单嘛，用()把匿名函数包裹起来就ok了啊，但这是为什么呢？我们一起来探讨下其中的原理吧~~~


###疑惑解答
为什么下面这种写法会报错呢？
```
function() {
  console.log('hello world');
}()
```

原来，浏览器遇到function关键字的时候会认为这是一个函数声明，函数声明必须包括：关键字function、函数名、形参、函数体。在解析上面代码的时候，解析器发现没有出现函数名而直接出现了()，浏览器便会认为这种定义不符合规范，所以就报错了呗。

既然是缺少函数名，那如果我们给它添加函数名，是不是会正确调用呢？

```
function hello (){
    console.log('hello world');
}()
```

静静等待奇迹出现~~~咦？浏览器在解析的时候怎么又报错了呢？想一想，函数声明是不是有个特权----函数声明提升，也就是说通过函数声明方式声明的函数会被提升到其他代码的前面，提升之后是不是就是这样了：

```
function hello () {
    console.log('hello world');
}
 ...//我们在业务中编写的除了函数之外的其他代码
 
 (); // 咦？这是什么东东？
```

解析器对此也很茫然，不知道该按照什么标准去解析了，只能告诉你写的不够规范了~
大家看一下下面的这种用法，有木有感觉很熟悉呢？

```
var hello = function () {
    console.log('hello world');
}
hello();
```

试想一下，如果用()把上面的函数名hello包裹起来，会发生什么呢?

```
var hello = function () {
    console.log('hello world');
}
(hello)();
```
哈哈，浏览器输出了“hello world”，这种写法是不是特别像数学中的结合律啊~~~

继续对上面的函数调用做一些改变，如果把函数名hello替换成匿名函数,猜想应该也可以调用成功吧？

```
(function() {
  console.log('hello world');
})();
```

呦呵，调用成功了诶~这是为什么呢？因为用()把匿名函数包裹起来，解析器便会认为这是一个函数表达式，函数表达式的后面添加()当然可以正确执行了。此外，除了()之外,也可以使用!等常见的一元运算符来执行匿名函数。

```
!function() {
  console.log('hello world');
}();
```

上面这段代码也会输出“hello world”。

**PS：**
说到函数定义，需要注意函数声明和函数表达式两者的区别（大神们可以跳过喔~）：前者有个函数声明提升的过程，在代码预解析的时候，会把函数声明提升到代码的顶部，所以在声明函数位置之前调用函数并不会出错；而后者只是进行变量提升，因此，解析器只有执行函数表达式的代码之后才可以调用该函数。


函数总是在特定的作用域中执行的，函数中this的指向是不是也令很多人迷惑呢？一起来探讨其中的奥秘吧~~~
### 走进函数的作用域
一般情况下，this指向调用函数（方法）的对象。

直接调用函数，可以认为是全局对象在调用函数，则函数内部的this指针是指向Global对象，在浏览器中便是指向window对象。

```
function hello () {
       console.log(this); // window
   }
```
### 函数的其他用法
#####作为构造函数来使用

在其他语言中可以通过类实现面向对象的功能，但是在ES6规范公布之前，JavaScript中并没有类的概念，面向对象的语法只能通过构造函数的方式来实现。

```
function Phone (name, size) {
    this.name = name;
    this.size = size;
}
Phone.prototype.getInfo = function () {
   return {
            name: this.name,
            size: this.size
           }
 }
```

要得到对象，必须使用new关键字

```
    var phone = new Phone('iPhoneX',5.8);

```

 在ES6之前，使用构造函数来创建对象，阅读起来并不是很清晰。ES6提供的class语法跟其他面向对象的语言语法较为接近。
 使用ES6的语法来改写一下上面用构造函数定义的“类”。
 
 ```
 class Phone {
    constructor (name, size) {
        this.name = name;
        this.size = size;
    }
    getInfo () {
        return {
                 name: this.name,
                 size: this.size
                }
    }
    
 }
 let phone = new Phone('iPhone',5.8);
```

看起来是不是特别像C++语言中的面向对象风格呢~~~



### 改变函数的作用域

函数作为特殊的对象，也有自己的方法，每一个函数都有2个比较重要的改变作用域的方法：apply和call，通过这两个方法，可以改变函数中this的指向。主要的区别是传递参数的方法不同，apply接收数组或者类数组（arguments对象），而call只能逐个传递需要的参数。在记忆的时候可以通过首字母来区分，由于数组array的第一个字母也是a，所以可以据此记忆applay接收数组作为参数。
在学习比人代码的过程中，看到有这么个写法：Array.prototype.slice.call()，根据以上内容来，我们来一步一步来揭开它神秘的面纱吧。



### ES6中函数的变化
 
 1、箭头函数
 
 在ES6语法中，可以使用=> 来定义函数，这样定义函数使得表达更加的精简。
 
 ```
   const hello = () => {
        console.log('hello');
    }
```

()中是声明函数时的形参，{}中是函数体。

**箭头函数和以前用function声明的函数有什么区别呢？**

主要区别在于this的指向不同，箭头函数中this的对象指向比较固定，在定义函数的时候，this的指向就已经确定了，会指向定义函数时所处的对象。这一点在异步调用时尤为明显。

```
var num = 100;
var count = {
	num:1,
	add:function(){
		setInterval(function(){
			this.num++;
			console.log(this.num);
		},1000);
	}
}
count.add(); // 101,102...
```

setInterval方法是异步调用的，并且是在全局作用域中执行的，所以，上述代码中的this指向window对象，而我们的额本意是要使得对象内部的num递增，所以，我们只能考虑手动设置this的指向。


在上面的代码中，保存对象的this指针或者通过bind方法改变this的指针，都可以输出预期的效果。如果使用箭头函数的话，则不需要手动设置this的指向，就能达到我们预期的效果：

```
var num = 100;
var count = {
	num:1,
	add (){
		setInterval(() => {
			this.num++;
			console.log(this.num);
		},1000);
	}
}

count.add();// 2,3...
```

箭头函数不能用作构造函数。很明显，由于箭头函数没有属于自己的this对象，所以，无法作为构造函数去使用。

 


学习JavaScript是一个渐进的过程。JavaScript语言中的函数内容相当丰富，需要不断去通过实践去加深理解。骐骥一跃，不能十步，驽马十驾，功在不舍。多总结，多做笔记，多思考，不断踩坑，不断填坑，每天进步一点点，不断提高自己的专业技能。