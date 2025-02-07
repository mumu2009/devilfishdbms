// main-sql-direction.js
const fs = require("fs");
const path = require("path");
const os = require("os");

// 定义扩展模块
class SQLDirectionExtension {
    constructor() {
        this.name = "sql-direction";
    }

    // 扩展的 execute 方法
    // 扩展的 execute 方法
    execute(db, command, ...args) {
        const parts = command.split(' ');
        const action = parts[0].toLowerCase();

        switch (action) {
            case 'or':
                return this.or(db, ...args);
            case 'and':
                return this.and(db, ...args);
            case 'join':
                return this.join(db, ...args);
            case 'order':
                return this.orderBy(db, ...args);
            case 'limit':
                return this.limit(db, ...args);
            case 'select':
                return this.selectInto(db, ...args);
            case 'fix':
                return this.fix(db, ...args);
            case 'average':
                return this.average(db, ...args);
            case 'amount':
                return this.amount(db, ...args);
            case 'median':
                return this.median(db, ...args);
            case 'variance':
                return this.variance(db, ...args);
            case 'min':
                return this.min(db, ...args);
            case 'max':
                return this.max(db, ...args);
            case 'sum':
                return this.sum(db, ...args);
            case 'group':
                return this.groupBy(db, ...args);
            case 'having':
                return this.having(db, ...args);
            case 'exists':
                return this.exists(db, ...args);
            case 'round':
                return this.round(db, ...args);
            case 'format':
                return this.format(db, ...args);
            default:
                throw new Error(`Unsupported SQL command: ${action}`);
        }
    }

    // 实现 OR 查询
    or(db, tableName, query1, query2) {
        const results1 = db.selectData(tableName, query1).data;
        const results2 = db.selectData(tableName, query2).data;
        const combinedResults = [...results1, ...results2];
        const uniqueResults = Array.from(new Set(combinedResults.map(JSON.stringify)), JSON.parse);
        return uniqueResults;
    }

    // 实现 AND 查询
    and(db, tableName, query1, query2) {
        const results1 = db.selectData(tableName, query1).data;
        const results2 = db.selectData(tableName, query2).data;
        const combinedResults = results1.filter(item => results2.some(otherItem => JSON.stringify(item) === JSON.stringify(otherItem)));
        return combinedResults;
    }

    // 实现 JOIN 查询
    join(db, tableName1, tableName2, joinKey) {
        const table1Data = db.selectData(tableName1, {}).data;
        const table2Data = db.selectData(tableName2, {}).data;
        const joinedData = table1Data.flatMap(item1 => {
            return table2Data.filter(item2 => item1[joinKey] === item2[joinKey]).map(item2 => ({ ...item1, ...item2 }));
        });
        return joinedData;
    }

    // 实现 ORDER BY 查询
    orderBy(db, tableName, column, direction = 'asc') {
        const results = db.selectData(tableName, {}).data;
        results.sort((a, b) => {
            if (direction === 'asc') {
                return a[column] - b[column];
            } else {
                return b[column] - a[column];
            }
        });
        return results;
    }

    // 实现 LIMIT 查询
    limit(db, tableName, limit) {
        const results = db.selectData(tableName, {}).data;
        return results.slice(0, limit);
    }

    // 实现 SELECT INTO 查询
    selectInto(db, tableName, newTableName, query) {
        const results = db.selectData(tableName, query).data;
        db.createTable(newTableName, Object.keys(results[0]));
        results.forEach(row => db.insertData(newTableName, row));
        return results;
    }

    // 实现 FIX 查询（假设是修复数据）
    fix(db, tableName, key, value) {
        const results = db.selectData(tableName, { [key]: value }).data;
        results.forEach(row => {
            // 假设修复操作是将某个字段设置为特定值
            row[key] = value;
            db.updateData(tableName, { [key]: value }, row);
        });
        return results;
    }

    // 实现 AVERAGE 查询
    average(db, tableName, column) {
        const results = db.selectData(tableName, {}).data;
        const sum = results.reduce((acc, row) => acc + row[column], 0);
        return sum / results.length;
    }

