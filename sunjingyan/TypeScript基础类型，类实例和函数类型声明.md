    TypeScript(TS)是微软研发的编程语言，是JavaScript的超集，也就是在JavaScript的基础上添加了一些特性.其中之一就是类型声明.

**一、基础类型**

TS的基础类型有 Boolean,Number,String,Array,Tuple,Enum,Any,Void,Null,Undefined,Never,Object.

==布尔类型 Boolean==

    let isDone: boolean = false

    *在变量名后用冒号:T(T 代表TS的类型)声明变量的类型。
    
==数字类型 Number==

    //支持十进制和十六进制,ES6中引入的二进制和八进制
    let decimal: number = 6;
    let hex: number = 0xf00d;
    let binary: number = 0b1010;
    let octal: number = 0o744;

==字符串类型 String==

    let name: string = `Gene`;
    let age: number = 37;
    let sentence: string = `Hello, my name is ${ name }.I'll be ${ age + 1 } years old next month.`;
==数组类型 Array==

    //有两种声明方式
    //1 T[]
    let list: number[] = [1, 2, 3];
    let list: any[] = [1, true, "free"];
    //2 Array<T>
    let list: Array<number> = [1, 2, 3];

==元组类型 Tuple==

    //可允许表示固定数量的数组，但是数组中可以具有不同的元素类型
    let x: [string, number];
    // Initialize it
    x = ['hello', 10]; // OK
    // Initialize it incorrectly
    x = [10, 'hello']; // Error
    
==枚举类型 Enum==

像java等其它语言一样，枚举类型可以为一组数值赋予友好的语义化名字.

    //默认从0开始编号，也可以只指定第一个元素的编号，之后的编号依次递增，也可以全部手动赋值编号；可以由枚举的值得到它的名字
    enum Color {Red = 1, Green, Blue} let colorName: string = Color[2]; alert(colorName); // 显示'Green'因为上面代码里它的值是2
    
==任意类型 Any==

任意类型直接让类型检查器通过编译阶段的检查.

    let notSure: any = 4;
    notSure = "maybe a string instead";//ok
    notSure = false; // ok
    
==Void类型==

与any类型相反，它表示没有任何类型

    //我们可以为一个没有任何返回值的函数的返回值类型定义为void
    function warnUser(): void {
        alert("This is my warning message");
    }
    //当声明一个void类型变量时，只能赋值为undefined 和 null
    let unusable: void = undefined;
    
==Null 和 Undefined==

    //默认情况下null和undefined是所有类型的子类型.
    let u: undefined = undefined;
    let n: null = null;
    
==Never类型==

never类型表示的是那些永不存在的值的类型。
never类型也是任何类型的子类型，也可以赋值给任何类型；

    // 返回never的函数必须存在无法达到的终点 
    function error(message: string): never { 
    throw new Error(message); 
    }


二、类型断言

类似其他语言的强制类型转换
类型断言有两种形式。

其一是“尖括号”语法：
    
     let someValue: any = "this is a string";
    
    let strLength: number = (<string>someValue).length;
另一个为as语法：

     let someValue: any = "this is a string";
    
    let strLength: number = (someValue as string).length;

三、类的实例的类型声明

    let greeter: Greeter;
    greeter = new Greeter("world");
四、函数类型的声明

函数类型包含两部分：参数类型和返回值类型，其中返回值类型ts可通过返回语句自动推断得出.

js中：

    function add(x, y) {
        return x + y
    }
TS中：

    function add(x: number, y: number): number {
	    return x + y;
	}
	
其中函数声明时的参数有必传参数，可选参数，默认参数，剩余参数.

==必传参数==

params:参数

==可选参数==

params?:参数类型

调用时可以不填；

==默认参数==

params=默认值

调用时可以不填；

声明时一般放在最后一个位置，如果不是，那么调用的时候必须要传入undefined参数值

    function buildName(firstName = "Will", lastName: string) {
        return firstName + " " + lastName;
    }
    
    let result1 = buildName("Bob"); // error
    let result2 = buildName("Bob", "Adams", "Sr.");  // error
    let result3 = buildName("Bob", "Adams");// ok
    let result4 = buildName(undefined, "Adams"); // ok

==剩余参数==

...restOfName: string[]

    function buildName(firstName: string, ...restOfName: string[]) {
        return firstName + " " + restOfName.join(" ");
    }
    
    let employeeName = buildName("Joseph", "Samuel", "Lucas", "MacKinzie");
