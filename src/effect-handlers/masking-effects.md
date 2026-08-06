# 效应掩蔽
(Masking Effects)

类似于Unix中的信号屏蔽（masking signals），我们可以掩蔽（mask）效应，使其不被最内层的效应处理器处理。表达式 `mask<eff>(action)` 会模块化地掩蔽 `action` 内部所有属于 `eff` 的效应操作。例如，考虑两个嵌套的 `emit` 操作处理器：
```koka
fun mask-emit()
  with fun emit(msg) println("outer:" ++ msg)
  with fun emit(msg) println("inner:" ++ msg)
  emit("hi")
  mask<emit>
    emit("there")
```
如果我们调用 `mask-emit()`，它会打印：
```koka
inner: hi
outer: there
```
第二次 `emit` 调用被掩蔽，因此它会跳过最内层的处理器，随后由外层的处理器处理（即掩蔽只会对于最内层处理器掩蔽一次操作）。

泛型处填入某种效应标签 `l` 的掩蔽 `mask<l>` 的类型是 `(action: () -> e a) -> <l|e> a` ，其中它将效应 `l` 注入到最终的效应结果 `<l|e>` 中（尽管掩蔽本身实际上从不执行任何属于 `l` 的操作——它只是在 `action` 中掩蔽了所有属于 `l` 的操作）。

此类型通常会导致重复的效应标签，例如，`mask<emit>{ emit("there") }` 的效应为 `<emit,emit>`，表示需要有两个针对 `emit` 的处理器：在这种情况下，一个应跳过，另一个随后处理被屏蔽的操作。
## 效应抽象
(Effect Abstraction)

前面的例子不太实用，但一般来说，我们可以使用掩蔽来隐藏高阶函数中的内部效应处理。例如，考虑以下需要处理内部异常的函数：
```koka
fun mask-print( action : () -> e int ) : e int
  with ctl raise(msg) 42
  val x = mask<raise>(action)
  if x.is-odd then raise("wrong")   // 内部异常
  x
```
在这里，`mask-print` 的类型完全没有暴露出我们为特定代码在内部处理 `raise` 效应，并且它是完全抽象的——即使动作本身会调用`raise`，由于 `mask<raise>` 表达式，它也会巧妙地跳过内部处理器。

如果我们去掉掩蔽，直接调用 `action()`，那么 `action` 的推断类型将是 `() -> <raise|e> int` ，表明 `raise` 效应会被处理。请注意，这通常是所期望的行为，因为在大多数情况下，当我们定义处理器抽象时，我们希望以特定方式处理效应。根据我们的经验，需要 `mask` 的情况要少得多。
<hr/>

> 高级

## 状态作为一种被组合的效应

掩蔽另一个很好的用例是，在直接使用效应处理器建模状态时，无需使用可变局部变量<sup>[1]</sup>。我们可以通过两个独立的操作 `peek` 和 `poke` 来实现这一点：
```koka
effect<a> val peek : a             // 获得状态
effect<a> ctl poke( x : a ) : ()   // 把状态赋为x
```
我们现在可以将带泛型的状态处理器定义为：
```koka
fun ppstate( init : a, action : () -> <peek<a>,poke<a>|e> b ) : e b
  with val peek = init
  with ctl poke(x)
    mask<peek>
      with val peek = x
      resume(())
  action()
```
在 `poke` 的处理函数中，我们在一个绑定到新状态的、全新的 `peek` 处理函数下恢复执行。这意味着，尽管会存在一个不断增长的 `peek` 处理器“栈”，但为了保持类型不会无限增长，我们需要掩蔽掉对先前 `peek` 处理函数的任何潜在操作，这正是 `mask` 存在的必要原因。（另一种理解方式就是直接遵循类型规则： `action` 具有 `peek` 效应，并且与 `poke` 操作定义的效应统一。由于它自身处理了 `peek` 效应，因此需要借助 `mask` 将其重新注入回去。）

> [!NOTE]
> 由于处理器栈随 `poke` 调用次数无限增长，因此这个示例主要是具有理论上的意义。但是，我们正在研究一种栈粉碎（stack smashing）技术：在运行时检测到掩蔽可以从栈中丢弃处理器帧。）

<hr/>