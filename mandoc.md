Devilfish DBMS v0.2 用户手册

1.简介
Devilfish DBMS 是一款高性能的数据库管理系统，专为处理高维数据而设计。它集成了多种先进的算法和技术，支持数据存储、查询、分析以及可视化等功能。此外，Devilfish DBMS 还提供了丰富的扩展模块，用于支持机器学习、SQL 查询等高级功能。

2.安装与启动

2.1 安装
确保您已安装 Node.js 环境。下载 Devilfish DBMS 的源代码后，进入项目目录运行以下命令安装依赖：

```bash
npm install
```

2.2 启动
在项目目录下运行以下命令启动系统：

```bash
node main.js
```

3.数据库管理

3.1 创建数据库

```sql
create database <database_name>;
```

示例：

```sql
create database mydb;
```

3.2 使用数据库

```sql
use <database_name>;
```

示例：

```sql
use mydb;
```

3.3 删除数据库

```sql
drop database <database_name>;
```

示例：

```sql
drop database mydb;
```

3.4 查看所有数据库

```sql
show databases;
```

4.表管理

4.1 创建表

```sql
create table <table_name> (<column1>, <column2>, ...) partition by <partition_key>;
```

示例：

```sql
create table users (id, name, age) partition by id;
```

4.2 删除表

```sql
drop table <table_name>;
```

示例：

```sql
drop table users;
```

4.3 查看表

```sql
show tables;
```

5.数据操作

5.1 插入数据

```sql
insert into <table_name> values {<key1>:<value1>, <key2>:<value2>};
```

示例：

```sql
insert into users values {id:1, name:"John", age:30};
```

5.2 批量插入数据

```sql
insert batch into <table_name> values [<data1>, <data2>, ...];
```

示例：

```sql
insert batch into users values [{id:2, name:"Jane", age:25}, {id:3, name:"Bob", age:40}];
```

5.3 更新数据

```sql
update <table_name> set <column>=<new_value> where <condition>;
```

示例：

```sql
update users set age=31 where id=1;
```

5.4 批量更新数据

```sql
update batch <table_name> set [<update1>, <update2>, ...];
```

示例：

```sql
update batch users set [{id:2, age:26}, {id:3, age:41}];
```

5.5 删除数据

```sql
delete from <table_name> where <condition>;
```

示例：

```sql
delete from users where age > 30;
```

5.6 查询数据

```sql
select * from <table_name> where <condition>;
```

示例：

```sql
select * from users where age > 25;
```

6.扩展模块

6.1 加载扩展模块

```sql
load extension <extension_path>;
```

示例：

```sql
load extension ./main-ai-direction.js;
```

6.2 执行扩展命令

```sql
extension <extension_name> <command>;
```

示例：

```sql
extension main-ai create linear regression model on users with features [age] and target [name];
```

7.高级功能

7.1 创建复合索引

```sql
create composite index on <table_name> dimensions <dimension1>,<dimension2>,...;
```

示例：

```sql
create composite index on users dimensions age,name;
```

7.2 数据可视化

```sql
visualize <table_name> with <dimensions>;
```

示例：

```sql
visualize users with age,name;
```

7.3 插入交界点

```sql
insert intersection into <table_name> dimensions <dimension1>,<dimension2>,... function <function> radius <radius> resolution <resolution>;
```

示例：

```sql
insert intersection into users dimensions age,name function sin radius 1 resolution 0.1;
```

7.4 K-Means 聚类

```sql
kmeans cluster <table_name> on <dimension1>,<dimension2>,... with k <k>;
```

示例：

```sql
kmeans cluster users on age,name with k 3;
```

7.5 创建金字塔索引

```sql
create pyramid index on <table_name> with max_capacity=<max_capacity> and k=<k>;
```

示例：

```sql
create pyramid index on users with max_capacity=100 and k=5;
```

7.6 查询金字塔索引

```sql
query pyramid index on <table_name> with point=[<point1>,<point2>,...];
```

