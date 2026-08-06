# 具名处理器与作用域处理器
(Named and Scoped Handlers)

普通代数效应处理器（handler）是**匿名**的——当同一效应有多个活跃的处理器实例时，操作（operation）无法区分该由哪一个实例来处理。这在需要"同时存在多个同类资源"的场景下会成为表达力的瓶颈：比如同时打开多个文件、维护多个独立的堆（heap）、或在同一个计算中使用多个独立的 reader 环境。

Koka 通过**具名处理器（named handlers）**与**作用域处理器（scoped handlers）**解决了这个问题——让处理器拥有词法上可区分的"名字"，使操作可以通过名字指向特定的处理器实例。

## 为什么需要具名处理器

考虑经典的 reader 效应（只读环境）：

```koka
effect reader
  fun ask(): int
```

使用匿名处理器时：

```koka
fun read(x, action)
  with handler
    fun ask() x
  action()
```

这里的 `ask()` 操作会被最近的匿名 `reader` 处理器处理。但如果我们想**同时使用两个 reader 环境**——例如 `f₁` 提供 `42`，`f₂` 提供 `7`——匿名处理器就无法区分两次 `ask()` 调用该由谁处理。

**具名处理器**让处理器拥有一个**首类（first-class）的名字**，操作可以通过这个名字显式地指向特定的处理器实例。

## 具名效应与具名处理器的语法

声明一个具名效应：

```koka
named effect file
  fun read-line(): string
```

`named` 关键字标记这是一个**具名效应**——它的操作必须通过具体的处理器名字来调用。

创建具名处理器实例：

```koka
fun file(fname, action)
  var content := read-text-file(fname.path).lines
  with f = named handler
    fun read-line()
      match content
        Nil -> ""
        Cons(x, xx) -> { content := xx; x }
  action(f)
```

这里：

- `named handler { ... }` 创建一个**具名处理器**，其名字绑定到 `f`
- `f` 是一个**首类值**——可以传递、可以放入数据结构、可以作为函数参数
- `action(f)` 将名字 `f` 传入被处理的计算，使得 `action` 内部可以通过 `f.read-line()` 显式调用这个特定实例的操作

## 示例：同时操作两个文件

具名处理器的威力在于——**多个同类资源可以独立共存**：

```koka
pub fun main()
  with f1 = file("foo.txt".path)
  with f2 = file("bar.txt".path)
  println( f1.read-line() ++ f2.read-line() )
```

由于 `f1` 和 `f2` 是词法上不同的名字，`f1.read-line()` 与 `f2.read-line()` 调用的是**两个不同的处理器实例**——分别从 `foo.txt` 和 `bar.txt` 读取第一行。如果没有具名处理器，两次 `read-line()` 调用都会解析到同一个处理器，无法区分文件来源。

Koka 官方 OOPSLA'22 论文明确指出 ：具名处理器让程序员可以"deal with each file independently, and easily read the content of a particular file in the presence of multiple opened files"——这正是具名处理器的核心价值。

## 作用域处理器：类型级的作用域安全

具名处理器解决了"多个实例共存"的问题，但还有一个安全隐患：**`action` 可能将处理器名字 `f` 逃逸到处理器的作用域之外**。例如：

```koka
var escaped: file? = None

fun file(fname, action)
  var content := read-text-file(fname.path).lines
  with f = named handler
    fun read-line() ...
  action(f)   // 危险：action 可能把 f 保存到 escaped 中
```

如果 `action` 将 `f` 赋值给全局变量 `escaped`，那么 `file` 返回后，`escaped` 仍然持有 `f`——但此时 `f` 对应的处理器作用域已经结束，调用 `escaped.read-line()` 会导致未定义行为。

**作用域处理器（scoped handler）** 通过类型系统**静态地阻止这种逃逸**：

```koka
named scoped effect file<s>
  fun read-line(): string

fun file(fname: string, action: forall s. file<s> -> <scope<s>|e> a): e a
  var i := 0
  with f <- named handler
    fun read-line()
      i := i + 1
      (fname ++ ": line " ++ i.show)
  action(f)
```

关键变化：

1. **效应参数化**：`file<s>` 中的 `s` 是一个**作用域变量（scope variable）**，标识这个特定处理器实例的作用域
2. **rank-2 多态**：`action` 的类型 `forall s. file<s> -> <scope<s>|e> a` 表示——`action` 对任意作用域变量 `s` 都成立，但 `s` 不能逃逸出 `action` 的调用
3. **`scope<s>` 效应**：`action` 包含 `scope<s>` 效应，这意味着它**只能在作用域 `s` 内执行**——一旦 `action` 返回，`scope<s>` 就被 discharge（解除），`s` 不能再被使用

由于 rank-2 多态的约束，`action` **无法将 `f`（类型为 `file<s>`）逃逸到外部**——因为任何试图在 `action` 返回后使用 `f` 的代码，都无法提供匹配的 `s`。Koka 类型检查器会在编译期拒绝这种逃逸。

## 作用域类型的机制

作用域处理器依赖于 Koka 的**作用域类型（scope types）**机制。带 `::S` 种类注解的类型构造子可以创建作用域变量 ：

```koka
type scope :: S -> X
```

`scope<s>` 是一个类型——它代表"在作用域 `s` 内有效"。当处理器 `f` 的类型为 `file<s>` 时，任何使用 `f` 的操作都会产生 `scope<s>` 效应。由于 `file` 函数在 `action` 返回时 discharge 了 `scope<s>`，`action` 内部获得的 `f` 无法被带回外部。

Koka 的 `nmd` 与 `scope` 类型 ：

```koka
// 具名效应的默认总括效应
pub type nmd :: X

// 作用域效应：确保具名效应无法逃逸出其作用域
pub type scope :: S -> X
```

