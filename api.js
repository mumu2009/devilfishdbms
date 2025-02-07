const express = require('express');
const bodyParser = require('body-parser');
const { HypercubeDB } = require('./main'); // 确保路径正确

// 创建一个 HypercubeDB 实例
const db = new HypercubeDB();
function executePrompt(answer) {
    const reg1 = /^\s*create\s+database\s+([a-zA-Z0-9_]+)\s*$/;
    const reg2 = /^\s*use\s+([a-zA-Z0-9_]+)\s*$/;
    const reg3 = /^\s*create\s+table\s+([a-zA-Z0-9_]+)\s*\(([a-zA-Z0-9_]+(,[a-zA-Z0-9_]+)*)\)\s*(partition\s+by\s+([a-zA-Z0-9_]+))?\s*$/;
    const reg4 = /^\s*insert\s+into\s+([a-zA-Z0-9_]+)\s+values\s*\{([^}]+)\}\s*$/;
    const reg5 = /^\s*insert\s+batch\s+into\s+([a-zA-Z0-9_]+)\s+values\s*\[([^\]]+)\]\s*$/;
    const reg6 = /^\s*exit\s*$/;
    const reg7 = /^\s*add\s+dimension\s+([a-zA-Z0-9_]+)\s+to\s+([a-zA-Z0-9_]+)\s*$/;
    const reg8 = /^\s*remove\s+dimension\s+([a-zA-Z0-9_]+)\s+from\s+([a-zA-Z0-9_]+)\s*$/;
    const reg9 = /^\s*get\s+fuzzy\s+function\s+([a-zA-Z0-9_]+)\s+on\s+([a-zA-Z0-9_]+)\s+and\s+([a-zA-Z0-9_]+)\s*$/;
    const reg10 = new RegExp("^\\s*taylor\\s+expand\\s+([a-zA-Z0-9_]+)\\s+on\\s+([a-zA-Z0-9_]+)\\s+and\\s+([a-zA-Z0-9_]+)\\s+at\\s+\\(([^,]+),([^)]+)\\)\\s+order\\s+(\\d+)\\s*$");
    const reg11 = new RegExp("^\\s*import\\s+csv\\s+([a-zA-Z0-9_]+)\\s+from\\s+([^\\s]+)\\s*$");
    const regUpdate = /^\s*update\s+([a-zA-Z0-9_]+)\s+set\s+([a-zA-Z0-9_]+)\s*=\s*([^\s]+)\s+where\s+(.+)\s*$/i;
    const regDelete = /^\s*delete\s+from\s+([a-zA-Z0-9_]+)\s+where\s+(.+)\s*$/i;
    const reg13 = new RegExp("^\\s*update\\s+batch\\s+([a-zA-Z0-9_]+)\\s+set\\s+\\[([^\]]+)\\]\\s*$");


    const reg15 = new RegExp("^\\s*drop\\s+table\\s+([a-zA-Z0-9_]+)\\s*$");
    const regSelectData = new RegExp(
        "^\\s*select\\s+\\*\\s+from\\s+([a-zA-Z0-9_]+)(?:\\s+where\\s+(.+))?$",
        "i"
    );
    const reg16 = /^\s*load\s+extension\s+([^\s]+)\s*$/i;
    const reg17 = /^\s*extension\s+([^\s]+)\s*(.*)$/i;
    const reg18 = /^\s*create\s+composite\s+index\s+on\s+([a-zA-Z0-9_]+)\s+dimensions\s+([a-zA-Z0-9_,]+)\s*$/;
    const reg19 = /^\s*show\s+databases\s*$/i;
    const reg20 = /^\s*show\s+tables\s*$/i;
    const reg21 = /^\s*drop\s+database\s+([a-zA-Z0-9_]+)\s*$/i;
    const reg22 = /^\s*visualize\s+([\w]+)\s+with\s+([\w,]+)\s*$/;
    const reg23 = /^\s*insert\s+intersection\s+into\s+([a-zA-Z0-9_]+)\s+dimensions\s+([a-zA-Z0-9_,]+)\s+function\s+([^\s]+)\s+radius\s+(\d+(\.\d+)?)\s+resolution\s+(\d+(\.\d+)?)\s*$/;
    const reg24 = /^\s*kmeans\s+cluster\s+([a-zA-Z0-9_]+)\s+on\s+([a-zA-Z0-9_,]+)\s+with\s+k\s+(\d+)\s*$/;
    const reg25 = /^\s*create\s+pyramid\s+index\s+on\s+([a-zA-Z0-9_]+)\s+with\s+max_capacity=(\d+)\s+and\s+k=(\d+)\s*$/;
    const reg26 = /^\s*query\s+pyramid\s+index\s+on\s+([a-zA-Z0-9_]+)\s+with\s+point=\[([^\]]+)\]\s*$/;
    const reg27 = /^\s*create\s+recursive\s+sphere\s+weaving\s+on\s+([a-zA-Z0-9_]+)\s*$/;
    const reg28 = /^\s*query\s+recursive\s+sphere\s+weaving\s+on\s+([a-zA-Z0-9_]+)\s+with\s+point=\[([^\]]+)\]\s*$/;
    const reg29 = /^\s*execute\s+script\s+([^\s]+)\s*$/i; // 新增正则表达式来匹配 execute script 命令
    const regFitPolynomial = /^\s*fit\s+polynomial\s+on\s+([a-zA-Z0-9_]+)\s+with\s+degree\s+(\d+)\s*$/;
    const regGeneratePoints = /^\s*generate\s+points\s+on\s+([a-zA-Z0-9_]+)\s+with\s+distribution\s+([a-zA-Z0-9_]+)\s+and\s+parameters\s*\{([^}]+)\}\s*$/;
    const regAddNoise = /^\s*add\s+noise\s+to\s+([a-zA-Z0-9_]+)\s+with\s+type\s+([a-zA-Z0-9_]+)\s+and\s+parameters\s*\{([^}]+)\}\s*$/;


    if (reg1.test(answer)) {
        const dbName = reg1.exec(answer)[1];
        db.createDatabase(dbName);
    } else if (reg2.test(answer)) {
        const dbName = reg2.exec(answer)[1];
        db.useDatabase(dbName);
    } else if (reg3.test(answer)) {
        const match = reg3.exec(answer);
        if (match && match[2]) {
            const tableName = match[1];
            const schemaStr = match[2];
            const schema = schemaStr.split(',');
            const partitionKey = match[5] || 'id'; // 如果未指定，则使用默认值 'id'
            db.createTable(tableName, schema, partitionKey);
        } else {
            console.log("Invalid command format for create table");
        }
    } else if (reg4.test(answer)) {
        const tableName = reg4.exec(answer)[1];
        const dataStr = reg4.exec(answer)[2];

        // 将键名转换为字符串形式
        const formattedDataStr = dataStr.replace(/(\w+):/g, '"$1":');

        try {
            const data = JSON.parse(`{${formattedDataStr}}`);
            db.insertData(tableName, data);
        } catch (error) {
            console.log("Invalid JSON format:", error.message);
        }
    } else if (reg5.test(answer)) {
        const tableName = reg5.exec(answer)[1];
        const dataArrayStr = reg5.exec(answer)[2];

        try {
            const dataArray = JSON.parse(`[${dataArrayStr}]`);
            db.insertBatch(tableName, dataArray);
        } catch (error) {
            console.log("Invalid JSON format:", error.message);
        }
    } else if (reg6.test(answer)) {
        rl.close();
    } else if (reg7.test(answer)) {
        const dimension = reg7.exec(answer)[1];
        const tableName = reg7.exec(answer)[2];
        db.addDimension(tableName, dimension);
    } else if (reg8.test(answer)) {
        const dimension = reg8.exec(answer)[1];
        const tableName = reg8.exec(answer)[2];
        db.removeDimension(tableName, dimension);
    } else if (reg9.test(answer)) {
        const tableName = reg9.exec(answer)[1];
        const dim1 = reg9.exec(answer)[2];
        const dim2 = reg9.exec(answer)[3];
        const fuzzyFunction = db.getFuzzyFunction(tableName, dim1, dim2);
        console.log(`Fuzzy function on ${dim1} and ${dim2}:`, fuzzyFunction);
    } else if (reg10.test(answer)) {
        const tableName = reg10.exec(answer)[1];
        const dim1 = reg10.exec(answer)[2];
        const dim2 = reg10.exec(answer)[3];
        const x0 = parseFloat(reg10.exec(answer)[4]);
        const y0 = parseFloat(reg10.exec(answer)[5]);
        const order = parseInt(reg10.exec(answer)[6]);
        const terms = db.taylorExpand(tableName, dim1, dim2, x0, y0, order);
        console.log(`Taylor expansion of fuzzy function on ${dim1} and ${dim2} at (${x0}, ${y0}) order ${order}:`, terms);
    } else if (reg11.test(answer)) {
        const tableName = reg11.exec(answer)[1];
        const filePath = reg11.exec(answer)[2];
        db.importFromCSV(tableName, filePath);
    }// 在executePrompt函数中更新处理逻辑
    else if (regUpdate.test(answer)) {
        const match = regUpdate.exec(answer);
        const tableName = match[1];
        const column = match[2];
        const newValue = match[3];
        const conditionStr = match[4];

        try {
            const query = parseConditions(conditionStr);
            const newData = { [column]: isNaN(newValue) ? newValue : parseFloat(newValue) };
            db.updateData(tableName, query, newData);
        } catch (error) {
            console.log(error.message);
        }
    }
    else if (regDelete.test(answer)) {
        const match = regDelete.exec(answer);
        const tableName = match[1];
        const conditionStr = match[2];

        try {
            const query = parseConditions(conditionStr);
            db.deleteData(tableName, query);
        } catch (error) {
            console.log(error.message);
        }
    } else if (reg13.test(answer)) {
        const match = reg13.exec(answer);
        const tableName = match[1];
        const updatesStr = match[2];
        try {
            const updates = JSON.parse(`[${updatesStr}]`);
            db.updateBatch(tableName, updates);
        } catch (error) {
            console.log("Invalid JSON format:", error.message);
        }
    } else if (reg15.test(answer)) {
        const tableName = reg15.exec(answer)[1];
        db.dropTable(tableName);
    } else if (regSelectData.test(answer)) {
        const match = regSelectData.exec(answer);

        if (!match) {
            console.log("Invalid select command format");
            return;
        }

        const tableName = match[1];
        let queryStr = match[2]; // 可能为 undefined

        let query = {};
        if (queryStr && typeof queryStr === 'string') { // 确保 queryStr 是字符串
            try {
                query = parseConditions(queryStr);
            } catch (error) {
                console.log(error.message);
                return;
            }
        }

        db.selectData(tableName, query);
    } else if (reg16.test(answer)) {
        const extensionPath = reg16.exec(answer)[1];
        db.loadExtension(extensionPath);
    } else if (reg17.test(answer)) {
        const match = reg17.exec(answer);
        const extensionName = match[1];
        const args = match[2].split(/\s+/).filter(arg => arg.trim() !== ''); // 解析参数
        db.executeExtension(extensionName, ...args);
    } else if (reg18.test(answer)) {
        const match = reg18.exec(answer);
        const tableName = match[1];
        const dimensionsStr = match[2];
        const dimensions = dimensionsStr.split(',');
        db.createCompositeIndex(tableName, dimensions);
    } else if (reg19.test(answer)) {
        db.showDatabases();
    } else if (reg20.test(answer)) {
        db.showTables();
    } else if (reg21.test(answer)) {
        const dbName = reg21.exec(answer)[1];
        db.dropdatabase(dbName);
        console.log(`Database "${dbName}" dropped.`);
    } else if (reg22.test(answer)) {
        const match = reg22.exec(answer);
        const tableName = match[1];
        const dimensions = match[2].split(',');

        // 生成可视化数据
        const points = db.projectToRiemannSphere(tableName, dimensions);
        console.log("Visualization Data:");
        console.log(points.map(p =>
            `(${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)})`
        ).join('\n'));

        // 生成Web可视化文件
        generateWebView(points);
    } else if (reg23.test(answer)) {
        const match = reg23.exec(answer);
        const tableName = match[1];
        const dimensionsStr = match[2];
        const funcStr = match[3];
        const sphereRadius = parseFloat(match[4]);
        const resolution = parseFloat(match[6]);

        // 将维度字符串转换为数组
        const dimensions = dimensionsStr.split(',');

        // 将函数字符串转换为函数对象
        const func = new Function(...dimensions, `return ${funcStr};`);

        // 插入交界点
        db.insertIntersectionPoints(tableName, dimensions, func, sphereRadius, resolution);
    } else if (reg24.test(answer)) {
        const match = reg24.exec(answer);
        const tableName = match[1];
        const dimensionsStr = match[2];
        const k = parseInt(match[3]);

        // 将维度字符串转换为数组
        const dimensions = dimensionsStr.split(',');

        // 执行K-均值聚类
        db.kMeansClustering(tableName, dimensions, k);
    } else if (reg25.test(answer)) {
        const match = reg25.exec(answer);
        const tableName = match[1];
        const maxCapacity = parseInt(match[2]);
        const k = parseInt(match[3]);
        db.createPyramidIndex(tableName, maxCapacity, k);
    } else if (reg26.test(answer)) {
        const match = reg26.exec(answer);
        const tableName = match[1];
        const pointStr = match[2];
        const point = pointStr.split(',').map(Number);
        db.queryPyramidIndex(point);
    } else if (reg27.test(answer)) {
        const match = reg27.exec(answer);
        const tableName = match[1];
        db.createRecursiveSphereWeaving(tableName);
    } else if (reg28.test(answer)) {
        const match = reg28.exec(answer);
        const tableName = match[1];
        const pointStr = match[2];
        const point = pointStr.split(',').map(Number);
        db.queryRecursiveSphereWeaving(point);
    } else if (reg29.test(answer)) { // 处理 execute script 命令
        const scriptPath = reg29.exec(answer)[1];
        executeScriptFile(scriptPath);
    } else if (regFitPolynomial.test(answer)) {
        const match = regFitPolynomial.exec(answer);
        const tableName = match[1];
        const degree = parseInt(match[2]);
        db.executeExtension('main-ai', `fit polynomial on ${tableName} with degree ${degree}`);
    } else if (regGeneratePoints.test(answer)) {
        const match = regGeneratePoints.exec(answer);
        const tableName = match[1];
        const distributionType = match[2];
        const parameters = match[3];
        db.executeExtension('main-ai', `generate points on ${tableName} with distribution ${distributionType} and parameters {${parameters}}`);
    } else if (regAddNoise.test(answer)) {
        const match = regAddNoise.exec(answer);
        const tableName = match[1];
        const noiseType = match[2];
        const parameters = match[3];
        db.executeExtension('main-ai', `add noise to ${tableName} with type ${noiseType} and parameters {${parameters}}`);
    } else // 新增压缩功能支持
        if (regEnableCompression.test(answer)) {
            const tableName = regEnableCompression.exec(answer)[1];
            if (db.data.has(db.currentDatabase) && db.data.get(db.currentDatabase).has(tableName)) {
                const table = db.data.get(db.currentDatabase).get(tableName);
                table.compressed = true; // 启用压缩
                console.log(`Compression enabled for table ${tableName}`);
            } else {
                console.log(`Table ${tableName} does not exist`);
            }
        } else if (regDisableCompression.test(answer)) {
            const tableName = regDisableCompression.exec(answer)[1];
            if (db.data.has(db.currentDatabase) && db.data.get(db.currentDatabase).has(tableName)) {
                const table = db.data.get(db.currentDatabase).get(tableName);
                table.compressed = false; // 禁用压缩
                console.log(`Compression disabled for table ${tableName}`);
            } else {
                console.log(`Table ${tableName} does not exist`);
            }
        } else if (regGeneratePoints.test(answer)) {
            const match = regGeneratePoints.exec(answer);
            const tableName = match[1];
            const distributionType = match[2];
            const parameters = match[3];

            // 解析参数
            const params = JSON.parse(`{${parameters}}`);

            // 生成数据点
            const dataPoints = generateDataPoints(distributionType, params);

            // 检查是否启用压缩
            if (db.data.has(db.currentDatabase) && db.data.get(db.currentDatabase).has(tableName)) {
                const table = db.data.get(db.currentDatabase).get(tableName);
                if (table.compressed) {
                    // 对生成的数据点进行压缩
                    const compressedPoints = dataPoints.map(point => db.conicalProjectionCompress(point));
                    db.insertBatch(tableName, compressedPoints);
                    console.log(`Generated and compressed ${dataPoints.length} points into table ${tableName}`);
                } else {
                    // 直接插入未压缩的数据点
                    db.insertBatch(tableName, dataPoints);
                    console.log(`Generated ${dataPoints.length} points into table ${tableName}`);
                }
            } else {
                console.log(`Table ${tableName} does not exist`);
            }
        } else {
            console.log("Invalid command, please use available commands or write 'exit' to escape");
        }
}
console.log = (...args) => {
    res.send(args.join(' '));
}
app.use(bodyParser.json());
app.post('/', (req, res) => {
    const sqlSentence = req.body.sqlsentence;

    // Execute the SQL sentence and handle the response
    try {
        const result = executePrompt(sqlSentence);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Define other API endpoints as needed

// Start the Express server
const port = 3003;
app.listen(port, () => {
    console.log(`Devilfish DBMS API listening at http://localhost:${port}`);
});