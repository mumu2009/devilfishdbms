// main-ai-direction.js
//这是devilfishv0.2的拓展模块，支持线性回归，朴素贝叶斯，线性拟合，正则化，噪声，AI数据结构中间层
const fs = require('fs');
const path = require('path');
const math = require('mathjs');

// 线性回归模型
class LinearRegression {
    constructor() {
        this.coefficients = [];
        this.intercept = 0;
    }

    fit(X, y) {
        const n = X.length;
        const m = X[0].length;

        // 添加偏置项
        const X_b = X.map(row => [1, ...row]);

        // 计算系数
        const X_b_T = X_b[0].map((_, colIndex) => X_b.map(row => row[colIndex]));
        const X_b_T_X_b = X_b_T.map((row, rowIndex) => row.map((_, colIndex) => X_b_T[rowIndex].reduce((sum, val, i) => sum + val * X_b[i][colIndex], 0)));
        const X_b_T_y = X_b_T.map((row, rowIndex) => row.reduce((sum, val, i) => sum + val * y[i], 0));

        const coefficients = X_b_T_X_b.map((row, rowIndex) => {
            const numerator = X_b_T_y[rowIndex];
            const denominator = row[rowIndex];
            return numerator / denominator;
        });

        this.intercept = coefficients[0];
        this.coefficients = coefficients.slice(1);
    }

    predict(X) {
        return X.map(row => {
            const bias = this.intercept;
            const weightedSum = row.reduce((sum, val, i) => sum + val * this.coefficients[i], 0);
            return bias + weightedSum;
        });
    }
}

// 朴素贝叶斯模型
class NaiveBayes {
    constructor() {
        this.classCounts = {};
        this.featureCounts = {};
        this.totalCount = 0;
    }

    fit(X, y) {
        for (let i = 0; i < X.length; i++) {
            const label = y[i];
            const features = X[i];

            if (!this.classCounts[label]) {
                this.classCounts[label] = 0;
                this.featureCounts[label] = {};
            }

            this.classCounts[label]++;
            this.totalCount++;

            for (let j = 0; j < features.length; j++) {
                const feature = features[j];

                if (!this.featureCounts[label][j]) {
                    this.featureCounts[label][j] = {};
                }

                if (!this.featureCounts[label][j][feature]) {
                    this.featureCounts[label][j][feature] = 0;
                }

                this.featureCounts[label][j][feature]++;
            }
        }
    }

    predict(X) {
        const predictions = [];

        for (let i = 0; i < X.length; i++) {
            const features = X[i];
            let bestLabel = null;
            let bestProb = -Infinity;

            for (const label in this.classCounts) {
                const classProb = Math.log(this.classCounts[label] / this.totalCount);
                let featureProb = 0;

                for (let j = 0; j < features.length; j++) {
                    const feature = features[j];
                    const featureCount = this.featureCounts[label][j][feature] || 0;
                    const totalCount = this.classCounts[label];

                    featureProb += Math.log((featureCount + 1) / (totalCount + Object.keys(this.featureCounts[label][j]).length));
                }

                const prob = classProb + featureProb;

                if (prob > bestProb) {
                    bestProb = prob;
                    bestLabel = label;
                }
            }

            predictions.push(bestLabel);
        }

        return predictions;
    }
}

// 多项式拟合函数
function polynomialFit(X, y, degree) {
    const n = X.length;
    const m = degree + 1;

    // 构建设计矩阵
    const A = X.map(x => {
        return Array.from({ length: m }, (_, i) => Math.pow(x, i));
    });

    // 计算 A^T * A
    const A_T = A[0].map((_, colIndex) => A.map(row => row[colIndex]));
    const A_T_A = A_T.map((row, rowIndex) => row.map((_, colIndex) => A_T[rowIndex].reduce((sum, val, i) => sum + val * A[i][colIndex], 0)));

    // 计算 A^T * y
    const A_T_y = A_T.map((row, rowIndex) => row.reduce((sum, val, i) => sum + val * y[i], 0));

    // 计算系数
    const coefficients = A_T_A.map((row, rowIndex) => {
        const numerator = A_T_y[rowIndex];
        const denominator = row[rowIndex];
        return numerator / denominator;
    });

    return coefficients;
}

