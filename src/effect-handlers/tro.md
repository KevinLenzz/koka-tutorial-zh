# 尾恢复操作
(Tail-Resumptive Operations)

`ctl` 操作是定义操作最通用的方式之一，因为在其中我们有一个能自己决定书写位置的一等的 `resume` 函数。然而，实践中几乎所有操作结果都是 **尾恢复性的(tail-resumptive)**：也就是说，它们恰好只恢复一次，并带有最终的结果值。为了方便，我们可以声明 `fun` 操作——这类操作 **在构造上（by construction）就保证了恰好一次尾恢复** ：它的语义被固定的翻译规则钉死为"求值 body 后立即恢复一次"，不可能出现不恢复或恢复多次的情况，即
```koka
with fun op(<args>){ <body> }
可翻译成
with ctl op(<args>){ val f = fn(){ <body> }; resume( f() ) }
```
（该翻译借助中间函数 `f` 包装操作体，使操作体（`<body>`）里可能出现的 `return` 语句能按预期工作：`return x` 会从中间函数返回 `x` 并传给 `resume`，而不是意外退出外层函数）

有了这种语法糖，我们可以用更有趣的 `fun` 操作来重写之前的 `ask-const` 示例：
```koka
fun ask-const2() : int
  with fun ask() 21
  add-twice()
```
这也更好地传达了一点：即便 `ask` 是动态绑定的，它的行为也就像一个普通函数，不会改变控制流。

此外，声明为 `fun` 的操作比一般的 `ctl` 操作效率要高得多。Koka编译器使用（广义的）**证据传递(evidence passing)** 将处理器信息传递到每个调用点。在 `add-twice` 中对 `ask` 的调用中，编译器从证据向量(evidence vector)中选择处理器，当操作是尾恢复性的 `fun` 时，它会像普通函数一样直接调用它（只是针对其上下文调整了证据向量）。与一般的 `ctl` 操作不同，`fun` 操作无需向上让渡到处理器、捕获恢复栈，并最终恢复。这使得 `fun`（和下文 `val`）操作的性能开销非常接近 **虚方法（virtual method）** 调用，其效率可以相当高。

为了获得更佳性能，你还可以在效应定义时直接提前声明任何操作定义都必须是尾部可恢复的，具体如下：
```koka
effect ask<a>
  fun ask() : a
```
这限制了 `ask` 效应的所有处理器定义使用 `ask` 操作的 `fun` 定义。但是，它方便了阅读和推理代码，并且编译器可以进一步优化此类调用，因为它不再需要在运行时检查处理器是否恰好将操作定义为尾恢复。

<div class="advanced">
<span style="color: gray">高级</span><br/>
为了获得更佳性能，可以将效应标记为 <b>线性的(linear)</b>。此类效应在静态上保证永远不会使用一般的控制操作，也永远不需要捕获恢复。在编译期间，这消除了进行单子转换的需要，并提升了任何使用此类效应的效应多态的函数（如 <code>map</code> 或 <code>foldr</code>）的性能。线性效应的示例包括状态（<code>st</code>）以及内置效应（如 <code>io</code> 或 <code>console</code>）。
</div>

## 值操作
(Value Operations)

一类常见的操作子集始终以单个值进行尾恢复；这些本质上就是动态绑定变量（但具有静态类型！）。此类操作可以通过以下翻译方式声明为一个val：
```koka
with val v = <expr>
可翻译成
val x = <expr>
with fun v(){ x }
可翻译成
val x = <expr>
with ctl v(){ resume(x) }
```
作为值操作的一个使用示例，可以设想一个从文档生成漂亮字符串的漂亮打印机：
```koka
fun pretty( d : doc ) : string
```
不幸的是，在 `pretty` 的代码深处，它硬编码了最大显示宽度(width)为40：
```koka
fun pretty-internal( line : string ) : string
  line.truncate(40)
```
为了对宽度进行抽象，我们有几种选择：可以把宽度作为一个常规参数，但这样一来，我们就需要在库中的所有函数里显式地添加这个参数，并手动地在各处传递它。另一种选择是使用一个全局可变变量，但这会引入副作用，并且缺乏模块化。

或者，我们可以将其定义为一种值操作（value operation）：
```koka
effect val width : int
```
这还允许我们像使用常规值一样来引用 `width` 操作（尽管在内部它实际会调用该操作）。因此，在漂亮打印机（pretty printer）中检查宽度时，可以这样写：
```koka
fun pretty-internal( line : string ) : width string
  line.truncate(width)
```
在使用漂亮打印机时，我们可以将 `width` 绑定为一个常规的效应处理器：
```koka
fun pretty-thin(d : doc) : string
  with val width = 40
  pretty(d)
```
请注意，我们并不需要改变原始库函数的结构。不过，函数的类型仍然会发生变化，因为这些函数现在需要包含 `width` 效应，这意味着宽度值必须在某个时候被处理。例如，`pretty` 的类型变为：
```koka
fun pretty( d : doc ) : width string
```
因为它需要处理 `width` 效应（也可以称为“为 `width : int` 定义动态绑定”，或称为“`width` 能力（capability）”）。

- **`ctl`**：控制操作，调用时会挂起当前执行，捕获续延，`handler` 可通过 `resume` 恢复
- **`fun`**：函数操作，像普通函数一样调用，不改变控制流，`handler` 直接计算并返回
- **`val`**：值操作，本质上是一个动态绑定的值（常量），编译期会被翻译成特殊的 `fun` 或 `ctl`