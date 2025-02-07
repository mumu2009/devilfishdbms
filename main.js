//this is a design for the DBMS and detabase
//use GPL3.0 lisense
const fs = require('fs');
const readline = require('readline');
const path = require('path');
const zlib = require('zlib');
const csv = require('csv-parser');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// 添加日志函数
function log(level, message) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} [${level}] ${message}`;
    console.log(logMessage);
    if (level !== 'DEBUG') { // 只记录非 DEBUG 级别的日志到文件
        fs.appendFileSync('dbms.log', logMessage + '\n');
    }
}

// 错误处理函数
function handleError(error, operation) {
    log('ERROR', `Error during ${operation}: ${error.message}`);
    console.error(`An error occurred during ${operation}. Please check the logs for more details.`);
}

const LRU = require('lru-cache');
class PartitionedTable {
    
    constructor(tableName, partitionKey, numPartitions = 10) {
        this.tableName = tableName;
        this.partitionKey = partitionKey;
        this.numPartitions = numPartitions;
        this.partitions = new Array(numPartitions).fill().map(() => new Map());
        this.compressed = false;

        console.log(`Initialized partitions for table ${tableName}:`, this.partitions);
    }
    
    

    // 根据分区键计算分区索引
    getPartitionIndex(data) {
        const keyValue = data[this.partitionKey];
        const hash = this.hash(keyValue);
        const partitionIndex = hash % this.numPartitions;
        //console.log(`Partition index for key ${keyValue}: ${partitionIndex}`); // 添加调试信息
        return partitionIndex;
    }

    // 简单的哈希函数
    hash(key) {
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            hash = (hash << 5) - hash + key.charCodeAt(i);
            hash |= 0; // 转换为 32 位整数
        }
        const absHash = Math.abs(hash);
        //console.log(`Hash for key ${key}: ${absHash}`); // 添加调试信息
        return absHash;
    }

    // 插入数据
    insert(data) {
        const partitionIndex = this.getPartitionIndex(data);
        const partition = this.partitions[partitionIndex];
        if (!partition) {
            this.partitions[partitionIndex] = new Map();
        }
        this.partitions[partitionIndex].set(data[this.partitionKey], data);
        //console.log(`Inserted data into partition ${partitionIndex}:`, data); // 添加调试信息
    }

    // PartitionedTable 类中的 query 方法
    query(query) {
        const results = [];
        this.partitions.forEach(partition => {
            // 确保 partition 不是 undefined 或 null
            if (partition) {
                for (let [key, data] of partition.entries()) {
                    // 确保 data 不是 undefined 或 null 并且是一个对象
                    if (data && typeof data === 'object' && !Array.isArray(data)) {
                        if (this.isMatch(data, query || {})) { // 确保 query 不是 undefined
                            results.push(data);
                        }
                    }
                }
            }
        });
        return results;
    }
    // 匹配查询条件
    isMatch(data, query) {
        // 确保 data 和 query 都不是 undefined 或 null 并且是对象
        if (!data || !query || typeof data !== 'object' || typeof query !== 'object') {
            return false;
        }

        return Object.keys(query).every(key => {
            if (!data.hasOwnProperty(key)) return false;

            const queryValue = query[key];
            const dataValue = data[key];

            // 如果查询条件是一个对象（例如带有操作符的情况）
            if (typeof queryValue === 'object' && queryValue !== null) {
                const op = Object.keys(queryValue)[0];
                const value = queryValue[op];

                switch (op) {
                    case '=':
                        return dataValue == value; // 使用宽松相等运算符来处理不同类型间的比较
                    case '>':
                        return dataValue > parseFloat(value);
                    case '<':
                        return dataValue < parseFloat(value);
                    case '>=':
                        return dataValue >= parseFloat(value);
                    case '<=':
                        return dataValue <= parseFloat(value);
                    case '<>':
                        return dataValue != value; // 不等于
                    case '=~':
                        return String(dataValue).match(new RegExp(value)); // 正则匹配
                    default:
                        return false;
                }
            } else {
                // 对于简单的等号赋值，直接比较值
                return dataValue == queryValue; // 同样使用宽松相等运算符
            }
        });
    }
}
class HypercubeDB {
    constructor() {
        this.data = new Map();
        this.indexes = new Map();
        this.locks = new Map();
        this.distanceHashes = new Map();
        this.queryCache = new Map(); // 查询缓存
        this.loadDataAsync();
        this.pyramidIndex = null;
        this.recursiveSphereWeaving = null;
        this.isLoaded = false; // 添加标志位
        this.extensions = new Map();

        this.isDroppingDatabase = false;
    }
    // 有损压缩方法
    conicalProjectionCompress(dataPoint, focalPoint = [0, 0, -Infinity]) {
        if (!Array.isArray(dataPoint) || dataPoint.length === 0) {
            return null; // 返回 null 或其他默认值
        }
    
        // 将高维数据映射到黎曼球面
        const spherePoint = this.mapToRiemannSphere(dataPoint);
    
        // 计算球心到数据点的向量
        const toPoint = spherePoint.map((v, i) => v - this.sphereCenter[i]);
    
        // 计算基准轴（球心到焦点的连线）
        const baseAxis = focalPoint.map((v, i) => v - this.sphereCenter[i]);
    
        // 计算夹角参数
        const theta = this.calculateAngle(baseAxis, toPoint);
        const phi = Math.atan2(toPoint[1], toPoint[0]);
    
        // 应用构造函数 f(x) = tan(x) 进行量化
        const compressed = [
            Math.round(Math.tan(theta) * 1e4) / 1e4,  // 量化精度保留4位小数
            Math.round(phi * 180 / Math.PI),          // 方位角转为角度制
            this.calculateIntensity(spherePoint),     // 强度参数
            Date.now() % 1000                         // 时间特征保留
        ];
    
        return compressed;
    }
    
    

    // 解压缩方法
    conicalProjectionDecompress(compressedData) {
        // 反量化参数
        const theta = Math.atan(compressedData[0]);
        const phi = compressedData[1] * Math.PI / 180;
        const intensity = compressedData[2];

        // 重建球面坐标
        const x = intensity * Math.sin(theta) * Math.cos(phi);
        const y = intensity * Math.sin(theta) * Math.sin(phi);
        const z = intensity * Math.cos(theta);

        // 反投影到原始数据空间
        return this.inverseRiemannMapping([x, y, z]);
    }

    // 辅助方法
    calculateAngle(v1, v2) {
        const dot = v1.reduce((sum, val, i) => sum + val * v2[i], 0);
        const mag1 = Math.sqrt(v1.reduce((sum, val) => sum + val ** 2, 0));
        const mag2 = Math.sqrt(v2.reduce((sum, val) => sum + val ** 2, 0));
        return Math.acos(dot / (mag1 * mag2));
    }

    calculateIntensity(point) {
        return Math.sqrt(point.reduce((sum, val) => sum + val ** 2, 0));
    }

    // 反投影到原始数据空间
    inverseRiemannMapping(spherePoint) {
        const [x, y, z] = spherePoint;
        const magnitude = Math.sqrt(x ** 2 + y ** 2 + z ** 2);
        const originalPoint = [x / magnitude, y / magnitude, z / magnitude];
        return originalPoint;
    }
    loadExetension(extensionPath) {
        try {
            const extension = require(extensionPath);
            if (typeof extension.execute === 'function') {
                this.extensions.set(extensionPath.name, extension);
                log('INFO', `Extension '${extensionPath.name}' registered`);
            } else {
                console.log("Invalid extension: must have an 'execute' function");
            }

        } catch (error) {
            handleError(error, 'loading extension');
        }
    }
    executeExtension(name, ...args) {
        if (this.extensions.has(name)) {
            return this.extensions.get(name).execute(this, ...args);

        } else {
            log('ERROR', `Extension '${extensionPath}' not found`);
        }
    }
    mapToRiemannSphere(dataPoint, n, R) {
        const dimensions = dataPoint.length;
        const distance = Math.sqrt(dataPoint.reduce((sum, xi, i) => sum + Math.pow(xi - (i === 0 ? n : 0), 2), 0));

        // 球极投影
        const mappedPoint = dataPoint.map((xi, i) => {
            if (i === 0) {
                return (xi - n) / (1 + Math.pow(distance / R, 2));
            } else {
                return xi / (Math.pow(distance / R, 2));
            }
        });

        return mappedPoint;
    }
    showDatabases() {
        try {
            const databases = Array.from(this.data.keys());
            if (databases.length === 0) {
                console.log("No databases found");
            } else {
                console.log("Databases:");
                databases.forEach(db => console.log(db));
            }
            log('INFO', 'Databases listed successfully');
        } catch (error) {
            handleError(error, 'listing databases');
        }
    }

    showTables() {
        try {
            if (!this.currentDatabase) {
                console.log("No database selected");
                return;
            }
            const tables = this.data.has(this.currentDatabase) ? Array.from(this.data.get(this.currentDatabase).keys()) : [];
            if (tables.length === 0) {
                console.log("No tables found in the current database");
            } else {
                console.log("Tables in current database:");
                tables.forEach(table => console.log(table));
            }
            log('INFO', 'Tables listed successfully');
        } catch (error) {
            handleError(error, 'listing tables');
        }
    }


    initializeCentroids(dataPoints, k) {
        const indices = Array.from({ length: dataPoints.length }, (_, i) => i);
        const randomIndices = indices.sort(() => Math.random() - 0.5).slice(0, k);
        return randomIndices.map(index => dataPoints[index]);
    }

    assignClusters(dataPoints, centroids) {
        const clusters = Array.from({ length: centroids.length }, () => []);
        dataPoints.forEach((dataPoint, index) => {
            const distances = centroids.map(centroid => this.euclideanDistance(dataPoint, centroid));
            const closestCentroidIndex = distances.indexOf(Math.min(...distances));
            clusters[closestCentroidIndex].push(index);
        });
        return clusters;
    }

    calculateCentroids(clusters, dataPoints) {
        return clusters.map(cluster => {
            if (cluster.length === 0) {
                return dataPoints[Math.floor(Math.random() * dataPoints.length)];
            }
            const sum = cluster.reduce((acc, index) => {
                return acc.map((sum, i) => sum + dataPoints[index][i]);
            }, Array(dataPoints[0].length).fill(0));
            return sum.map(sum => sum / cluster.length);
        });
    }

    euclideanDistance(point1, point2) {
        return Math.sqrt(point1.reduce((sum, value, index) => sum + Math.pow(value - point2[index], 2), 0));
    }

    haveConverged(oldCentroids, newCentroids) {
        return oldCentroids.every((oldCentroid, index) => {
            return this.euclideanDistance(oldCentroid, newCentroids[index]) < 1e-5;
        });
    }
    // 批量插入数据
    async insertBatch(tableName, dataArray) {
        try {
            if (!this.currentDatabase) {
                console.log("No database selected");
                return;
            }
            if (!this.data.has(this.currentDatabase) || !this.data.get(this.currentDatabase).has(tableName)) {
                console.log("Table does not exist");
                return;
            }

            if (this.acquireLock(tableName)) {
                const tableData = this.data.get(this.currentDatabase).get(tableName);

                // 确保 tableData 是一个 PartitionedTable 实例
                if (!(tableData instanceof PartitionedTable)) {
                    console.log("Invalid table data structure");
                    this.releaseLock(tableName);
                    return;
                }

                // 批量插入数据
                dataArray.forEach(data => {
                    const validData = {};
                    Object.keys(data).forEach(key => {
                        if (typeof key === 'string' && key.trim() !== '') {
                            validData[key.trim()] = data[key];
                        }
                    });

                    tableData.insert(validData);

                    // 更新索引
                    Object.keys(validData).forEach(dim => {
                        if (this.indexes.has(tableName) && this.indexes.get(tableName).has(dim)) {
                            const indexValue = validData[dim];
                            if (!this.indexes.get(tableName).get(dim).has(indexValue)) {
                                this.indexes.get(tableName).get(dim).set(indexValue, []);
                            }
                            this.indexes.get(tableName).get(dim).get(indexValue).push(validData);
                        }
                    });
                });

                this.saveData();
                this.releaseLock(tableName);
                console.log(`Inserted ${dataArray.length} records`);
                log('INFO', 'Batch insert completed successfully');
            } else {
                console.log("Table is locked");
            }
        } catch (error) {
            handleError(error, 'batch insert');
        }
    }

    // 批量更新数据
    // 批量更新数据
    async updateBatch(tableName, keyField, updates) {
        try {
            if (!Array.isArray(updates) || updates.length === 0) {
                console.log("Invalid or empty updates array");
                return;
            }
            if (!this.currentDatabase) {
                console.log("No database selected");
                return;
            }
            if (!this.data.has(this.currentDatabase) || !this.data.get(this.currentDatabase).has(tableName)) {
                console.log("Table does not exist");
                return;
            }

            if (this.acquireLock(tableName)) {
                const tableData = this.data.get(this.currentDatabase).get(tableName);

                // 确保 tableData 是一个 PartitionedTable 实例
                if (!(tableData instanceof PartitionedTable)) {
                    console.log("Invalid table data structure");
                    this.releaseLock(tableName);
                    return;
                }

                // 检查 updates 是否为数组且非空
                if (!Array.isArray(updates) || updates.length === 0) {
                    console.log("No updates provided");
                    this.releaseLock(tableName);
                    return;
                }

                updates.forEach(({ key, newData }) => {
                    const partitionIndex = tableData.getPartitionIndex({ [keyField]: key });
                    const partition = tableData.partitions[partitionIndex];
                    if (partition && partition.has(key)) {
                        const oldData = partition.get(key);
                        Object.assign(oldData, newData);

                        // 更新索引
                        Object.keys(newData).forEach(dim => {
                            if (this.indexes.has(tableName) && this.indexes.get(tableName).has(dim)) {
                                const indexValue = newData[dim];
                                if (!this.indexes.get(tableName).get(dim).has(indexValue)) {
                                    this.indexes.get(tableName).get(dim).set(indexValue, []);
                                }
                                this.indexes.get(tableName).get(dim).get(indexValue).push(oldData);
                            }
                        });

                        Object.keys(oldData).forEach(dim => {
                            if (newData[dim] === undefined && this.indexes.has(tableName) && this.indexes.get(tableName).has(dim)) {
                                this.indexes.get(tableName).get(dim).set(oldData[dim], this.indexes.get(tableName).get(dim).get(oldData[dim]).filter(data => data[keyField] !== oldData[keyField]));
                            }
                        });
                    }
                });

                this.saveData();
                this.releaseLock(tableName);
                console.log(`Updated ${updates.length} records`);
                log('INFO', 'Batch update completed successfully');
            } else {
                console.log("Table is locked");
            }
        } catch (error) {
            handleError(error, 'batch update');
            this.releaseLock(tableName);
        }
    }
    async loadDataAsync() {
        if (this.isLoaded) return; // 如果已经加载过，直接返回
        try {
            const dbFiles = await fs.promises.readdir(__dirname);
            const serializableDbData = new Map();
    
            await Promise.all(dbFiles.filter(file => file.endsWith('.db')).map(async (file) => {
                const dbName = file.slice(0, -3);
                const rawData = await fs.promises.readFile(path.join(__dirname, file));
                const decompressedData = zlib.gunzipSync(rawData);
                const dbData = JSON.parse(decompressedData.toString());
    
                for (const [tableName, tableData] of Object.entries(dbData)) {
                    const partitionedTable = new PartitionedTable(tableName, tableData.partitionKey, 10);
                    partitionedTable.partitions = tableData.partitions.map(partition => {
                        return new Map(partition.map(([key, value]) => [
                            key,
                            this.conicalProjectionDecompress(value)
                        ]));
                    });
                    serializableDbData.set(tableName, partitionedTable);
                }
    
                this.data.set(dbName, serializableDbData);
            }));
    
            log('INFO', 'Data loaded successfully');
            this.isLoaded = true; // 标记为已加载
        } catch (error) {
            if (error.code === 'ENOENT') {
                log('INFO', 'No database files found; starting fresh.');
            } else {
                handleError(error, 'loading data');
            }
        }
    }
     

    loadData() {
        try {
            const dbFiles = fs.readdirSync(__dirname);
            dbFiles.forEach(file => {
                if (file.endsWith('.db')) {
                    const dbName = file.slice(0, -3);
                    const rawData = fs.readFileSync(path.join(__dirname, file));
                    const decompressedData = zlib.gunzipSync(rawData);
                    this.data.set(dbName, new Map(Object.entries(JSON.parse(decompressedData.toString()))));
                }
            });
            log('INFO', 'Data loaded successfully');
        } catch (error) {
            handleError(error, 'loading data');
        }
    }

    // 修改后的 saveData 方法
    async saveData() {
        try {
            console.log('Current data structure:', this.data);
    
            const savePromises = [];
            const dbFiles = Array.from(this.data.keys());
    
            if (dbFiles.length === 0) {
                log('INFO', 'No databases to save');
                return;
            }
    
            for (const dbName of dbFiles) {
                console.log('Saving database:', dbName);
    
                const dbFilePath = path.resolve(__dirname, `${dbName}.db`);
                const tempFilePath = path.resolve(__dirname, `${dbName}.db.tmp`);
    
                // 压缩数据
                const compressedData = {};
                const dbData = this.data.get(dbName);
    
                if (!dbData) {
                    log('ERROR', `Database data is undefined for ${dbName}`);
                    continue;
                }
    
                for (const [tableName, tableData] of dbData.entries()) {
                    if (!tableData.partitions) {
                        log('ERROR', `Partitions are undefined for table ${tableName}`);
                        continue;
                    }
    
                    compressedData[tableName] = {
                        partitions: Array.from(tableData.partitions).map(partition => {
                            if (!partition) {
                                log('ERROR', `Partition is undefined for table ${tableName}`);
                                return [];
                            }
                            return Array.from(partition.entries()).map(([key, value]) => {
                                if (value === undefined) {
                                    log('ERROR', `Value is undefined for key ${key} in table ${tableName}`);
                                    return [key, null];
                                }
                                return [key, this.conicalProjectionCompress(value)];
                            });
                        }),
                        partitionKey: tableData.partitionKey
                    };
                }
    
                // 清理旧的临时文件（如果存在）
                if (fs.existsSync(tempFilePath)) {
                    await fs.promises.unlink(tempFilePath);
                }
    
                // 写入新数据到临时文件
                const writeStream = fs.createWriteStream(tempFilePath);
    
                // 使用流式压缩和写入
                const compressStream = zlib.createGzip();
                compressStream.pipe(writeStream);
    
                compressStream.write(JSON.stringify(compressedData)); // 使用 compressedData
                compressStream.end();
    
                await new Promise((resolve, reject) => {
                    writeStream.on('finish', resolve);
                    writeStream.on('error', reject);
                    compressStream.on('error', reject);
                });
    
                // 如果旧的 .db 文件存在，则先删除它
                if (fs.existsSync(dbFilePath)) {
                    await fs.promises.unlink(dbFilePath);
                }
    
                // 确认临时文件存在后再重命名
                await fs.promises.access(tempFilePath, fs.constants.F_OK);
                await fs.promises.rename(tempFilePath, dbFilePath);
            }
            log('INFO', 'Data saved successfully');
        } catch (error) {
            log('ERROR', `Save failed: ${error.message}`);
            handleError(error, 'saving data');
        }
    }   

    acquireLock(tableName) {
        if (!this.locks.has(tableName)) {
            this.locks.set(tableName, true);
            log('DEBUG', `Lock acquired for table ${tableName}`);
            return true;
        }
        log('DEBUG', `Failed to acquire lock for table ${tableName}`);
        return false;
    }

    releaseLock(tableName) {
        this.locks.delete(tableName);
        log('DEBUG', `Lock released for table ${tableName}`);
    }
    createCompositeIndex(tableName, dimensions) {
        try {
            if (!this.currentDatabase) {
                console.log("No database selected");
                return;
            }
            if (!this.data.has(this.currentDatabase) || !this.data.get(this.currentDatabase).has(tableName)) {
                console.log("Table does not exist");
                return;
            }

            if (this.acquireLock(tableName)) {
                const indexKey = dimensions.join('|'); // 使用 | 分隔维度
                if (!this.indexes.has(tableName)) {
                    this.indexes.set(tableName, new Map());
                }

                if (!this.indexes.get(tableName).has(indexKey)) {
                    const dimensionTree = new DimensionsTree(dimensions); // 创建维度树

                    // 插入数据到维度树
                    this.data.get(this.currentDatabase).get(tableName).forEach(data => {
                        const keys = dimensions.map(dim => data[dim]); // 提取维度值
                        dimensionTree.insert(keys, data); // 插入数据
                    });

                    this.indexes.get(tableName).set(indexKey, dimensionTree); // 存储索引
                    this.saveData();
                    console.log(`Composite index on ${dimensions.join(', ')} added`);
                }

                this.releaseLock(tableName);
                log('INFO', 'Composite index added successfully');
            } else {
                console.log("Table is locked");
            }
        } catch (error) {
            handleError(error, 'adding composite index');
        }
    }

    createDatabase(name) {
        try {
            if (this.data.has(name)) {
                console.log("Database already exists");
            } else {
                this.data.set(name, new Map());
                this.saveData();
                console.log("Database created");
            }
            log('INFO', 'Database created successfully');
        } catch (error) {
            handleError(error, 'creating database');
        }
    }
    
    createTable(tableName, schema, partitionKey = 'id') {
        try {
            if (!this.currentDatabase) {
                console.log("No database selected");
                return;
            }
            if (this.data.has(this.currentDatabase) && this.data.get(this.currentDatabase).has(tableName)) {
                console.log("Table already exists");
            } else {
                if (this.acquireLock(tableName)) {
                    if (!this.data.has(this.currentDatabase)) {
                        this.data.set(this.currentDatabase, new Map());
                    }
                    const partitionedTable = new PartitionedTable(tableName, partitionKey);
                    this.data.get(this.currentDatabase).set(tableName, partitionedTable);
                    this.releaseLock(tableName);
                    console.log(`Table created with partitioning by ${partitionKey}`);
                } else {
                    console.log("Table is locked");
                }
            }
            log('INFO', 'Table created successfully');
        } catch (error) {
            handleError(error, 'creating table');
        }
    }
    

    useDatabase(name) {
        try {
            if (this.data.has(name)) {
                this.currentDatabase = name;
                console.log("Database selected");
            } else {
                console.log("Database does not exist");
            }
            log('INFO', 'Database selected successfully');
        } catch (error) {
            handleError(error, 'using database');
        }
    }
    

    // 修改后的 createTable 方法
    createTable(tableName, schema, partitionKey = 'id') {
        try {
            if (!this.currentDatabase) {
                console.log("No database selected");
                return;
            }
            if (this.data.has(this.currentDatabase) && this.data.get(this.currentDatabase).has(tableName)) {
                console.log("Table already exists");
            } else {
                if (this.acquireLock(tableName)) {
                    if (!this.data.has(this.currentDatabase)) {
                        this.data.set(this.currentDatabase, new Map());
                    }
                    const partitionedTable = new PartitionedTable(tableName, partitionKey);
                    this.data.get(this.currentDatabase).set(tableName, partitionedTable);
                    this.releaseLock(tableName);
                    console.log(`Table created with partitioning by ${partitionKey}`);
                } else {
                    console.log("Table is locked");
                }
            }
            log('INFO', 'Table created successfully');
        } catch (error) {
            handleError(error, 'creating table');
        }
    }
    

    addDimension(tableName, dimension) {
        try {
            if (!this.currentDatabase) {
                console.log("No database selected");
                return;
            }
            if (!this.data.has(this.currentDatabase) || !this.data.get(this.currentDatabase).has(tableName)) {
                console.log("Table does not exist");
                return;
            }
            if (this.acquireLock(tableName)) {
                if (!this.indexes.get(tableName).has(dimension)) {
                    this.indexes.get(tableName).set(dimension, new Map());
                    this.data.get(this.currentDatabase).get(tableName).forEach((data, key) => {
                        if (data[dimension] !== undefined) {
                            if (!this.indexes.get(tableName).get(dimension).has(data[dimension])) {
                                this.indexes.get(tableName).get(dimension).set(data[dimension], []);
                            }
                            this.indexes.get(tableName).get(dimension).get(data[dimension]).push(data);
                        }
                    });
                }
                this.saveData();
                this.releaseLock(tableName);
                console.log(`Dimension ${dimension} added`);
            } else {
                console.log("Table is locked");
            }
            log('INFO', 'Dimension added successfully');
        } catch (error) {
            handleError(error, 'adding dimension');
        }
    }

    removeDimension(tableName, dimension) {
        try {
            if (!this.currentDatabase) {
                console.log("No database selected");
                return;
            }
            if (!this.data.has(this.currentDatabase) || !this.data.get(this.currentDatabase).has(tableName)) {
                console.log("Table does not exist");
                return;
            }
            if (this.acquireLock(tableName)) {
                if (this.indexes.get(tableName).has(dimension)) {
                    this.indexes.get(tableName).delete(dimension);
                    this.data.get(this.currentDatabase).get(tableName).forEach((data, key) => {
                        delete data[dimension];
                    });
                }
                this.saveData();
                this.releaseLock(tableName);
                console.log(`Dimension ${dimension} removed`);
            } else {
                console.log("Table is locked");
            }
            log('INFO', 'Dimension removed successfully');
        } catch (error) {
            handleError(error, 'Removing dimension');
        }
    }

    // main.js
    insertData(tableName, data) {
        try {
            if (!this.currentDatabase) {
                console.log("No database selected");
                return;
            }
            if (!this.data.has(this.currentDatabase) || !this.data.get(this.currentDatabase).has(tableName)) {
                console.log(`Table ${tableName} does not exist in the current database`);
                return;
            }
            if (this.acquireLock(tableName)) {
                const partitionedTable = this.data.get(this.currentDatabase).get(tableName);
                if (!(partitionedTable instanceof PartitionedTable)) {
                    console.log(`Invalid table data structure for ${tableName}`);
                    this.releaseLock(tableName);
                    return;
                }
    
                console.log('Inserting data:', data);
    
                if (typeof data !== 'object' || data === null) {
                    console.log("Invalid data format");
                    this.releaseLock(tableName);
                    return;
                }
    
                if (!data[partitionedTable.partitionKey]) {
                    console.log(`Missing required field: ${partitionedTable.partitionKey}`);
                    this.releaseLock(tableName);
                    return;
                }
    
                const validData = {};
                Object.keys(data).forEach(key => {
                    if (typeof key === 'string' && key.trim() !== '' && data[key] !== 0) {
                        validData[key.trim()] = data[key];
                    } else if (typeof key === 'string' && key.trim() !== '') {
                        console.log(`Ignoring field ${key} with value 0`);
                    }
                });
    
                data = validData;
    
                partitionedTable.insert(data);
    
                // 更新索引
                Object.keys(data).forEach(dim => {
                    if (!this.indexes.has(tableName)) {
                        this.indexes.set(tableName, new Map());
                    }
                    if (!this.indexes.get(tableName).has(dim)) {
                        this.indexes.get(tableName).set(dim, new Map());
                    }
                    const indexValue = data[dim];
                    if (!this.indexes.get(tableName).get(dim).has(indexValue)) {
                        this.indexes.get(tableName).get(dim).set(indexValue, []);
                    }
                    this.indexes.get(tableName).get(dim).get(indexValue).push(data);
                });
    
                this.saveData();
                this.releaseLock(tableName);
                console.log("Data inserted");
                log('INFO', 'Data inserted successfully');
            } else {
                console.log("Table is locked");
            }
        } catch (error) {
            handleError(error, 'inserting data');
        }
    }
    

    insertIntoDistanceHash(tableName, data) {
        if (!this.distanceHashes.has(tableName)) {
            this.distanceHashes.set(tableName, new Map());
        }

        const dimensions = Object.keys(data);
        const numDimensions = dimensions.length;

        // 假设我们使用一个简单的哈希函数，将数据点映射到多个哈希桶中
        const numBuckets = 10; // 哈希桶的数量
        const bucketSize = 0.1; // 每个哈希桶的大小

        for (let i = 0; i < numBuckets; i++) {
            const bucketKey = i * bucketSize;
            if (!this.distanceHashes.get(tableName).has(bucketKey)) {
                this.distanceHashes.get(tableName).set(bucketKey, []);
            }

            // 计算数据点到原点的距离
            const distance = Math.sqrt(dimensions.reduce((sum, dim) => sum + Math.pow(data[dim], 2), 0));

            // 将数据点插入到相应的哈希桶中
            if (distance >= bucketKey && distance < bucketKey + bucketSize) {
                this.distanceHashes.get(tableName).get(bucketKey).push(data);
            }
        }
    }

    dropTable(tableName) {
        try {
            if (!this.currentDatabase) {
                console.log("No database selected");
                return;
            }
            if (this.acquireLock(tableName)) {
                if (this.data.has(this.currentDatabase) && this.data.get(this.currentDatabase).has(tableName)) {
                    // 删除表的数据
                    this.data.get(this.currentDatabase).delete(tableName);
                    // 删除表的索引
                    this.indexes.delete(tableName);
                    // 删除表的锁
                    this.locks.delete(tableName);
                    // 删除表的距离哈希
                    this.distanceHashes.delete(tableName);
                    // 删除表的查询缓存
                    this.queryCache.forEach((value, key) => {
                        if (key.tableName === tableName) {
                            this.queryCache.delete(key);
                        }
                    });
                    this.saveData();
                    this.releaseLock(tableName);
                    console.log("Table dropped");
                } else {
                    console.log("Table does not exist");
                }
                log('INFO', 'Table dropped successfully');
            } else {
                console.log("Table is locked");
            }
        } catch (error) {
            handleError(error, 'dropping table');
        }
    }

    deleteData(tableName, query) {
        try {
            if (!this.currentDatabase) {
                console.log("No database selected");
                return;
            }
            if (!this.data.has(this.currentDatabase) || !this.data.get(this.currentDatabase).has(tableName)) {
                console.log("Table does not exist");
                return;
            }
            if (this.acquireLock(tableName)) {
                const partitionedTable = this.data.get(this.currentDatabase).get(tableName);
                let deletedCount = 0;

                partitionedTable.partitions.forEach((partition, partitionIndex) => {
                    if (partitionedTable.isMatch(data, query)) {
                        partition.delete(key);
                        deletedCount++;

                        Object.keys(this.indexes.get(tableName)).forEach(dim => {
                            if (data.hasOwnProperty(dim)) { // 确保 data 包含该维度
                                const indexEntries = this.indexes.get(tableName).get(dim);
                                if (indexEntries && indexEntries.has(data[dim])) {
                                    const oldDataList = indexEntries.get(data[dim]);
                                    if (oldDataList) { // 确保 oldDataList 不是 undefined 或 null
                                        const filteredData = oldDataList.filter(d => d[keyField] !== data[keyField]);
                                        this.indexes.get(tableName).get(dim).set(data[dim], filteredData);
                                    }
                                }
                            }
                        });
                    }
                });

                if (deletedCount > 0) {
                    this.saveData();
                    console.log(`Deleted ${deletedCount} records`);
                } else {
                    console.log("No records found matching the condition");
                }

                this.releaseLock(tableName);
                log('INFO', 'Data deleted successfully');
            } else {
                console.log("Table is locked");
            }
        } catch (error) {
            handleError(error, 'deleting data');
            this.releaseLock(tableName);
        }
    }

    updateData(tableName, query, newData) {
        try {
            if (!this.currentDatabase) {
                console.log("No database selected");
                return;
            }
            if (!this.data.has(this.currentDatabase) || !this.data.get(this.currentDatabase).has(tableName)) {
                console.log("Table does not exist");
                return;
            }
            if (this.acquireLock(tableName)) {
                const partitionedTable = this.data.get(this.currentDatabase).get(tableName);
                let updatedCount = 0;

                partitionedTable.partitions.forEach(partition => {
                    if (partition) {
                        for (let [key, data] of partition.entries()) {
                            if (partitionedTable.isMatch(data, query)) {
                                Object.assign(data, newData);
                                updatedCount++;

                                // 更新索引
                                Object.keys(newData).forEach(dim => {
                                    if (this.indexes.has(tableName) && this.indexes.get(tableName).has(dim)) {
                                        const indexValue = newData[dim];
                                        if (!this.indexes.get(tableName).get(dim).has(indexValue)) {
                                            this.indexes.get(tableName).get(dim).set(indexValue, []);
                                        }
                                        this.indexes.get(tableName).get(dim).get(indexValue).push(data);
                                    }
                                });

                                Object.keys(query).forEach(dim => {
                                    if (newData[dim] === undefined && this.indexes.has(tableName) && this.indexes.get(tableName).has(dim)) {
                                        const indexValue = query[dim];
                                        const indexEntries = this.indexes.get(tableName).get(dim);
                                        if (indexEntries && indexEntries.has(indexValue)) {
                                            const oldDataList = indexEntries.get(indexValue);
                                            if (oldDataList) { // 确保 oldDataList 不是 undefined 或 null
                                                const filteredData = oldDataList.filter(d => d !== data);
                                                this.indexes.get(tableName).get(dim).set(indexValue, filteredData);
                                            }
                                        }
                                    }
                                });

                            }
                        }
                    }
                });

                if (updatedCount > 0) {
                    this.saveData();
                    console.log(`Updated ${updatedCount} records`);
                } else {
                    console.log("No records found matching the condition");
                }

                this.releaseLock(tableName);
                log('INFO', 'Data updated successfully');
            } else {
                console.log("Table is locked");
            }
        } catch (error) {
            handleError(error, 'updating data');
            this.releaseLock(tableName);
        }
    }
    // HypercubeDB 类中的 selectData 方法
    selectData(tableName, query) {
        try {
            if (!this.currentDatabase) {
                console.log("No database selected");
                return;
            }
            const currentDB = this.data.get(this.currentDatabase);
            if (!currentDB) {
                console.log("Database does not exist");
                return;
            }
            if (!currentDB.has(tableName)) {
                console.log("Table does not exist");
                return;
            }
            if (this.acquireLock(tableName)) {
                try {
                    const cacheKey = JSON.stringify({ tableName, query });
                    if (this.queryCache.has(cacheKey)) {
                        console.log("Using cached results");
                        const results = this.queryCache.get(cacheKey);
                        console.log("Selected data:", results);
                        return { data: results }; // 确保返回的数据结构包含 data 属性
                    }

                    const partitionedTable = currentDB.get(tableName);
                    //console.log('partitionedTable:', partitionedTable); // 添加调试信息

                    // 检查 partitionedTable 是否存在且不为空
                    if (partitionedTable && partitionedTable instanceof PartitionedTable) {
                        let results = partitionedTable.query(query || {}); // 确保 query 不是 undefined

                        // 使用距离哈希加速查询
                        if (query && query.distance !== undefined) {
                            // ... 其他逻辑保持不变 ...
                        } else {
                            // ... 其他逻辑保持不变 ...
                        }

                        // 根据聚类标签查询
                        if (query && query.label !== undefined) {
                            results = results.filter(data => data.label === query.label);
                        }

                        console.log("Selected data:", results);
                        this.queryCache.set(cacheKey, results); // 缓存结果
                        return { data: results }; // 确保返回的数据结构包含 data 属性
                    } else {
                        console.log('partitionedTable is not an instance of PartitionedTable or is undefined');
                    }
                } catch (error) {
                    handleError(error, 'selecting data');
                    return { data: [] };
                } finally {
                    this.releaseLock(tableName);
                }
            } else {
                console.log("Table is locked");
            }
            log('INFO', 'Data selected successfully');
        } catch (error) {
            handleError(error, 'selecting data');
        }
    }
    deleteColumn(tableName, column, query) {
        try {
            if (!this.currentDatabase) {
                console.log("No database selected");
                return;
            }
            if (!this.data.has(this.currentDatabase) || !this.data.get(this.currentDatabase).has(tableName)) {
                console.log("Table does not exist");
                return;
            }
            if (this.acquireLock(tableName)) {
                const partitionedTable = this.data.get(this.currentDatabase).get(tableName);
                let updated = false;

                partitionedTable.partitions.forEach(partition => {
                    if (partition) {
                        for (let [key, data] of partition.entries()) {
                            if (partitionedTable.isMatch(data, query)) {
                                // 删除列
                                if (data.hasOwnProperty(column)) {
                                    delete data[column];
                                    updated = true;
                                }
                            }
                        }
                    }
                });

                if (updated) {
                    // 更新索引
                    this.updateIndexesAfterColumnDeletion(tableName, column);

                    this.saveData();
                    console.log(`Column ${column} deleted from records matching the condition`);
                } else {
                    console.log("No records found matching the condition");
                }

                this.releaseLock(tableName);
                log('INFO', 'Column deleted successfully');
            } else {
                console.log("Table is locked");
            }
        } catch (error) {
            handleError(error, 'deleting column');
            this.releaseLock(tableName); // 确保在发生错误时释放锁
        }
    }

    updateIndexesAfterColumnDeletion(tableName, column) {
        if (this.indexes.has(tableName) && this.indexes.get(tableName).has(column)) {
            this.indexes.get(tableName).delete(column);
        }
    }

    // ... 其他方法 ...

    getFuzzyFunction(tableName, dim1, dim2) {
        if (!this.currentDatabase) {
            console.log("No database selected");
            return;
        }
        if (!this.data[this.currentDatabase][tableName]) {
            console.log("Table does not exist");
            return;
        }
        const dataPoints = Object.values(this.data[this.currentDatabase][tableName]);
        const filteredData = dataPoints.filter(data => data[dim1] !== undefined && data[dim2] !== undefined);
        return (x, y) => {
            let sum = 0;
            let count = 0;
            filteredData.forEach(data => {
                sum += data[dim1] * x + data[dim2] * y;
                count++;
            });
            return count > 0 ? sum / count : 0;
        };
    }

    taylorExpand(tableName, dim1, dim2, x0, y0, order) {
        const fuzzyFunction = this.getFuzzyFunction(tableName, dim1, dim2);
        const terms = [];
        for (let i = 0; i <= order; i++) {
            for (let j = 0; j <= order - i; j++) {
                const term = this.taylorTerm(fuzzyFunction, dim1, dim2, x0, y0, i, j);
                terms.push(term);
            }
        }
        return terms;
    }

    taylorTerm(fuzzyFunction, dim1, dim2, x0, y0, i, j) {
        const h = 1e-5;
        let derivative = 0;
        for (let k = 0; k <= i; k++) {
            for (let l = 0; l <= j; l++) {
                const sign = Math.pow(-1, k + l);
                const coeff = Math.pow(h, k + l) / (factorial(k) * factorial(l));
                const x = x0 + (i - k) * h;
                const y = y0 + (j - l) * h;
                derivative += sign * coeff * fuzzyFunction(x, y);
            }
        }
        return derivative * Math.pow(x0, i) * Math.pow(y0, j) / factorial(i) / factorial(j);
    }

    importFromCSV(tableName, filePath) {
        if (!this.currentDatabase) {
            console.log("No database selected");
            return;
        }
        if (!this.data[this.currentDatabase][tableName]) {
            console.log("Table does not exist");
            return;
        }
        if (this.acquireLock(tableName)) {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    this.insertData(tableName, row);
                })
                .on('end', () => {
                    console.log('CSV file successfully imported');
                    this.releaseLock(tableName);
                });
        } else {
            console.log("Table is locked");
        }
    }
    // 高维球面映射算法
    projectToRiemannSphere(tableName, dimensions, viewpoint = [0, 0, 0]) {
        if (!this.currentDatabase || !this.data[this.currentDatabase][tableName]) {
            console.log("Database/Table not selected");
            return [];
        }

        const points = Object.values(this.data[this.currentDatabase][tableName]);
        return points.map(data => {
            // 1. 标准化高维坐标
            const rawCoords = dimensions.map(d => parseFloat(data[d]) || 0);
            const magnitude = Math.sqrt(rawCoords.reduce((sum, val) => sum + val * val, 0));

            // 2. 球极投影（Stereographic Projection）
            const projected = rawCoords.map((coord, i) => {
                return coord / (1 - (viewpoint[i] || 0));
            });

            // 3. 保持相对距离的透视变换
            const distanceWeight = 1 / (1 + Math.exp(-magnitude));

            // 4. 生成三维可视化坐标（示例使用前三维度）
            return {
                x: projected[0] * distanceWeight,
                y: projected[1] * distanceWeight,
                z: projected[2] * distanceWeight,
                metadata: data
            };
        });
    }

    // 视角变换响应函数
    calculateViewTransform(phi, theta) {
        // 将球坐标转换为笛卡尔坐标
        return {
            x: Math.sin(theta) * Math.cos(phi),
            y: Math.sin(theta) * Math.sin(phi),
            z: Math.cos(theta)
        };
    }

    // 光线投射查询
    raycastQuery(tableName, origin, direction) {
        const points = this.projectToRiemannSphere(tableName, ['x', 'y', 'z']);
        const results = [];

        points.forEach(point => {
            // 计算点到光线的距离
            const vecToPoint = [point.x - origin[0], point.y - origin[1], point.z - origin[2]];
            const crossProd = [
                direction[1] * vecToPoint[2] - direction[2] * vecToPoint[1],
                direction[2] * vecToPoint[0] - direction[0] * vecToPoint[2],
                direction[0] * vecToPoint[1] - direction[1] * vecToPoint[0]
            ];
            const distance = Math.sqrt(crossProd.reduce((sum, val) => sum + val * val, 0));

            if (distance < 0.1) { // 命中阈值
                results.push({
                    point,
                    screenPos: this._calculateScreenPosition(point, origin, direction),
                    distance
                });
            }
        });

        return results.sort((a, b) => a.distance - b.distance);
    }

    _calculateScreenPosition(point, cameraPos, lookDir) {
        // 简化投影计算（实际需要完整的相机矩阵）
        const offsetX = point.x - cameraPos[0];
        const offsetY = point.y - cameraPos[1];
        const dot = offsetX * lookDir[0] + offsetY * lookDir[1];
        return {
            x: dot * 100, // 简化的屏幕坐标转换
            y: (point.z - cameraPos[2]) * 50
        };
    }
    // 添加到 HypercubeDB 类中
    async calculateIntersectionPoints(dimensions, func, sphereRadius = 1, resolution = 0.1) {
        const points = [];
        const min = -sphereRadius;
        const max = sphereRadius;

        // 使用 TypedArray 提高数值计算性能
        const step = resolution;
        const numSteps = Math.floor((max - min) / step) + 1;
        const numDimensions = dimensions.length;

        // 预分配 TypedArray 数组
        const dataPoints = new Float32Array(numDimensions * numSteps * numSteps * numSteps);

        let index = 0;
        for (let x = min; x <= max; x += step) {
            for (let y = min; y <= max; y += step) {
                for (let z = min; z <= max; z += step) {
                    // 计算高维点
                    for (let i = 0; i < numDimensions; i++) {
                        dataPoints[index * numDimensions + i] = (i === 0 ? x : i === 1 ? y : i === 2 ? z : 0);
                    }
                    index++;
                }
            }
        }

        // 使用 Web Workers 进行并行计算
        return new Promise((resolve) => {
            const worker = new Worker('worker.js');
            worker.postMessage({ dataPoints, numDimensions, func, sphereRadius });

            worker.onmessage = (event) => {
                points.push(...event.data);
                worker.terminate();
                resolve(points);
            };
        });
    }

    insertIntersectionPoints(tableName, dimensions, func, sphereRadius = 1, resolution = 0.1) {
        if (!this.currentDatabase) {
            console.log("No database selected");
            return;
        }
        if (!this.data[this.currentDatabase][tableName]) {
            console.log("Table does not exist");
            return;
        }
        if (this.acquireLock(tableName)) {
            const points = this.calculateIntersectionPoints(dimensions, func, sphereRadius, resolution);
            points.forEach(point => {
                const data = {};
                dimensions.forEach((dim, i) => {
                    data[dim] = point[i];
                });
                this.insertData(tableName, data);
            });
            this.releaseLock(tableName);
            console.log("Intersection points inserted");
        } else {
            console.log("Table is locked");
        }
        log('INFO', 'Intersection points inserted successfully');
    }
    dropdatabase(databaseName) {
        try {
            if (!this.data.has(databaseName)) {
                console.log(`Database "${databaseName}" does not exist`);
                return;
            }

            this.isDroppingDatabase = true; // 设置标志位
            // 从内存中移除数据库数据
            this.data.delete(databaseName);
            this.indexes.delete(databaseName);
            this.locks.delete(databaseName);
            this.distanceHashes.delete(databaseName);
            this.queryCache.forEach((value, key) => {
                if (key.tableName && key.tableName.includes(databaseName)) {
                    this.queryCache.delete(key);
                }
            });

            // 保存数据以确保内存中的更改被写入磁盘
            this.saveData();

            // 删除数据库文件
            const dbFilePath = path.join(__dirname, `${databaseName}.db`);
            try {
                if (fs.existsSync(dbFilePath)) {
                    fs.unlinkSync(dbFilePath);
                    console.log(`Database "${databaseName}" deleted`);
                }
                // 同时删除临时文件
                const tempPath = path.join(__dirname, `${databaseName}.db.tmp`);
                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            } catch (fileError) {
                console.log(`File cleanup error: ${fileError.message}`);
            }
            this.isDroppingDatabase = false; // 重置标志位
        } catch (error) {
            handleError(error, 'dropping database');
        }
    }
    createPyramidIndex(tableName, maxCapacity = 100, k = 5) {
        if (!this.currentDatabase || !this.data.has(this.currentDatabase) || !this.data.get(this.currentDatabase).has(tableName)) {
            console.log("Table does not exist");
            return;
        }
        const data = Array.from(this.data.get(this.currentDatabase).get(tableName).values());
        this.pyramidIndex = new PyramidIndex(data, maxCapacity, k);
        console.log("Pyramid index created");
    }

    queryPyramidIndex(queryPoint) {
        if (!this.pyramidIndex) {
            console.log("Pyramid index not created");
            return;
        }
        const results = this.pyramidIndex.query(queryPoint);
        console.log("Query results:", results);
    }

    createRecursiveSphereWeaving(tableName) {
        if (!this.currentDatabase || !this.data.has(this.currentDatabase) || !this.data.get(this.currentDatabase).has(tableName)) {
            console.log("Table does not exist");
            return;
        }
        const data = Array.from(this.data.get(this.currentDatabase).get(tableName).values());
        this.recursiveSphereWeaving = new RecursiveSphereWeaving(data);
        console.log("Recursive sphere weaving created");
    }

    queryRecursiveSphereWeaving(queryPoint) {
        if (!this.recursiveSphereWeaving) {
            console.log("Recursive sphere weaving not created");
            return;
        }
        const results = this.recursiveSphereWeaving.query(queryPoint);
        console.log("Query results:", results);
    }
    registerExtension(extension) {
        if (extension.name && typeof extension.execute === 'function') {
            this.extensions[extension.name] = extension;
            log('INFO', `Extension '${extension.name}' registered`);
        } else {
            console.log("Invalid extension: must have a 'name' property and an 'execute' function");
        }
    }

    // 执行扩展命令
    executeExtension(name, ...args) {
        if (this.extensions[name]) {
            return this.extensions[name].execute(this, ...args);
        } else {
            console.log(`Extension '${name}' not found`);
        }
    }

}
class RiemannSphereDB {
    constructor() {
        this.data = {}; // 存储原始高维数据
        this.mappedData = {}; // 存储映射后的低维数据
        this.sphereCenter = [0, 0, 0];  // 球心坐标
        this.compressionRate = 0.7;
    }

    insertData(dataPoint) {
        const key = this.hashDataPoint(dataPoint);
        this.data[key] = dataPoint;
        this.mappedData[key] = this.mapToRiemannSphere(dataPoint);
    }

    hashDataPoint(dataPoint) {
        return dataPoint.join('-');
    }

    mapToRiemannSphere(dataPoint) {
        const n = 0; // 假设球心的第一个坐标为 0
        const R = 1; // 假设球半径为 1
        return mapToRiemannSphere(dataPoint, n, R);
    }
    selectData(tableName, query) {
        try {
            if (!this.currentDatabase) {
                console.log("No database selected");
                return;
            }
            const currentDB = this.data.get(this.currentDatabase);
            if (!currentDB) {
                console.log("Database does not exist");
                return;
            }
            if (!currentDB.has(tableName)) {
                console.log("Table does not exist");
                return;
            }
            if (this.acquireLock(tableName)) {
                try {
                    let results = this.data[this.currentDatabase][tableName];

                    // 使用距离哈希加速查询
                    if (query.distance !== undefined) {
                        const distance = query.distance;
                        const bucketSize = 0.1; // 每个哈希桶的大小
                        const bucketKey = Math.floor(distance / bucketSize) * bucketSize;

                        if (this.distanceHashes[tableName][bucketKey]) {
                            results = this.distanceHashes[tableName][bucketKey].filter(data => {
                                const pointDistance = Math.sqrt(Object.keys(data).reduce((sum, dim) => sum + Math.pow(data[dim], 2), 0));
                                return pointDistance >= distance - bucketSize && pointDistance < distance + bucketSize;
                            });
                        } else {
                            results = [];
                        }
                    } else {
                        // 使用索引进行查询
                        const indexKeys = Object.keys(this.indexes[tableName]).filter(indexKey => {
                            return indexKey.split('_').every(dim => query[dim] !== undefined);
                        });

                        if (indexKeys.length > 0) {
                            const indexKey = indexKeys[0];
                            const indexValues = indexKey.split('_').map(dim => query[dim]);
                            const indexValue = indexValues.join('_');
                            results = this.indexes[tableName][indexKey][indexValue] || [];
                        } else {
                            // 解析查询条件
                            const filterFunction = this.parseQuery(query);
                            results = results.filter(filterFunction);
                        }
                    }

                    // 根据聚类标签查询
                    if (query.label !== undefined) {
                        results = results.filter(data => data.label === query.label);
                    }

                    console.log("Selected data:", results);
                } finally {
                    this.releaseLock(tableName);
                }
            } else {
                console.log("Table is locked");
            }
            log('INFO', 'Data selected successfully');
        } catch (error) {
            handleError(error, 'selecting data');
        }
    }

    isMatch(data, query) {
        // 确保 data 和 query 都不是 undefined 或 null 并且是对象
        if (!data || !query || typeof data !== 'object' || typeof query !== 'object') {
            return false;
        }
        return Object.keys(query).every(key =>
            data.hasOwnProperty(key) && data[key] === query[key]
        );
    }
    kMeansClustering(k) {
        const lowDimPoints = Object.values(this.mappedData);
        const clusters = this.performKMeans(lowDimPoints, k);

        // 将聚类结果映射回高维空间
        const highDimClusters = clusters.map(cluster => {
            return cluster.map(mappedPoint => {
                const key = this.hashDataPoint(mappedPoint);
                return this.data[key];
            });
        });

        return highDimClusters;
    }


    performKMeans(points, k, maxIterations = 100) {
        if (points.length === 0 || k <= 0) {
            return [];
        }

        // 1. 随机初始化K个质心
        let centroids = this.initializeCentroids(points, k);

        let clusters = [];
        let previousClusters = [];

        for (let iteration = 0; iteration < maxIterations; iteration++) {
            // 2. 将每个数据点分配到最近的质心
            clusters = this.assignClusters(points, centroids);

            // 3. 更新质心为每个簇的平均值
            const newCentroids = this.calculateCentroids(clusters, points);

            // 4. 检查是否收敛
            if (this.haveConverged(centroids, newCentroids)) {
                log('INFO', `K-means converged after ${iteration + 1} iterations`);
                break;
            }

            centroids = newCentroids;
            previousClusters = clusters;
        }

        return clusters;
    }

    visualizeData() {
        const points = Object.values(this.mappedData);
        const visualizationData = points.map(point => ({
            x: point[0],
            y: point[1],
            z: point[2], // 假设映射到三维空间
        }));

        return visualizationData;
    }
}
class DimensionsTree {
    constructor(dimensions) {
        this.root = new Map(); // 树的根节点
        this.dimensions = dimensions; // 索引的维度
    }

    // 插入数据点
    insert(keys, value, node = this.root, depth = 0) {
        if (depth === this.dimensions.length) {
            // 到达叶子节点，存储数据
            if (!node.has('_data')) node.set('_data', []); // 初始化数据存储
            node.get('_data').push(value); // 存储数据
            return;
        }

        const key = keys[depth]; // 当前维度的值
        if (!node.has(key)) node.set(key, new Map()); // 如果当前维度值不存在，创建新节点
        this.insert(keys, value, node.get(key), depth + 1); // 递归插入下一维度
    }

    // 查询数据点
    query(range, node = this.root, depth = 0, results = []) {
        if (depth === this.dimensions.length) {
            // 到达叶子节点，返回数据
            if (node.has('_data')) results.push(...node.get('_data'));
            return results;
        }

        const [min, max] = range[depth]; // 当前维度的查询范围
        for (const [key, childNode] of node.entries()) {
            if (key === '_data') continue; // 跳过数据节点
            if (key >= min && key <= max) {
                // 如果当前维度值在查询范围内，递归查询下一维度
                this.query(range, childNode, depth + 1, results);
            }
        }
        return results;
    }
}
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

// K-means 聚类计算逻辑（Worker 线程）
function computeClusters(dataPoints, k, maxIterations) {
    function euclideanDistance(a, b) {
        return Math.sqrt(a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0));
    }

    function initializeCentroids(dataPoints, k) {
        const indices = Array.from({ length: dataPoints.length }, (_, i) => i);
        const randomIndices = indices.sort(() => Math.random() - 0.5).slice(0, k);
        return randomIndices.map(index => dataPoints[index]);
    }

    function assignClusters(dataPoints, centroids) {
        const clusters = Array.from({ length: k }, () => []);
        dataPoints.forEach((point, index) => {
            const distances = centroids.map(centroid => euclideanDistance(point, centroid));
            const closestCentroidIndex = distances.indexOf(Math.min(...distances));
            clusters[closestCentroidIndex].push(index);
        });
        return clusters;
    }

    function calculateCentroids(clusters, dataPoints) {
        return clusters.map(cluster => {
            if (cluster.length === 0) return dataPoints[Math.floor(Math.random() * dataPoints.length)];
            const sum = cluster.reduce((acc, index) => {
                return acc.map((val, i) => val + dataPoints[index][i]);
            }, Array(dataPoints[0].length).fill(0));
            return sum.map(val => val / cluster.length);
        });
    }

    function haveConverged(oldCentroids, newCentroids) {
        return oldCentroids.every((oldCentroid, index) => {
            return euclideanDistance(oldCentroid, newCentroids[index]) < 1e-5;
        });
    }

    let centroids = initializeCentroids(dataPoints, k);
    let clusters = [];

    for (let iteration = 0; iteration < maxIterations; iteration++) {
        clusters = assignClusters(dataPoints, centroids);
        const newCentroids = calculateCentroids(clusters, dataPoints);

        if (haveConverged(centroids, newCentroids)) {
            break;
        }

        centroids = newCentroids;
    }

    return { centroids, clusters };
}
// executeScriptFile 函数
async function executeScriptFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const lines = data.split('\n');

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) { // 忽略空行和注释行
                executePrompt(trimmedLine);
            }
        }
        console.log(`Script file '${filePath}' executed successfully`);
        log('INFO', `Script file '${filePath}' executed successfully`);
    } catch (error) {
        handleError(error, 'executing script file');
    }
}
// 主线程调用 K-means 聚类
async function kMeansClustering(tableName, dimensions, k, maxIterations = 100) {
    try {
        if (!this.currentDatabase) {
            console.log("No database selected");
            return;
        }
        if (!this.data.has(this.currentDatabase) || !this.data.get(this.currentDatabase).has(tableName)) {
            console.log("Table does not exist");
            return;
        }

        const dataPoints = Array.from(this.data.get(this.currentDatabase).get(tableName).values()).map(data => {
            return dimensions.map(dim => parseFloat(data[dim]));
        });

        if (dataPoints.length === 0) {
            console.log("No data points to cluster");
            return;
        }

        // 使用 Worker 线程进行并行计算
        const worker = new Worker(__filename, {
            workerData: { dataPoints, k, maxIterations },
        });

        const { centroids, clusters } = await new Promise((resolve, reject) => {
            worker.on('message', resolve);
            worker.on('error', reject);
            worker.on('exit', (code) => {
                if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
            });
        });

        // 更新数据
        clusters.forEach((cluster, clusterIndex) => {
            cluster.forEach(index => {
                const data = Array.from(this.data.get(this.currentDatabase).get(tableName).values())[index];
                data.label = clusterIndex; // 添加聚类标签
            });
        });

        this.saveData();
        console.log("K-means clustering completed");
        log('INFO', 'K-means clustering completed successfully');
    } catch (error) {
        handleError(error, 'k-means clustering');
    }
}
function parseConditions(conditionStr) {
    const conditions = conditionStr.split(' and ').map(cond => cond.trim());
    const query = {};

    for (let condition of conditions) {
        const parts = condition.match(/(\w+)\s*(=|>|<|>=|<=|<>|=~)\s*(.*)/);
        if (!parts || parts.length !== 4) {
            throw new Error(`Invalid condition format: ${condition}. Expected format is key operator value.`);
        }

        const [_, key, operator, value] = parts;
        if (!key || !value) {
            throw new Error(`Invalid condition format: ${condition}. Expected format is key operator value.`);
        }

        // 处理数值类型
        const parsedValue = isNaN(value) ? value : parseFloat(value);

        // 处理不同运算符
        if (['>', '<', '>=', '<=', '<>', '=~'].includes(operator)) {
            query[key.trim()] = { [operator]: parsedValue };
        } else {
            query[key.trim()] = parsedValue;
        }
    }

    return query;
}

// Worker 线程入口
if (!isMainThread) {
    const { dataPoints, k, maxIterations } = workerData;
    const result = computeClusters(dataPoints, k, maxIterations);
    parentPort.postMessage(result);
}
function factorial(n) {
    if (n === 0 || n === 1) return 1;
    return n * factorial(n - 1);
}
function generateDataPoints(distributionType, params) {
    const dataPoints = [];
    const numPoints = params.numPoints || 100; // 默认生成100个点

    switch (distributionType.toLowerCase()) {
        case 'uniform':
            for (let i = 0; i < numPoints; i++) {
                const point = Object.keys(params).map(key => {
                    if (key === 'numPoints') return null; // 跳过numPoints参数
                    return Math.random() * (params[key].max - params[key].min) + params[key].min;
                }).filter(val => val !== null); // 过滤掉null值
                dataPoints.push(point);
            }
            break;

        case 'normal':
            for (let i = 0; i < numPoints; i++) {
                const point = Object.keys(params).map(key => {
                    if (key === 'numPoints') return null;
                    const mean = params[key].mean || 0;
                    const stdDev = params[key].stdDev || 1;
                    return normalRandom(mean, stdDev);
                }).filter(val => val !== null);
                dataPoints.push(point);
            }
            break;

        case 'sphere':
            for (let i = 0; i < numPoints; i++) {
                const radius = params.radius || 1;
                const theta = Math.random() * 2 * Math.PI;
                const phi = Math.acos(2 * Math.random() - 1);
                const x = radius * Math.sin(phi) * Math.cos(theta);
                const y = radius * Math.sin(phi) * Math.sin(theta);
                const z = radius * Math.cos(phi);
                dataPoints.push([x, y, z]);
            }
            break;

        default:
            console.log(`Unsupported distribution type: ${distributionType}`);
            return [];
    }

    return dataPoints;
}

// 正态分布随机数生成器
function normalRandom(mean = 0, stdDev = 1) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random(); // 避免log(0)
    while (v === 0) v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdDev + mean;
}
const db = new HypercubeDB();

function displayPrompt() {
    process.stdout.write('>');
}
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
    const regEnableCompression = /^\s*enable\s+compression\s+for\s+([a-zA-Z0-9_]+)\s*$/i;
    const regDisableCompression = /^\s*disable\s+compression\s+for\s+([a-zA-Z0-9_]+)\s*$/i;

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
    displayPrompt();
}
function generateWebView(points) {
    const data = JSON.stringify(points);
    fs.writeFileSync('points.json', data);
    console.log('Visualization data saved: points.json');
}
// 开始命令行交互
rl.on('line', (answer) => {
    executePrompt(answer);


});

// 修改 rl.on('close', ...) 事件监听器
rl.on('close', () => {
    if (!this.isDroppingDatabase) { // 如果不是正在删除数据库，则保存数据
        db.saveData();
    }
    console.log('thank you for using Devilfish DBMS system, see you next time!');
    process.exit(0);
});

module.exports = { HypercubeDB };