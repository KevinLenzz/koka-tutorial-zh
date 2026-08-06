# 替选类型（或称联合类型）
(Alternatives (or Unions))

可用Koka的替选类型表示代数数据类型（algebraic data types，ADT）中的和类型（sum types）。例如，下面是一个枚举：
```koka
type color
  Red
  Green
  Blue
```
它有三个替选：`Red`、`Green`、`Blue`

这些枚举类型的特殊情况包括：`void` 类型，它没有任何替选（因此不存在具有该类型的值）；单位元类型 `unit` ，它只有一个构造子 `Unit`（因此，只存在一个具有 `unit` 类型的值，即 `Unit`）；以及布尔类型 `bool`，它有两个构造子 `True` 和 `False`。作为简写，我们也可以将 `unit` 类型写作 `()`，并将 `Unit` 构造子写作 `()`。
```koka
type void

type ()
  ()

type bool
  False
  True
```
构造子可以带有形参。例如，以下是如何创建一个既可以是整数也可以是无穷值的 `number` 类型：
```koka
type number
  Infinity
  Integer( i : int )
```
我们可以通过写出 `Integer(1)` 或 `Infinity` 来创建这样的number。此外，数据类型可以是多态的和递归的。以下是 列表（`list`） 类型的定义，它要么为空（`Nil`），要么是 `Cons` ：一个头元素（`head`）后跟一个尾列表（`tail`）：
```koka
type list<a>
  Nil
  Cons{ head : a; tail : list<a> }
```
Koka会自动为每个命名形参生成访问器函数。例如，对于列表，我们可以通过 `Cons(1, Nil).head` 来访问列表的头部。

我们现在还可以看到，结构体类型不过是带有同名单一构造子的一个寻常类型的语法糖。
```koka
struct tp { <fields> }
可被翻译为
type tp {
  Tp { <fields> }
}
```
例如原先 person结构体 是这样定义的：
```koka
struct person{ age : int; name : string; realname : string = name }
```
可脱糖为
```koka
type person
  Person{ age : int; name : string; realname : string = name }
```
或者省略大括号：
```koka
type person
  Person
    age : int
    name : string
    realname : string = name
```