// 格式化多项式函数
function formatPolynomial(coefficients) {
    const terms = coefficients.map((coeff, i) => {
        if (i === 0) {
            return `${coeff}`;
        } else if (i === 1) {
            return `${coeff}x`;
        } else {
            return `${coeff}x^${i}`;
        }
    });

    return terms.reverse().join(' + ');
}

// 生成正态分布点
function generateNormalDistributionPoints(mean, stdDev, count) {
    return Array.from({ length: count }, () => ({
        x: math.randomNormal(mean, stdDev),
        y: math.randomNormal(mean, stdDev)
    }));
}

// 生成泊松分布点
function generatePoissonDistributionPoints(lambda, count) {
    return Array.from({ length: count }, () => ({
        x: math.randomPoisson(lambda),
        y: math.randomPoisson(lambda)
    }));
}

// 生成高斯分布点
function generateGaussianDistributionPoints(mean, stdDev, count) {
    return Array.from({ length: count }, () => ({
        x: math.randomNormal(mean, stdDev),
        y: math.randomNormal(mean, stdDev)
    }));
}

// 生成高斯噪声
function generateGaussianNoise(mean, stdDev, count) {
    return Array.from({ length: count }, () => math.randomNormal(mean, stdDev));
}

// 生成泊松噪声
function generatePoissonNoise(lambda, count) {
    return Array.from({ length: count }, () => math.randomPoisson(lambda));
}
// Extend the Tensor class with more operations

class Tensor {
    constructor(data) {
        this.data = data;
    }

    // Add methods for tensor operations like addition, subtraction, multiplication, etc.
    add(tensor) {
        if (this.data.length !== tensor.data.length || this.data[0].length !== tensor.data[0].length) {
            throw new Error("Tensor dimensions must match for addition");
        }

        const result = this.data.map((row, rowIndex) => row.map((value, colIndex) => value + tensor.data[rowIndex][colIndex]));
        return new Tensor(result);
    }

    subtract(tensor) {
        if (this.data.length !== tensor.data.length || this.data[0].length !== tensor.data[0].length) {
            throw new Error("Tensor dimensions must match for subtraction");
        }

        const result = this.data.map((row, rowIndex) => row.map((value, colIndex) => value - tensor.data[rowIndex][colIndex]));
        return new Tensor(result);
    }

    multiply(tensor) {
        if (this.data.length !== tensor.data.length || this.data[0].length !== tensor.data[0].length) {
            throw new Error("Tensor dimensions must match for multiplication");
        }

        const result = this.data.map((row, rowIndex) => row.map((value, colIndex) => value * tensor.data[rowIndex][colIndex]));
        return new Tensor(result);
    }

    dotProduct(tensor) {
        if (this.data[0].length !== tensor.data.length) {
            throw new Error("Number of columns in the first tensor must match the number of rows in the second tensor for dot product");
        }

        const result = this.data.map((row, rowIndex) => row.reduce((sum, value, colIndex) => sum + value * tensor.data[colIndex][rowIndex], 0));
        return new Tensor([result]);
    }

    transpose() {
        const result = this.data[0].map((_, colIndex) => this.data.map(row => row[colIndex]));
        return new Tensor(result);
    }

    // Add other tensor operations as needed    // Add other tensor operations as needed

    // Tensor operations: element-wise multiplication
    elementWiseMultiply(tensor) {
        if (this.data.length !== tensor.data.length || this.data[0].length !== tensor.data[0].length) {
            throw new Error("Tensor dimensions must match for element-wise multiplication");
        }

        const result = this.data.map((row, rowIndex) => row.map((value, colIndex) => value * tensor.data[rowIndex][colIndex]));
        return new Tensor(result);
    }

    // Tensor operations: element-wise division
    elementWiseDivide(tensor) {
        if (this.data.length !== tensor.data.length || this.data[0].length !== tensor.data[0].length) {
            throw new Error("Tensor dimensions must match for element-wise division");
        }

        const result = this.data.map((row, rowIndex) => row.map((value, colIndex) => value / tensor.data[rowIndex][colIndex]));
        return new Tensor(result);
    }

    // Tensor operations: element-wise exponentiation
    elementWiseExponentiate(exponent) {
        const result = this.data.map(row => row.map(value => Math.pow(value, exponent)));
        return new Tensor(result);
    }

