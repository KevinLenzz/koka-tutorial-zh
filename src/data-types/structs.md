# 结构体
(Structs)

面向函数语言的一个重要方面是能够定义丰富的数据类型，函数在这些类型之上工作。一种常见的数据类型是 **结构体(struct)** 或 **记录(record)**。下面是一个包含个人信息的结构体示例：
```koka
struct person
  age : int
  name : string
  realname : string = name

val brian = Person( 29, "Brian" )
```
使用构造子为结构体（以及其他数据类型）创建实例，例如 `Person(19,"Brian")`。此外，这些构造子可以使用命名参数，因此我们也可以这样调用构造子：`Person( name = "Brian", age = 19, realname = "Brian H. Griffin" )`，这非常接近常规的记录语法，但没有任何特殊规则——它只是层层嵌套的函数而已！

此外，Koka会自动为结构体（或其他数据类型）中的每个字段生成访问器函数，我们可以用 `brian.age` 来访问一个人的年龄（这当然只是 `age(brian)` 的语法糖）。