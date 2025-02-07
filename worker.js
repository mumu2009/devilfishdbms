self.onmessage = (event) => {
    const { dataPoints, numDimensions, func, sphereRadius } = event.data;
    const points = [];

    for (let i = 0; i < dataPoints.length; i += numDimensions) {
        const point = dataPoints.subarray(i, i + numDimensions);

        // 计算点到原点的距离
        let distance = 0;
        for (let j = 0; j < numDimensions; j++) {
            distance += point[j] * point[j];
        }
        distance = Math.sqrt(distance);

        // 检查点是否在球内
        if (distance <= sphereRadius) {
            // 检查点是否在高维对象内部
            if (func(...point)) {
                points.push(Array.from(point));
            }
        }
    }

    self.postMessage(points);
};