    // Tensor operations: matrix multiplication
    matrixMultiply(tensor) {
        if (this.data[0].length !== tensor.data.length) {
            throw new Error("Number of columns in the first tensor must match the number of rows in the second tensor for matrix multiplication");
        }

        const result = this.data.map((row, rowIndex) => tensor.data[0].map((_, colIndex) => row.reduce((sum, value, i) => sum + value * tensor.data[i][colIndex], 0)));
        return new Tensor(result);
    }

    // Tensor operations: tensor contraction
    contract(indices) {
        const dimensions = this.data.map(row => row.length);
        const newDimensions = dimensions.filter((_, index) => !indices.includes(index));

        const result = this.data.map(row => {
            const newRow = [];
            for (let i = 0; i < newDimensions[0]; i++) {
                let index = 0;
                let value = row[0];
                for (let j = 0; j < dimensions.length; j++) {
                    if (!indices.includes(j)) {
                        value *= row[index];
                        index++;
                    }
                }
                newRow.push(value);
            }
            return newRow;
        });

        return new Tensor(result);
    }

    // Tensor operations: tensor reshaping
    reshape(newShape) {
        const numElements = this.data.length * this.data[0].length;
        const totalNewElements = newShape.reduce((acc, val) => acc * val, 1);

        if (numElements !== totalNewElements) {
            throw new Error("Total number of elements must remain the same during reshaping");
        }

        const result = [];
        let index = 0;
        for (let i = 0; i < newShape[0]; i++) {
            const row = [];
            for (let j = 0; j < newShape[1]; j++) {
                row.push(this.data[Math.floor(index / this.data[0].length)][index % this.data[0].length]);
                index++;
            }
            result.push(row);
        }

        return new Tensor(result);
    }

