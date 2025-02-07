# Devilfish DBMS

Devilfish DBMS 是一个基于 Node.js 的分布式数据库管理系统，旨在提供高效的数据存储、检索和管理功能。本项目使用 GPL3.0 许可证。

## 目录

- 功能概述
- 安装与配置
- 使用方法
  - 命令行交互
  - 支持的命令
- 代码结构
- 贡献
- 许可证

## 功能概述

Devilfish DBMS 提供以下主要功能：

- **数据库和表的创建与管理**：支持创建、选择和删除数据库和表。
- **数据操作**：支持插入、更新、删除和查询数据。
- **索引**：支持创建复合索引以加速查询。
- **数据导入**：支持从 CSV 文件导入数据。
- **高级查询**：支持基于条件的复杂查询，包括使用距离哈希和聚类标签的查询。
- **数据可视化**：支持将数据映射到高维球面并生成可视化数据。
- **扩展机制**：支持加载和执行自定义扩展命令。

## 安装与配置

### 安装依赖

确保你已经安装了 Node.js 和 npm。然后，导航到项目目录并安装依赖：

bash

`cd path/to/devilfish-dbms npm install`

### 配置

项目默认使用当前目录下的 `.db` 文件作为数据库文件。你可以根据需要修改文件路径和名称。

## 使用方法

### 命令行交互

启动命令行交互界面：

bash

`node main.js`

## 代码结构

`devilfish-dbms/ 

├── main.js 

├── worker.js

├──main-ai-direction.js

├── main-sql-direction.js  

├── dbms.log 

├── <databaseName>.db 

└── points.json`

- **main.js**：主程序文件，包含数据库管理系统的实现。
- **worker.js**：用于并行计算的 Worker 线程脚本。
- **dbms.log**：日志文件，记录系统运行日志。
- **<databaseName>.db**：数据库文件，存储压缩后的数据。
- **points.json**：可视化数据文件，存储高维球面映射后的数据点。
- **main-ai-direction**:ai相关拓展
- **main-sql-direction**：SQL语句相关拓展

## 贡献

欢迎贡献代码和报告问题！请遵循以下步骤：

1. Fork 项目。
2. 创建你的功能分支 (`git checkout -b feature/AmazingFeature`)。
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)。
4. 推送到分支 (`git push origin feature/AmazingFeature`)。
5. 打开一个 Pull Request。

## 许可证

本项目采用 [GPL3.0](https://www.gnu.org/licenses/gpl-3.0.html) 许可证。

---

希望这个 `README.md` 文档能够帮助你更好地理解和使用 Devilfish DBMS。如果有任何问题或建议，请随时联系项目维护者。