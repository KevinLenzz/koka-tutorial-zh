# 处理器组合
(Combining Handlers)

<hr/>

> 高级

是什么让效应处理器成为一种良好的控制流抽象？与其他方法相比，它有三个根本性优势：
1. 效应处理器可以拥有简单的（Hindley-Milner）类型。这与 `shift`/`reset` 不同，例如后者需要带有答案（answer）类型的类型规则（因为 `shift` 的类型取决于其匹配的 `reset` 的上下文）。
2. 效应处理器的作用域由处理器定义所限定。这类似于shift/reset，但与call/cc不同。限定 恢复（resumption）的范围 具有多种良好特性，例如高效的实现策略，同时也允许模块化组合（另见Oleg Kiselyov的“反对call/cc”一文）。
3. 效应处理器可以自由组合。这与一般的单子（monads）不同，后者需要单子转换器以特定方式进行组合。本质上，效应处理器可以自由组合，因为每个效应处理器最终都可以表示为自由单子的实例，而自由单子是可组合的。这也意味着某些单子无法表示为效应处理器（即非代数（non-algebraic）单子）。一个具体的例子是续延（continuation）单子（它可以表达`call`/`cc`）。

不过，Koka编译器内部使用单子和`shift`/`reset`来编译效应处理器，并将处理器编译为基于多提示分隔控制的内部自由单子。通过内联单子的绑定操作，我们能够生成高效的C代码，只在实际让渡到通用 `ctl` 操作的情况下才分配续延。

<hr/>

效果处理器的一个出色特性是它们可以自由组合。例如，假设我们有一个函数，当状态为奇数时它会调用 `raise`：
```koka
fun no-odds() : <raise,state<int>> int
  val i = get()
  if i.is-odd then raise("no odds") else
    set(i / 2)
    i
```
然后我们可以将pstate和raise-maybe处理器组合在一起，以处理这些效果：
```koka
fun state-raise(init) : div (maybe<int>,int)
  with pstate(init)
  with raise-maybe
  no-odds()
```
其中 `state<int>` 和 `raise` 这两个效应分别由各自的处理器来处理。请注意，该类型反映出我们总是返回一个对（pair），其第一个元素要么是 `Nothing` （如果调用了 `raise` ），要么是带有最终结果的 `Just` ，而第二个元素则是最终状态。这对应于我们通常如何组合状态和异常：在发生异常时，状态（或堆）被设置为异常发生时的状态。

然而，如果我们以相反的顺序组合这些处理器，我们便会得到一种形式的事务状态——要么抛出一个异常（且没有最终状态），要么得到结果与最终状态组成的对。
```koka
fun raise-state(init) : div maybe<(int,int)>
  with raise-maybe
  with pstate(init)
  no-odds()
```