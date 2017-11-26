在学习JavaScript的过程中，你是不是也遇到过这样的情况：看比人的代码感觉看懂了，过段时间回来再看，似乎又看不懂了，自己动手去写的时候，又不知该如何下手，怎么破？俗话说：好记性不如烂笔头，看的多，写的少，容易产生一种错觉，觉得很简单。

作为新人，我来分享一些自己总结的知识点吧，也许正是你需要的呢，哈哈~~~

### 对Array.prototype.slice.call()方法的理解
在看别人代码时，发现有这么个写法：[].slice.call(arguments, 0)，这到底是什么意思呢？一步一步来揭开它神秘的面纱。


**基础知识**
> arrayObject.slice(start,end)

从已有的数组中返回选定的元素，返回一个新的数组，包含从 start 到 end （不包括end位置元素）的 arrayObject 中的元素。该方法并不会修改数组，而是返回一个子数组。
> function.call()

该方法可以在特定的作用域中调用函数，可以认为是设置函数体内this对象的值，该方法需要逐个列出需要传递的参数。
> arguments对象

与数组类似（它并不是Array的实例），所以arguments对象没有slice方法，但是可以使用方括号语法访问它的每一个元素，同时使用arguments对象的length属性来确定实际传递进来多少个参数。
 
 > Array.prototype.slice.call()
 
 这个方法可以理解为：改变数组的slice方法的作用域，在特定作用域中去调用slice方法，call()方法的第二个参数表示传递给slice方法的参数即截取数组的起始位置。
 
 **原理**
 
 Array.prototype.slice.call(object)能将具有length属性并且除了length属性之外的其他属性值为数字（要转换成数组，而数组的索引就是数字类型）的对象转成数组。slice方法是定义在数组原型上的方法，而[]是Array对象的实例，所以可以使用[].slice()方法。
 ```
var obj = {0:'hello',1:'world',length:2};
console.log(Array.prototype.slice.call(obj,0));//["hello", "world"]
```
没有length属性的对象
```
var obj = {0:'hello',1:'world'};//没有length属性
console.log(Array.prototype.slice.call(obj,0));//[]
```

### JavaScript中的匿名函数遇上!发生了什么
通常，我们声明一个函数function test(){},然后就可以通过test()来调用这个函数。但是，如果我们在这个函数声明的末尾加上()，解析器可以正确解析么？
 ```
 function test(){
     console.log('hello world!');
 }();//Uncaught SyntaxError: Unexpected token )，解析器不知道该怎么解析这种语法

```
那为什么将函数体部分用()包裹起来就可以了呢？
```
(function test(){
    console.log('hello world!');
})(); //输出hello world!
```
解释器在解释一个语句时，如果以function开头，就会理解为函数声明。而使用括号包裹定义的函数体，解析器便会以函数表达式的方式去处理定义的函数，而函数表达式后面又添加了一个()就变成了一个立即执行的函数了，与下面的代码表达的意思相同。
```
var test = function() {
  console.log('hello world!');
}
test();
```

另外，其他逻辑运算符的作用与!和()作用相同，都可以使解析器将函数声明解析为函数表达式，从而正确的执行定义函数。
```
!function () {
    console.log('hello world!');
}();//输出hello world
```
如果省略了!,会怎么样呢？
```
function() {
    console.log('hello world!');
}();
```
如果没有!,解析器就会理解为函数声明，而函数声明没有函数名则会报错。

如果有函数名，没有!会怎么样呢？
```
function f() {
 console.log('hello world!');
}();
```
会发现，加上函数名之后还是会报错，这是为什么呢？因为在所有代码开始执行之前，解析器会通过函数声明提升这一特性来读取并且将函数声明添加到执行环境中，function f(){}函数声明提升之后，可以理解为：
```
function f(){
    console.log('hello world!');
}

 //其他业务逻辑代码

(); // 解析器在解析这一行代码的时候会报错。
```
希望这些总结能解决你的一些疑惑~~~学习JavaScript是一个渐进的过程，除了自己多做总结之外，还可以去社区中去回答别人提出的问题，不断给自己正向鼓励。骐骥一跃，不能十步，驽马十驾，功在不舍。多总结，多做笔记，多思考，不断踩坑，不断填坑，每天进步一点点，不断提高自己的专业技能。