示例：

```sql
query pyramid index on users with point=[1,2];
```

7.7 创建递归球面编织

```sql
create recursive sphere weaving on <table_name>;
```

示例：

```sql
create recursive sphere weaving on users;
```

7.8 查询递归球面编织

```sql
query recursive sphere weaving on <table_name> with point=[<point1>,<point2>,...];
```

示例：

```sql
query recursive sphere weaving on users with point=[1,2];
```

7.9 执行脚本文件

```sql
execute script <script_path>;
```

示例：

```sql
execute script ./script.sql;
```

7.10 生成数据点

```sql
generate points on <table_name> with distribution <distribution_type> and parameters {<parameters>};
```

示例：

```sql
generate points on users with distribution normal and parameters {mean:0,stdDev:1,count:100};
```

7.11 添加噪声

```sql
add noise to <table_name> with type <noise_type> and parameters {<parameters>};
```

示例：

```sql
add noise to users with type gaussian and parameters {mean:0,stdDev:0.1};
```

7.12 启用/禁用压缩

```sql
enable compression for <table_name>;
disable compression for <table_name>;
```

示例：

```sql
enable compression for users;
disable compression for users;
```

8.SQL 扩展模块

8.1 OR 查询

```sql
or <table_name> <query1> <query2>;
```

示例：

```sql
or users {age:30} {name:"John"};
```

8.2 AND 查询

```sql
and <table_name> <query1> <query2>;
```

示例：

```sql
and users {age:30} {name:"John"};
```

8.3 JOIN 查询

```sql
join <table_name1> <table_name2> <join_key>;
```

示例：

```sql
join users orders id;
```

8.4 ORDER BY 查询

```sql
order <table_name> <column> [asc|desc];
```

示例：

```sql
order users age asc;
```

8.5 LIMIT 查询

```sql
limit <table_name> <limit>;
```

示例：

```sql
limit users 10;
```

8.6 SELECT INTO 查询

```sql
select into <table_name> <new_table_name> <query>;
```

示例：

```sql
select into users new_users {age > 25};
```

8.7 FIX 查询

```sql
fix <table_name> <key> <value>;
```

示例：

```sql
fix users name "John";
```

8.8 AVERAGE 查询

```sql
average <table_name> <column>;
```

示例：

```sql
average users age;
```

8.9 AMOUNT 查询

```sql
amount <table_name>;
```

示例：

```sql
amount users;
```

8.10 方差查询

```sql
variance <table_name> <column>;
```

示例：

```sql
variance users age;
```

8.11 MIN 查询

```sql
min <table_name> <column>;
```

示例：

```sql
min users age;
```

8.12 MAX 查询

```sql
max <table_name> <column>;
```

示例：

```sql
max users age;
```

8.13 SUM 查询

```sql
sum <table_name> <column>;
```

示例：

```sql
sum users age;
```

8.14 GROUP BY 查询

```sql
group <table_name> by <group_column> aggregate <aggregate_column> using <aggregate_function>;
```

示例：

```sql
group users by age aggregate salary using sum;
```

8.15 HAVING 查询

```sql
having <table_name> <group_column> <aggregate_column> <aggregate_function> <condition>;
```

示例：

```sql
having users age salary sum > 10000;
```

8.16 EXISTS 查询

```sql
exists <table_name> where <sub_query>;
```

示例：

```sql
exists users where age > 30;
```

8.17 ROUND 查询

```sql
round <table_name> <column> precision <precision>;
```

示例：

```sql
round users age precision 2;
```

8.18 FORMAT 查询

```sql
format <table_name> <column> format_string <format_string>;
```

示例：

```sql
format users name format_string "User: {}";
```

9.数据导入与导出

9.1 从 CSV 文件导入数据

```sql
import csv <table_name> from <file_path>;
```

示例：

```sql
import csv users from ./users.csv;
```

9.2 导出数据到 CSV 文件