    // Add other tensor operations as needed
}
// 扩展对象
const extension = {
    name: 'main-ai',
    execute(db, command, ...args) {
        const regCreateLinearRegression = /^\s*create\s+linear\s+regression\s+model\s+on\s+([a-zA-Z0-9_]+)\s+with\s+features\s+([a-zA-Z0-9_,]+)\s+and\s+target\s+([a-zA-Z0-9_]+)\s*$/;
        const regPredictLinearRegression = /^\s*predict\s+linear\s+regression\s+on\s+([a-zA-Z0-9_]+)\s+with\s+data\s*\{([^}]+)\}\s*$/;
        const regCreateNaiveBayes = /^\s*create\s+naive\s+bayes\s+model\s+on\s+([a-zA-Z0-9_]+)\s+with\s+features\s+([a-zA-Z0-9_,]+)\s+and\s+target\s+([a-zA-Z0-9_]+)\s*$/;
        const regPredictNaiveBayes = /^\s*predict\s+naive\s+bayes\s+on\s+([a-zA-Z0-9_]+)\s+with\s+data\s*\{([^}]+)\}\s*$/;
        const regFitPolynomial = /^\s*fit\s+polynomial\s+on\s+([a-zA-Z0-9_]+)\s+with\s+degree\s+(\d+)\s*$/;
        const regGeneratePoints = /^\s*generate\s+points\s+on\s+([a-zA-Z0-9_]+)\s+with\s+distribution\s+([a-zA-Z0-9_]+)\s+and\s+parameters\s*\{([^}]+)\}\s*$/;
        const regAddNoise = /^\s*add\s+noise\s+to\s+([a-zA-Z0-9_]+)\s+with\s+type\s+([a-zA-Z0-9_]+)\s+and\s+parameters\s*\{([^}]+)\}\s*$/;
        const regTensorOperation = /^\s*tensor\s+(\w+)\s+on\s+([a-zA-Z0-9_]+)\s+with\s+(\w+)\s*\(([^)]+)\)\s*$/;

        if (regCreateLinearRegression.test(command)) {
            const match = regCreateLinearRegression.exec(command);
            const tableName = match[1];
            const featuresStr = match[2];
            const target = match[3];
            const features = featuresStr.split(',');

            const tableData = db.data.get(db.currentDatabase).get(tableName);
            const X = tableData.map(data => features.map(feature => parseFloat(data[feature])));
            const y = tableData.map(data => parseFloat(data[target]));

            const model = new LinearRegression();
            model.fit(X, y);

            if (!db.models) {
                db.models = new Map();
            }
            db.models.set(`${tableName}_linear_regression`, model);

            console.log("Linear regression model created");
            log('INFO', 'Linear regression model created successfully');
        } else if (regPredictLinearRegression.test(command)) {
            const match = regPredictLinearRegression.exec(command);
            const tableName = match[1];
            const dataStr = match[2];

            // 将键名转换为字符串形式
            const formattedDataStr = dataStr.replace(/(\w+):/g, '"$1":');

            try {
                const data = JSON.parse(`{${formattedDataStr}}`);
                const model = db.models.get(`${tableName}_linear_regression`);
                const X = [features.map(feature => parseFloat(data[feature]))];

                const predictions = model.predict(X);
                console.log("Predictions:", predictions);
                return predictions;
            } catch (error) {
                console.log("Invalid JSON format:", error.message);
            }
        } else if (regCreateNaiveBayes.test(command)) {
            const match = regCreateNaiveBayes.exec(command);
            const tableName = match[1];
            const featuresStr = match[2];
            const target = match[3];
            const features = featuresStr.split(',');

            const tableData = db.data.get(db.currentDatabase).get(tableName);
            const X = tableData.map(data => features.map(feature => data[feature]));
            const y = tableData.map(data => data[target]);

            const model = new NaiveBayes();
            model.fit(X, y);

            if (!db.models) {
                db.models = new Map();
            }
            db.models.set(`${tableName}_naive_bayes`, model);

            console.log("Naive Bayes model created");
            log('INFO', 'Naive Bayes model created successfully');
        } else if (regPredictNaiveBayes.test(command)) {
            const match = regPredictNaiveBayes.exec(command);
            const tableName = match[1];
            const dataStr = match[2];

            // 将键名转换为字符串形式
            const formattedDataStr = dataStr.replace(/(\w+):/g, '"$1":');

            try {
                const data = JSON.parse(`{${formattedDataStr}}`);
                const model = db.models.get(`${tableName}_naive_bayes`);
                const X = [features.map(feature => data[feature])];

                const predictions = model.predict(X);
                console.log("Predictions:", predictions);
                return predictions;
            } catch (error) {
                console.log("Invalid JSON format:", error.message);
            }
        } else if (regFitPolynomial.test(command)) {
            const match = regFitPolynomial.exec(command);
            const tableName = match[1];
            const degree = parseInt(match[2]);

            const tableData = db.data.get(db.currentDatabase).get(tableName);
            const X = tableData.map(data => parseFloat(data['x'])); // 假设 x 是特征列名
            const y = tableData.map(data => parseFloat(data['y'])); // 假设 y 是目标列名

            const coefficients = polynomialFit(X, y, degree);
            const polynomial = formatPolynomial(coefficients);

            console.log("Fitted polynomial:", polynomial);
            log('INFO', `Polynomial fitted successfully: ${polynomial}`);
        } else if (regGeneratePoints.test(command)) {
            const match = regGeneratePoints.exec(command);
            const tableName = match[1];
            const distributionType = match[2];
            const parametersStr = match[3];

            // 将参数字符串转换为对象
            const formattedParametersStr = parametersStr.replace(/(\w+):/g, '"$1":');
            let parameters;
            try {
                parameters = JSON.parse(`{${formattedParametersStr}}`);
            } catch (error) {
                console.log("Invalid JSON format for parameters:", error.message);
                return;
            }

            let points;
            switch (distributionType.toLowerCase()) {
                case 'normal':
                case 'gaussian':
                    points = generateNormalDistributionPoints(parameters.mean, parameters.stdDev, parameters.count);
                    break;
                case 'poisson':
                    points = generatePoissonDistributionPoints(parameters.lambda, parameters.count);
                    break;
                default:
                    console.log("Unsupported distribution type:", distributionType);
                    return;
            }

            // 插入生成的点到数据库
            points.forEach(point => {
                db.insertData(tableName, point);
            });

            console.log(`Generated ${points.length} points and inserted into ${tableName}`);
            log('INFO', `Generated ${points.length} points and inserted into ${tableName}`);
        } else if (regAddNoise.test(command)) {
            const match = regAddNoise.exec(command);
            const tableName = match[1];
            const noiseType = match[2];
            const parametersStr = match[3];

            // 将参数字符串转换为对象
            const formattedParametersStr = parametersStr.replace(/(\w+):/g, '"$1":');
            let parameters;
            try {
                parameters = JSON.parse(`{${formattedParametersStr}}`);
            } catch (error) {
                console.log("Invalid JSON format for parameters:", error.message);
                return;
            }

            const tableData = db.data.get(db.currentDatabase).get(tableName);
            const X = tableData.map(data => parseFloat(data['x'])); // 假设 x 是特征列名
            const y = tableData.map(data => parseFloat(data['y'])); // 假设 y 是目标列名

            let noise;
            switch (noiseType.toLowerCase()) {
                case 'gaussian':
                    noise = generateGaussianNoise(parameters.mean, parameters.stdDev, X.length);
                    break;
                case 'poisson':
                    noise = generatePoissonNoise(parameters.lambda, X.length);
                    break;
                default:
                    console.log("Unsupported noise type:", noiseType);
                    return;
            }

            // 添加噪声到 y 值
            const noisyY = y.map((yi, index) => yi + noise[index]);

            // 更新数据库中的 y 值
            tableData.forEach((data, index) => {
                data['y'] = noisyY[index];
                db.insertData(tableName, data);
            });

            console.log(`Added ${noiseType} noise to ${tableName}`);
            log('INFO', `Added ${noiseType} noise to ${tableName}`);
        } else if (regCreateTensor.test(command)) {
            const match = regCreateTensor.exec(command);
            const tableName = match[1];
            const dataStr = match[2];

            // Parse the data string into a multi-dimensional array
            const formattedDataStr = dataStr.replace(/(\w+):/g, '"$1":');
            let data;
            try {
                data = JSON.parse(`{${formattedDataStr}}`);
            } catch (error) {
                console.log("Invalid JSON format for tensor data:", error.message);
                return;
            }

            const tensor = new Tensor(data);

            // Store the tensor in the database
            if (!db.tensors) {
                db.tensors = new Map();
            }
            db.tensors.set(tableName, tensor);

            console.log(`Tensor created: ${tableName}`);
            log('INFO', `Tensor created successfully: ${tableName}`);
        } else if (regPerformTensorOperation.test(command)) {
            const match = regPerformTensorOperation.exec(command);
            const tableName = match[1];
            const operation = match[2];
            const operandTableName = match[3];

            const tensor = db.tensors.get(tableName);
            const operandTensor = db.tensors.get(operandTableName);

            let result;
            switch (operation.toLowerCase()) {
                case 'add':
                    result = tensor.add(operandTensor);
                    break;
                // Add other tensor operations as needed
                default:
                    console.log("Unsupported tensor operation:", operation);
                    return;
            }

            // Store the result tensor in the database
            const resultTableName = `${tableName}_${operation}_${operandTableName}`;
            db.tensors.set(resultTableName, result);

            console.log(`Tensor operation performed: ${resultTableName}`);
            log('INFO', `Tensor operation performed successfully: ${resultTableName}`);
        } else if (regTensorOperation.test(command)) {
            const match = regTensorOperation.exec(command);
            const operation = match[1];
            const tableName = match[2];
            const tensorName = match[3];
            const parametersStr = match[4];

            // Convert parameters string to object
            const formattedParametersStr = parametersStr.replace(/(\w+):/g, '"$1":');
            let parameters;
            try {
                parameters = JSON.parse(`{${formattedParametersStr}}`);
            } catch (error) {
                console.log("Invalid JSON format for parameters:", error.message);
                return;
            }

            // Perform tensor operation
            const tensorData = db.data.get(db.currentDatabase).get(tableName).map(data => new Tensor(data[tensorName]));
            let result;
            switch (operation.toLowerCase()) {
                case 'add':
                    result = tensorData[0].add(tensorData[1]);
                    break;
                case 'subtract':
                    result = tensorData[0].subtract(tensorData[1]);
                    break;
                case 'multiply':
                    result = tensorData[0].multiply(tensorData[1]);
                    break;
                case 'dotproduct':
                    result = tensorData[0].dotProduct(tensorData[1]);
                    break;
                case 'transpose':
                    result = tensorData[0].transpose();
                    break;
                // Add other tensor operations as needed
                default:
                    console.log("Unsupported tensor operation:", operation);
                    return;
            }

            // Store the result in the database
            db.data.get(db.currentDatabase).set(`${tableName}_${tensorName}_${operation}`, result.data);

            console.log(`${operation} operation on tensor "${tensorName}" successful`);
            log('INFO', `${operation} operation on tensor "${tensorName}" successful`);
        }
        else {
            console.log("Invalid AI command, please use available AI commands or write 'exit' to escape");
        }
    }
};

module.exports = extension;