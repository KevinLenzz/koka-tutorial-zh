# 处理器重写
(Overriding Handlers)

掩蔽的一个常见用途是重写覆盖掉处理器。例如，考虑重写 `emit` 的行为。
```koka
fun emit-quoted1( action : () -> <emit,emit|e> a ) : <emit|e> a
  with fun emit(msg) emit("\"" ++ msg ++ "\"")
  action()
```
在这里，`emit` 的处理器调用自身 `emit` 来实际发出新引用的字符串。为 `emit-quoted1` 推断出的效应类型是 `(action : () -> <emit,emit|e> a) -> <emit|e> a`。这并不是最理想的类型，因为它暴露了 `action` 是在（至少）两个 `emit` 处理器下被求值的（这使得别人可以在 `action` 内部使用 `mask` 来调用外部的 `emit` 处理器）。

`override` 关键字保持了类型的一致，并完全重写了之前的处理器，该处理器不再可从 `action` 中访问。
```koka
fun emit-quoted2( action : () -> <emit|e> a ) : <emit|e> a
  with override fun emit(msg) emit("\"" ++ msg ++ "\"" )
  action()
```
这当然适用于任何处理器或值，例如，要在漂亮打印的例子里临时增加宽度（`width`），我们可以通过以下方式重写 `width`：
```koka
fun extra-wide( action )
  with override val width = 2*width
  action()
```
<hr>

> 高级

不幸的是，我们无法仅通过掩蔽来模块化地定义重写；如果我们在 `emit` 处理器之外添加掩蔽，那么操作定义内部的 `emit` 调用会被掩蔽，从而跳过我们预期的处理器。另一方面，如果我们仅在 `action` 上添加掩蔽，那么它的所有 `emit` 调用都将被掩蔽，同样无法命中我们预期的处理器！

对于这种情况，还有另一种原语。表达式 `mask behind<eff>` 的类型为 `(() -> <eff|e> a) -> <eff,eff|e> a`，它只遮蔽任何被遮蔽的操作，而不遮蔽直接的操作。`override` 关键字就是基于这个原语定义的：
```koka
with override handler<eff> { <ops> }
<body>
可被翻译成
(handler<eff> { <ops> })(mask behind<eff>{ <body> })
```
这确保了在 `<body>` 中的任何操作调用都会转到新定义的处理器，而被掩蔽的操作则会再向上掩蔽一层，从而跳过最内层的两个处理器。

<hr>