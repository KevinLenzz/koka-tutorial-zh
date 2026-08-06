# Hello world!
## 函数定义
函数用fun关键字声明，声明的同时必须写出函数体，进行完整定义

以 `main`函数 为 程序入口，打印输出 Hello world!：
```koka
fun main() {
  println("Hello world!") // println output
}
```

这是使用 显式大括号 的写法

由于 “大括号省略” (brace elision) 规则，
<br/>
当下一行有 更深缩进 时，
<br/> 
编译器预处理会 自动用花括号包裹 下一行所在的整个缩进块。
<br/>
也就是说，以上示例也可以写为
```koka
fun main()
  println("Hello world!") // println output
```

koka编译器 不关心 缩进所用具体空格数，只看 是否比上一行深。
<br/>
你可以使用 任意数量空格 完成 更深的缩进，需保证 对应逻辑行同深度缩进。

不论用 7个空格 还是 1个空格 进行缩进，在以下位置都是合法的，且不影响编译器的分析：
```koka
fun main()
       println("Hello world!") // 7空格缩进
fun foo()
 println("bar") // 1空格缩进
```

函数的参数、返回值用 :T 标明类型
```koka
fun main()
  println(add1(1,2))
fun add1(a:int,b:int):int
  add2(a,b) // 语句
fun add2(a:int,b:int):int
  a+b // 表达式
```
在 Koka 里，函数定义通常不分前后——你可以在 `main` 里调用一个在后面才定义的函数，编译器不会报错。Koka 把一个 .kk 文件看作一个模块，模块内所有顶层 `fun` 声明在类型检查阶段对整个模块可见。编译器先做声明收集，把所有函数名及其类型签名登记到符号表，然后再做类型推断与检查。所以无论书写顺序如何，调用方都能找到被调用方。
<br/>
在函数体内部，用 `fun` 定义的局部函数遵循"先定义后使用"的顺序——因为局部作用域是语句序列，按顺序执行。如果你在局部作用域里前向引用一个局部 `fun`，通常会报错。


部分语法产生式：
```
funbody   → funparam blockexpr
blockexpr → expr (块(block)被解释为一系列语句(statements))
expr      → withexpr 	
              block (被解释为空参匿名函数fn(){...})
              returnexpr
              valexpr
              basicexpr
block     → [{] semis { statement semi } [}]
...
```
函数里的 最后一个表达式的值 可作为 函数的返回值
<br/>
语句在语法上可规约到表达式，所以
<br/>
函数里的 最后一个语句的结果 可作为 函数的返回值
<br/>
你也可以显式地使用 `return` 关键字来返回
## 变量定义
```koka
val a=foo+bar()
val foo=123
fun bar()
  var baz:=100
  baz
fun main()
  val bar=456
  var baz:=789
  baz:=0
  println(a+bar+baz)
```
Koka的变量都必须在声明的同时绑定一个初值——没有"先声明、后赋值"这种写法。
<br/>
顶层只能使用 `val` 定义静态值，是一种不可变绑定，整个模块可见，右值不要求是"编译期可计算"的常量表达式，使用与定义的行顺序无关。
<br/>
<br/>
代码块内既可以 使用 `val` 定义静态值：`val [value_name]=[expr]`
<br/>
也可以 用 `var` 定义有可变引用的变量：`var [variable_name]:=[expr]`
<br/>
但是先定义后使用，具有块级作用域
<br/>
变量通过 `[variable_name]:=[expr]` 赋值