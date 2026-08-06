# 返回操作
(Return Operations)

在之前的 `emit-collect` 示例中，我们看到了 `return` 返回操作的使用。这种操作会改变处理器动作（action）的最终结果。例如，考虑我们之前使用的自定义异常效应 `raise`。我们可以定义一个带泛型的处理器，将任何异常动作转换为返回一个 `maybe` 类型的动作：
```koka
fun raise-maybe( action : () -> <raise|e> a ) : e maybe<a>
  with handler
    return(x)      Just(x)   // normal return: wrap in Just
    ctl raise(msg) Nothing   // exception: return Nothing directly
  action()


fun div42()
  (raise-maybe{ safe-divide(1,0) }).default(42)
```
（div42的函数体脱糖后为 `default( raise-maybe(fn(){ safe-divide(1,0) }), 42 )`）

## 一个起名为 `state` 的效应
为了更全面地了解返回操作的用法，我们来看一下一个起名为 `state` 的效应，表示一种状态访问方式。在最一般的形式下，它仅包含一个设置（set）操作和一个获取（get）操作：
```koka
effect state<a>
  fun get() : a
  fun set( x : a ) : ()

fun sumdown( sum : int = 0 ) : <state<int>,div> int
  val i = get()
  if i <= 0 then sum else
    set( i - 1 )
    sumdown( sum + i )
```
我们可以通过使用 `var` 声明来最简便地定义一个带泛型的状态处理器：
```koka
fun state( init : a, action : () -> <state<a>,div|e> b ) : <div|e> b
  var st := init
  with handler
    fun get()  st
    fun set(i) st := i
  action()
```
其中 `state(10){ sumdown() }` 的求值结果为 `55`。

在前一个状态示例的基础上，假设我们还希望返回最终状态。一种简洁的做法是再次利用返回操作，将最终结果与最终状态配对在一起：
```koka
fun pstate( init : a, action : () -> <state<a>,div|e> b ) : <div|e> (b,a)
  var st := init
  with handler
    return(x)  (x,st)       // pair with the final state
    fun get()  st
    fun set(i) st := i
  action()
```
其中 `pstate(10){ sumdown() }` 求值结果为 `(55, 0)`。

<hr/>

> 高级

甚至有可能定义一个只包含返回操作的处理程序：这样的处理程序完全不处理任何效应，而仅仅转换函数的最终结果。例如，我们可以用单独的返回处理程序来定义前面的示例，如下所示：
```koka
fun pstate2( init : a, action : () -> <state<a>,div|e> b ) : <div|e> (b,a)
  var st := init
  with return(x) (x,st)
  with handler
    fun get()  st
    fun set(i) st := i
  action()
```
这里有点牵强，但它可以使某些程序的定义更加简洁，例如[5]。

<hr/>