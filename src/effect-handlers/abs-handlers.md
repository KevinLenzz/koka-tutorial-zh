# 抽象处理器
(Abstracting Handlers)

上一章我们总是把处理器内联写在 `with` 里。这一章的"抽象"指：**`handler{...}` 表达式本身就是一个函数（一等值），因此可以把处理器抽离成独立的、可命名、可参数化、可复用的函数**，再通过 `with` 注入到任意计算中。下面用写者效应逐步演示。

作为另一个例子，**写者(writer)** 效应非常常见，其中值由处理器收集。例如，我们可以定义一个 `emit` 效应来发出消息：
```koka
effect fun emit( msg : string ) : ()
```
```koka
fun ehello() : emit ()
  emit("hello")
  emit("world")
```
我们可以定义一个处理器，例如直接将发出的消息打印到控制台：
```koka
fun ehello-console() : console ()
  with fun emit(msg) println(msg)
  ehello()
```
这里处理器是直接定义的，但我们也可以将为控制台发出消息的处理器抽象为一个单独的函数：
```koka
fun emit-console( action )
  with fun emit(msg) println(msg)
  action()
```
其中 `emit-console` 的推断类型为 `(action : () -> <emit,console|e> a) -> <console|e> a`，其中 `action` 可以使用效应 `emit`、`console` 以及任何其他效应 `e`，而最终效应仅为 `<console|e>`，因为 `emit` 效应已被处理器消解。
注意，我们也可以将上述代码写成：
```koka
val emit-console2 = handler
  fun emit(msg) println(msg)
```
因为 `handler{ ... }` 表达式本身就是一个函数（因此也是一个值）。不过我们通常更倾向于前面的定义，因为它允许添加额外的参数，例如初始状态。
由于 `with` 的通用性，我们可以像使用常规处理器一样使用抽象化的处理器，我们之前的示例可以写成：
```koka
fun ehello-console2() : console ()
  with emit-console
  ehello()
```
（这展开为 `emit-console( fn(){ ehello() } )`）。另一个有用的处理器可能会收集所有发出的消息作为字符串列表：
```koka
fun emit-collect( action : () -> <emit|e> () ) : e string
  var lines := []
  with handler
    return(x)     lines.reverse.join("\n")
    fun emit(msg) lines := Cons(msg,lines)
  action()
```
```koka
fun ehello-commit() : string
  with emit-collect
  ehello()
```
这是一个完全处理器（total handler），仅消解 `emit` 效应。
作为另一个例子，考虑一个带泛型的 `catch` 处理器，当对我们的异常示例调用 `raise` 时，它会应用一个处理函数：
```koka
fun catch( hnd : (string) -> e a, action : () -> <raise|e> a ) : e a
  with ctl raise(msg) hnd(msg)
  action()
```
我们现在可以方便地使用 `with` 语句来处理异常情况：
```koka
fun catch-example()
  with catch( fn(msg){ println("error: " ++ msg); 42 } )
  safe-divide(1,0)
```
<hr/>

> 高级

`catch` 处理器有一个有趣的类型，其中 `action` 可以具有 `raise` 效应（`() -> <raise|e> a`）以及可能更多的效应 `e`，而处理函数 `hnd` 仅具有效应 `e`。现在考虑提供一个本身会调用 `raise` 的处理函数：在这种情况下，`catch` 的类型会被实例化为：`(hnd: (string) -> <raise> a, action : () -> <raise, raise> a ) : <raise> a`。这是正确的：`action` 的（外层）`raise` 效应被处理并消解，但由于处理函数 `hnd` 仍可能引发 `raise`，最终效应仍然包含 `raise`。

在这里我们看到 Koka 允许重复的效应标签[8]，其中 `action` 具有实例化的 `<raise,raise>` 效应类型。这类类型在多态效应存在时会自然出现，并且与运行时证据向量的结构有自然的对应关系（每个嵌套效应处理器对应一个条目）。直观地说，`action` 的效应表明其外层（最左侧）的 `raise` 已被处理，但可能还有其他未处理的异常——在这种情况下来自处理函数 `hnd`，但它们也可以是掩蔽的异常。

<hr/>