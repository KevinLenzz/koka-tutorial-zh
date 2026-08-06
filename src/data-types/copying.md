# 拷贝
(Copying)

默认情况下，所有结构体（以及其他数据类型）都是不可变的。我们通常不会直接修改结构体中的字段，而是返回一个新的结构体，其中字段已更新。例如，下面是一个生日函数，它会增加年龄字段的值：
```koka
fun birthday( p : person ) : person
  p( age = p.age + 1 )
```
此处，`birthday` 返回一个新的 person类型的数据，该 person类型的数据 与 `p` 相等，但年龄已增加。语法`p(...)`是调用`person`复制构造函数的语法糖。该构造函数也会为每种数据类型自动生成，其内部生成形式如下：
```koka
fun copy( p, age = p.age, name = p.name, realname = p.realname )
  Person(age, name, realname)
```
当实参跟随数据值出现时，如 `p( age = p.age + 1)`（此处`p`就是数据值，`p.age+1`是实参），它会被展开为调用这个复制函数，即 `p.copy( age = p.age + 1)`。遵循最小生成原则，记录更新没有特殊的规则，而是使用带有可选形参和具名形参的普通函数调用。