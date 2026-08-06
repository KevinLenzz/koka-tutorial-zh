# 匿名函数和尾随Lambda
(Anonymous Functions and Trailing Lambdas)

Koka 还允许使用 `fn` 关键字的匿名函数表达式。例如，我们也可以不声明 `encode-char` 函数，而是将其作为函数表达式直接传递给 `map` 函数：
```koka
fun encode2( s : string, shift : int )
  s.map( fn(c)
    if c < 'a' || c > 'z' then return c
    val base = (c - 'a').int
    val rot  = (base + shift) % 26
    (rot.char + 'a')
  )
```
在上一个示例中，我们必须将最后一个右小括号放在最后一个大括号（fn关键字定义的匿名函数的函数体大括号，这里通过缩进省略了让编译器自己加）后面，这有点烦人。为了方便起见，Koka 允许匿名函数跟随函数调用——这也称为尾随 lambda。例如，下面是我们如何打印数字 1 到 10：
```koka
fun print10()
  for(1,10) fn(i)
    println(i)
```
脱糖为
```koka
for( 1, 10, fn(i){ println(i) } )
```
（事实上​​，由于我们将 i 参数直接传递给 `println`，我们也可以直接传递函数本身，如`for(1,10,println)`。）


例二、
```koka
fun printhi10()
  repeat(10)
    println("hi")
```
其中函数体脱糖为
```koka
repeat( 10, { println(hi) } )
```
进一步脱糖为
```koka
repeat( 10, fn(){ println(hi)} )
```
这对于 `while` 循环特别方便，因为这不是内置的控制流结构，而只是一个常规函数：
```koka
fun print11()
  var i := 10
  while { i >= 0 }
    println(i)
    i := i - 1
```
请注意 `while` 的第一个参数是如何用大括号而不是通常的小括号括起来的。在 Koka 中，小括号之间的表达式始终在函数调用之前求值，而大括号之间的表达式被挂起，并且可能永远不会被求值，也可能被多次求值（如我们的示例中）。