    // 实现 AMOUNT 查询
    amount(db, tableName) {
        const results = db.selectData(tableName, {}).data;
        return results.length;
    }
    // 实现方差查询
    variance(db, tableName, column) {
        const results = db.selectData(tableName, {}).data;
        const values = results.map(row => row[column]);
        const mean = values.reduce((acc, val) => acc + val, 0) / values.length;
        const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
        return variance;
    }// 实现 MIN 查询
    min(db, tableName, column) {
        const results = db.selectData(tableName, {}).data;
        const values = results.map(row => row[column]);
        return Math.min(...values);
    }

    // 实现 MAX 查询
    max(db, tableName, column) {
        const results = db.selectData(tableName, {}).data;
        const values = results.map(row => row[column]);
        return Math.max(...values);
    }

    // 实现 SUM 查询
    sum(db, tableName, column) {
        const results = db.selectData(tableName, {}).data;
        const values = results.map(row => row[column]);
        const sum = values.reduce((acc, val) => acc + val, 0);
        return sum;
    }// 实现 GROUP BY 查询
    groupBy(db, tableName, groupColumn, aggregateColumn, aggregateFunction) {
        const results = db.selectData(tableName, {}).data;
        const groupedData = results.reduce((acc, row) => {
            const key = row[groupColumn];
            if (!acc.has(key)) {
                acc.set(key, []);
            }
            acc.get(key).push(row);
            return acc;
        }, new Map());

        const aggregatedData = [];
        groupedData.forEach((group, key) => {
            let value;
            switch (aggregateFunction.toLowerCase()) {
                case 'sum':
                    value = group.reduce((acc, row) => acc + row[aggregateColumn], 0);
                    break;
                case 'avg':
                    value = group.reduce((acc, row) => acc + row[aggregateColumn], 0) / group.length;
                    break;
                case 'min':
                    value = Math.min(...group.map(row => row[aggregateColumn]));
                    break;
                case 'max':
                    value = Math.max(...group.map(row => row[aggregateColumn]));
                    break;
                case 'count':
                    value = group.length;
                    break;
                default:
                    throw new Error(`Unsupported aggregate function: ${aggregateFunction}`);
            }
            aggregatedData.push({ [groupColumn]: key, [aggregateColumn]: value });
        });

        return aggregatedData;
    }

    // 实现 HAVING 查询
    having(db, tableName, groupColumn, aggregateColumn, aggregateFunction, condition) {
        const groupedData = this.groupBy(db, tableName, groupColumn, aggregateColumn, aggregateFunction);
        const conditionParts = condition.split(' ');
        const operator = conditionParts[0];
        const threshold = parseFloat(conditionParts[1]);

        const filteredData = groupedData.filter(row => {
            const value = row[aggregateColumn];
            switch (operator) {
                case '>':
                    return value > threshold;
                case '<':
                    return value < threshold;
                case '>=':
                    return value >= threshold;
                case '<=':
                    return value <= threshold;
                case '=':
                    return value === threshold;
                case '<>':
                    return value !== threshold;
                default:
                    throw new Error(`Unsupported operator in HAVING clause: ${operator}`);
            }
        });

        return filteredData;
    }// 实现 EXISTS 查询
    exists(db, tableName, subQuery) {
        const subQueryResults = db.selectData(tableName, subQuery).data;
        return subQueryResults.length > 0;
    }// 实现 ROUND 查询
    round(db, tableName, column, precision = 0) {
        const results = db.selectData(tableName, {}).data;
        return results.map(row => ({
            ...row,
            [column]: parseFloat(row[column].toFixed(precision))
        }));
    }

    // 实现 FORMAT 查询
    format(db, tableName, column, formatString) {
        const results = db.selectData(tableName, {}).data;
        return results.map(row => ({
            ...row,
            [column]: formatString.replace('{}', row[column])
        }));
    }
}

// 导出扩展模块
module.exports = new SQLDirectionExtension();
//这是devilfishv0.2的拓展模块，支持or,and,join,order by,limit,select into,fix,average,amount等SQL命令和统计学指令
