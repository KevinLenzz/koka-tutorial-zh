# 恢复
(Resuming)

效应处理器的强大之处不仅在于我们可以让渡（yield）到最内层的处理器，还在于我们可以带着结果 **恢复（resume）** 回到调用点。

让我们定义一个 `ask<a>` 效应，它允许我们获取类型为 `a` 的上下文值。
```koka
effect ask<a>                   // 或 effect<a> ctl ask() : a
  ctl ask() : a

fun add-twice() : ask<int> int
  ask() + ask()
```
用 `ctl` 声明的操作在动态绑定时操作内部可以使用 `resume` 这个一等的函数。

`add-twice` 函数可以请求数字，但它并不关心这些数字是如何提供的——效应签名仅仅指定了一个上下文API。我们可以通过 恢复(resume) 时带上一个常量来处理，例如：
```koka
fun ask-const() : int
  with ctl ask() resume(21)
  add-twice()
```
其中ask-const()的求值结果为42。
>调用 `resume(x)` 的含义是：把 `x` 作为该 操作(operation) 调用的结果，并在当初调用操作的那个点继续执行。

或者通过返回随机值，例如：
```koka
fun ask-random() : random int
  with ctl ask() resume(random-int())
  add-twice()
```
现在，`ask-random()` 处理了 `ask<int>` 效应，但它自身现在具有 `random` 效应（参见 `std/num/random`）。

正如我们在异常示例中看到的，我们不需要调用 `resume`，也可以直接返回到我们的处理器作用域。例如，我们可能只想处理一次询问(`ask`)，但之后就放弃了：
```koka
fun ask-once() : int
  var count := 0
  with ctl ask()
    count := count + 1
    if count <= 1 then resume(42) else 0
  add-twice()
```
此处 `ask-once()` 的取值为 `0`，因为对 `ask` 的第二次调用不会恢复执行（并在 `ask-once` 上下文中直接返回 `0`）。这种模式可用于在计算仅被允许执行有限步数的场景中实现 **燃料(fuel)** 的概念。
>"fuel" 是计算理论中的一个隐喻性概念——表示计算可消耗的"步数配额"或"执行预算"。每执行一步扣减一点，耗尽即终止。在很多场景(沙箱/多租户、智能合约、交互式程序...)里，我们需要保证计算一定会终止，或者限制不可信代码的资源消耗。EVM 的 gas、Wasmtime 的 fuel metering 都是同一个概念在不同系统中的实例化。