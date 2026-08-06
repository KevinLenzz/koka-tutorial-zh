# with语句
(With Statements)

据我所知，Koka 是第一个把尾随 Lambda 作为通用语法特性并与缩进布局深度整合的语言。它也是最早拥有点表示法的语言之一（这是独立开发的，但事实证明 D 语言具有类似的功能（称为 UFCS），它早于点表示法）。

另一个新颖的语法是 `with` 语句。由于可以轻松地将函数块（多行同层代码形成一个块，整个可被包起来采用为匿名函数）作为参数传递，它们通常会被嵌套使用。
<br/>
先看一段代码：
```koka
fun twice(f)
  f()
  f()

fun test-twice()
  twice
    twice
      println("hi")
```
其中"hi"被打印四次（注意：这脱糖为
```koka
twice( fn(){ twice( fn(){ println("hi") }) })
```
）。使用 `with` 语句我们可以同缩进地写为：
```koka
pub fun test-with1()
  with twice
  with twice
  println("hi")
```
`with` 语句本质上将其后面的所有语句放入匿名函数中，并将该匿名函数作为最后一个参数传递。一般来说：
```koka
with f(e1,...,eN)
<body>
可被翻译为
f(e1,...,eN, fn(){ <body> })
```
此外，`with` 语句还可以绑定变量参数，如下所示：
```koka
with x <- f(e1,...,eN)
<body>
可被翻译为
f(e1,...,eN, fn(x){ <body> })
```
下面是一个使用 `foreach` 跨越函数体其余部分的示例：
```koka
pub fun test-with2() {
  with x <- list(1,10).foreach
  println(x)
}
```
其中函数体脱糖为
```koka
list(1,10).foreach( fn(x){ println(x) } )
```
这让人想起 Haskell do 表示法。以这种方式使用 `with` 语句一开始可能看起来有点奇怪，但在实践中非常方便 - 它有助于将 `with` 视为词法范围统摄当前块下方其余部分代码的闭包。

## with finally
`finally` 函数将匿名函数采用为其第一个参数，离开作用域时回调这个函数，无论正常退出或通过“exception”（即当效应操作未恢复时）退出。`with` 与其配合很好：
```koka
fun test-finally()
  with finally{ println("exiting..") }
  println("entering..")
  throw("oops") + 42
```
脱糖为
```koka
finally(fn(){ println(...) }, fn(){ println("entering"); throw("oops") + 42 })
```
打印为
```
entering..
exiting..
uncaught exception: oops
```
这是 **最小生成原则（min-gen principle）** 的一个例子：许多语言对这种模式都有特殊的内置支持，比如 defer 语句，但在 Koka 中，这只是一种简朴的函数的语法糖的应用。

## with‌ handler
`with` 语句与效应处理器（effect handler）结合使用特别有用。效应描述了一组抽象操作，其具体实现可以由处理器动态绑定。以下是用于发出消息的效应处理程序的示例：
>操作（operation）就是你自定义的一种"效应原语"——它声明了"程序可能会做某件事"，但不规定这件事具体怎么做；具体怎么做由后面的 处理器（handler）​ 来提供。
```koka
// 生命一个抽象的操作: emit, 它如何发出消息由处理器动态定义。
effect fun emit(msg : string) : ()

// 发出一个标准的问候
fun hello() : emit ()
  emit("hello world!")

// 发出一个标准的问候到终端
pub fun hello-console1() : console ()
  with handler
    fun emit(msg) println(msg)
  hello()
```
在此示例中，`with` 表达式脱糖为
```koka
(handler{ fun emit(msg){ println(msg) } })( fn(){ hello() } )
```
通常，`handler{ <ops> }`表达式将一个函数块采用为其最后一个参数，因此可以直接与 `with` 一起使用。

此外，为了方便起见，对于仅定义一个操作的效应（比如 `emit`），我们可以省略 `handler` 关键字：
```koka
with val op = <expr>
with fun op(x){ <body> }
with ctl op(x){ <body> }
可被翻译为
with handler{ val op = <expr> }
with handler{ fun op(x){ <body> } }
with handler{ ctl op(x){ <body> } }
```
利用这种便利，我们可以将前面的示例更简洁地编写为：
```koka
pub fun hello-console2()
  with fun emit(msg) println(msg)
  hello()
```
直观地，我们可以将处理器`with fun emit`的作用视为给作用域内剩余内容动态绑定了一个对 `emit` 函数的定义