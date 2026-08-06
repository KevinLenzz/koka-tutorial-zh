# 副作用隔离​
(Side-effect Isolation)

## 恢复多于一次
由于 `resume` 是一等函数（嗯，几乎是），可以将其存储在列表中，例如用于实现调度器，但也可以多次调用它。这可以用于实现回溯或概率编程模型。

多次恢复的一个常见示例是 `choice` 效应：
```koka
effect ctl choice() : bool

fun xor() : choice bool
  val p = choice()
  val q = choice()
  if p then !q else q
```
一种可能的效应实现方式是就使用随机数：
```koka
fun choice-random(action : () -> <choice,random|e> a) : <random|e> a
  with fun choice() random-bool()
  action()
```
其中 `choice-random(xor)` 会随机返回 `True` 或 `False`。

不过，我们也可以多次恢复，一次使用 `False` ，一次使用 `True` ，以返回所有可能的结果。这也会将处理程序类型改为返回该action所有结果的列表，并且我们需要一个 **返回子句(return clause)**，将操作的结果包装在单元素列表中：
```koka
fun choice-all(action : () -> <choice|e> a) : e list<a>
  with handler
    return(x)    [x]
    ctl choice() resume(False) ++ resume(True)
  action()
```
其中 `choice-all(xor)` 返回 `[False,True,True,False]`。
多次恢复与状态效应的交互会产生有趣的结果。考虑以下同时使用 `choice` 和 `state` 的示例：
```koka
fun surprising() : <choice,state<int>> bool
  val p = choice()
  val i = get()
  set(i+1)
  if i>0 && p then xor() else False
```
我们可以通过两种有趣的方式组合这些处理器：
```koka
fun state-choice() : div (list<bool>,int)
  pstate(0)
    choice-all(surprising)

fun choice-state() : div list<(bool,int)>
  choice-all
    pstate(0,surprising)
```
在 `state-choice()` 中，`pstate` 是外层处理器，并像是一个全局状态，覆盖 `choice-all` 中的所有恢复链。因此，在第一次恢复之后，`surprising` 中的 `i>0（&&）p` 条件为真，我们得到 `([False,False,True,True,False],2)`。

在 `choice-state()` 中，`pstate` 是内部处理器，并变得像事务性状态，此时该状态对于choice-all中的每个恢复分支而言都是局部的。现在，i一开始总是为0，因此我们得到[(False,1),(False,1)]。
<hr/>

> 高级

这个示例还展示了 `var` 状态在恢复时如何作为栈的一部分被正确保存和复原，而这对效应处理器的正确组合至关重要。如果 `var` 声明改为堆分配或用引用捕获，它们将不再局限于各自的作用域，副作用可能会在不同恢复之间“泄漏”。

<hr/>