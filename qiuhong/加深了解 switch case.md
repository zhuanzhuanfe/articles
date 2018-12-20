#### 工作原理

> 结束机制: 碰到break结束 or 整个执行完毕结束

首先设置表达式 n（通常是一个变量）。随后表达式的值会与结构中的每个 case 的值做比较。如果存在匹配，则与该 case 关联的代码块会被执行。请使用 break 来阻止代码自动地向下一个 case 运行。

* case的作用：case只是起到了**标号**（存储了指令的地址）的作用，只是执行的指令的入口，不会参加运算，也不起判断作用。
* break的作用：直接跳出选择结构，结束这一小节的程序，跳出。（辅助作用。并不属于switch语句）
* default：不满足case的任意条件的默认值。

#### 匹配规则

> switch case语句在比较的时候用的是全等, 也就是===

* case XX，其中XX的值：
    * 数字-整型
    * 数字-浮点型
    * 字符串
    * boolean
    * 表达式

#### 使用方式

```js
// 场景一

var index = false;
switch(index) {
   case false:
      console.log('demo-1');
      break;
   case '32':
      console.log('demo-2');
      break;
   case true:
      console.log('demo-3');
      break;
   case 2.1:
      console.log('demo-4');
      break;  
   case 5:
      console.log('demo-5');
      break;     
   default:
      console.log('demo-other');
      break;
}

打印结果：
demo-1

// 场景二

var index = 0;
switch(index) {
   case 0:
      console.log('demo-1');
   case 2:
      console.log('demo-2');
   case 3:
      console.log('demo-3');
      break;
   default:
      console.log('demo-other');
      break;
}

打印结果：
demo-1
demo-2
demo-3

// 场景三

var index = true, n = 10;
switch(index) {
   case n > 10 || n < 0:
      console.log('demo-1: ', n);
      break;
   case n <= 10 && n >= 0:
      console.log('demo-2: ', n);
      break;
   default:
      console.log('demo-other:', n);
      break;
}

打印结果：
demo-2:  10

// 场景四

var index = null;
switch(index) {
   case null:
      console.log('demo-1');
      break;
   case undefined:
      console.log('demo-2: ');
      break;
   case '':
      console.log('demo-3: ');
      break;    
   default:
      console.log('demo-other:');
      break;
}

打印结果：
demo-1

// 场景五：排除异常情况

var index = null; 
switch(index) {
   case !index:
      console.log('demo-1');
      break;
   default:
      console.log('demo-other:');
      break;
}

打印结果：
demo-1

```

#### 应用场景

> 如果是对几个固定值判断，推荐switch语句，因switch语句会将具体的答案都加载进内存，效率相对高一点。

* 【选择结构】switch
  * 对具体的值进行判断。 
  * 值的个数通常是固定的。
  * 基于不同的条件来执行不同的动作。
* 当if else 条件过多时，为了逻辑更加清晰和代码简洁性，可以使用  

#### 优缺点

* 优点：① 选择结构更加清晰，一目了然；② 执行速度相对较快
* 缺点：必须得类型相同，比如输入框的值switch匹配时，注意是否类型相同

#### 其他延伸

* 【判断结构 】if 应用场景
  * 对具体的值进行判断。 
  * 对区间判断。
  * 对于运算结果是boolean类型的表达式进行判断。
* === 与 == 的区别
  * 都false的情况：若不同编码的16位值，则=== or == 都是false ----> false
  * === 计算操作数的值进行比较：前提类型相同
    * 字符串内容和长度相同 且 对应的16位数均相等 ----> true
    * 指向同一个对象、数组、函数  ----> true
    * 至少一个NaN ----> false
    * 仅一个true or fasle ----> false
    * 仅一个null or undefined ----> false
    * 类型不同 ----> false
    * 全为数字且相等 ----> true
  * == 
    * 类型相同则与=== 相同
    * 类型不同: 会转换类型
      * null == undefined
      * 字符串转换成数字 '1' == 1 true
      * true 转换成 1， false 为 0
      * 对象、数字和字符串，转成原始值
      * 其他类型均不相等
* 如果只是简单场景，也可用以下
  * 如：条件 ? '1' : '2'
  * 如：a || b, 表示如果a: false or undefined or null or ''时，走b
  
#### 总结

代码整洁：switch 语句可以避免冗长的 if..else if..else 代码块

switch 语句和具有同样表达式的一系列的 if 语句相似。

switch 语句的用途：很多场合下需要把同一个变量（或表达式）与很多不同的值比较，并根据它等于哪个值来执行不同的代码。