```sql
export csv <table_name> to <file_path>;
```

示例：

```sql
export csv users to ./users_export.csv;
```

10.数据分析与统计

10.1 计算模糊函数

```sql
get fuzzy function <table_name> on <dimension1> and <dimension2>;
```

示例：

```sql
get fuzzy function users on age and salary;
```

10.2 泰勒展开

```sql
taylor expand <table_name> on <dimension1> and <dimension2> at (<x0>,<y0>) order <order>;
```

示例：

```sql
taylor expand users on age and salary at (30,50000) order 2;
```

11.数据可视化

11.1 生成可视化数据

```sql
visualize <table_name> with <dimensions>;
```

示例：

```sql
visualize users with age,name;
```

11.2 生成 Web 可视化文件

```sql
generate web visualization <table_name> with <dimensions>;
```

示例：

```sql
generate web visualization users with age,name;
```

12.数据压缩与解压缩

12.1 启用数据压缩

```sql
enable compression for <table_name>;
```

示例：

```sql
enable compression for users;
```

12.2 禁用数据压缩

```sql
disable compression for <table_name>;
```

示例：

```sql
disable compression for users;
```

12.3 压缩数据点

```sql
compress data <table_name> using <compression_method>;
```

示例：

```sql
compress data users using conical_projection;
```

12.4 解压缩数据点

```sql
decompress data <table_name> using <compression_method>;
```

示例：

```sql
decompress data users using conical_projection;
```

13.机器学习扩展

13.1 创建线性回归模型

```sql
create linear regression model on <table_name> with features <features> and target <target>;
```

示例：

```sql
create linear regression model on users with features [age] and target salary;
```

13.2 预测线性回归模型

```sql
predict linear regression on <table_name> with data {<key1>:<value1>, <key2>:<value2>};
```

示例：

```sql
predict linear regression on users with data {age:35};
```

13.3 创建朴素贝叶斯模型

```sql
create naive bayes model on <table_name> with features <features> and target <target>;
```

示例：

```sql
create naive bayes model on users with features [age] and target name;
```

13.4 预测朴素贝叶斯模型

```sql
predict naive bayes on <table_name> with data {<key1>:<value1>, <key2>:<value2>};
```

示例：

```sql
predict naive bayes on users with data {age:35};
```

13.5 拟合多项式

```sql
fit polynomial on <table_name> with degree <degree>;
```

示例：

```sql
fit polynomial on users with degree 2;
```

14.数据生成与噪声添加

14.1 生成数据点

```sql
generate points on <table_name> with distribution <distribution_type> and parameters {<parameters>};
```

示例：

```sql
generate points on users with distribution normal and parameters {mean:0,stdDev:1,count:100};
```

14.2 添加噪声

```sql
add noise to <table_name> with type <noise_type> and parameters {<parameters>};
```

示例：

```sql
add noise to users with type gaussian and parameters {mean:0,stdDev:0.1};
```

15.张量操作

15.1 创建张量

```sql
create tensor <tensor_name> with data <data>;
```

示例：

```sql
create tensor my_tensor with data [[1,2],[3,4]];
```

15.2 执行张量操作

```sql
tensor <operation> on <tensor_name> with <operand_tensor_name>;
```

示例：

```sql
tensor add on my_tensor with another_tensor;
```

15.3 张量转置

```sql
tensor transpose on <tensor_name>;
```

示例：

```sql
tensor transpose on my_tensor;
```

15.4 张量点积

```sql
tensor dotproduct on <tensor_name> with <operand_tensor_name>;
```

示例：

```sql
tensor dotproduct on my_tensor with another_tensor;
```

15.5 张量重塑

```sql
tensor reshape <tensor_name> to <new_shape>;
```

示例：

```sql
tensor reshape my_tensor to [2,2];
```

16.其他功能

16.1 查看日志

```sql
show logs;
```

16.2 清空日志

```sql
clear logs;
```

16.3 退出系统

```sql
exit;
```