## 完整示例：具名与作用域文件处理器对比

### 普通具名处理器（Figure 8 左）

```koka
named effect file
  fun read-line(): string

fun file(fname: path, action: file -> <exn,fsys|e> a): <exn,fsys|e> a
  var ls := read-text-file(fname).lines
  with f = named handler
    fun read-line()
      match ls
        Nil -> ""
        Cons(x, xx) -> { ls := xx; x }
  action(f)
```

### 具名与作用域处理器（Figure 8 右）

```koka
named scoped effect file<s>
  fun read-line(): string

fun file(fname: path, action: forall<s. file<s> -> <scope<s>,fsys|e> a): <fsys|e> a
  var ls := read-text-file(fname).lines
  with f <- named handler
    fun read-line()
      match ls
        Nil -> ""
        Cons(x, xx) -> { ls := xx; x }
  action(f)
```

两段代码的运行时行为完全一致——区别在类型层面：作用域版本通过 `forall<s>` 与 `scope<s>` 保证 `action` 不能将 `f` 逃逸到 `file` 函数之外。

## 更丰富的应用场景

Koka 官方 `samples/handlers/named` 目录提供了多个展示具名与作用域处理器的实例 ：

| 样例 | 演示内容 | 论文章节 |
|---|---|---|
| `ask.kk` | 简单的 reader 效应（具名处理器入门）| §2.2 |
| `file.kk` | 非作用域的文件效应 | §2.3.1 / Figure 1 |
| `file-scoped.kk` | 作用域的文件效应 | 类似 Figure 4 |
| `heap.kk` | 首类堆（first-class heap）| §3.2.4 / Figure 5 |
| `unify.kk` | 合一算法（unification）效应 | §7.2 |
| `ask-poly.kk` | 多态 reader 效应 | — |

其中 **`heap.kk` 展示了一个精妙的用法** ：通过具名处理器，Koka 不需要内置的状态机制——可以完全用具名处理器表达首类堆（first-class heap），动态创建引用（references）。每个 `newref` 操作在处理器 `h` 的作用域内创建新引用，引用本身携带处理器名字 `h`，从而保证引用的访问被限定在正确的堆实例中。

## 具名处理器与匿名处理器的关系

具名处理器是匿名处理器的**超集**——匿名处理器可以视为"名字不可见"的特殊情况。Koka 的 `with` 语句语法统一了两者 ：

```koka
// 匿名处理器：名字不可见
with handler
  fun ask() 42
action()

// 具名处理器：名字 f 绑定到处理器
with f = named handler
  fun ask() 42
action(f)

// 作用域具名处理器：f 携带作用域变量
with f <- named handler
  fun ask() 42
action(f)
```

`with` 语句的两种变体 ：

- `with f = ...` —— 绑定变体，用于具名处理器
- `with f <- ...` —— 绑定变体，用于作用域具名处理器（`<` 暗示类型级约束）

## 设计意义

具名与作用域处理器体现了 Koka 效应系统的核心设计哲学——**效应即能力（effect as capability）**：

1. **模块化**：处理函数不再依赖全局单例效应，而是显式地传递处理器名字——这让多个同类资源可以独立共存
2. **首类性**：处理器名字是首类值，可以自由传递、存入数据结构——这为构建复杂效应组合（如首类堆、神经网络）提供了基础
3. **类型安全**：作用域处理器通过 rank-2 多态与作用域类型，在编译期静态保证处理器无法逃逸其作用域
4. **零开销抽象**：具名与作用域处理器在编译后等价于手工管理的状态——没有运行时开销

Koka 论文总结道 ：具名处理器让程序员可以"deal with each file independently"——这正是代数效应系统走向工程实用化的关键一步。通过将处理器名字化、首类化、作用域化，Koka 的效应系统能够自然地表达现实世界中"多实例、有边界"的资源管理模式。

## 本章小结

| 概念 | 关键字 | 核心特征 |
|---|---|---|
| 具名效应 | `named effect` | 操作必须通过处理器名字调用 |
| 具名处理器 | `with f = named handler` | 处理器绑定到首类名字 `f`，可传递 |
| 作用域效应 | `named scoped effect file<s>` | 效应参数化作用域变量 `s` |
| 作用域处理器 | `with f <- named handler` | `action` 受 `forall s.` 约束，`f` 无法逃逸 |

具名处理器解决了"多个同类效应实例共存"的问题；作用域处理器在此基础上通过类型系统静态保证处理器名字不会逃逸到其作用域之外。两者共同构成了 Koka 表达复杂、模块化、类型安全的效应处理的基础。

> 📌 译注：
> - **named handler** → 具名处理器
> - **scoped handler** → 作用域处理器
> - **named effect** → 具名效应
> - **scope variable** → 作用域变量
> - **rank-2 polymorphism** → 二阶多态
> - **first-class name** → 首类名字
> - **effect as capability** → 效应即能力
>
> 参考：Koka OOPSLA'22 论文《First-Class Names for Effect Handlers》 与微软技术报告 MSR-TR-2021-10 。示例代码语法以当前 Koka 版本（参见 `samples/handlers/named/` ）为准——不同版本在 `with f = named handler` 与 `with f <- named handler` 的语法细节上可能有差异，但语义一致。

---

**关键要点**：具名处理器让同一效应的多个实例可以词法区分、独立共存，处理器名字是首类值；作用域处理器在此基础上通过 rank-2 多态与作用域类型，在类型层面静态保证处理器无法逃逸其作用域。这是 Koka 效应系统表达"多实例、有边界"资源管理模式的基石，也是代数效应走向工程实用化的关键机制 。