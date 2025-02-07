const HypercubeDB = require('./main').HypercubeDB;
const fs = require('fs');
const path = require('path');

describe('HypercubeDB', () => {
    let db;
    const dbName = 'testDB';
    const tableName = 'testTable';
    const schema = ['id', 'name'];

    beforeAll(() => {
        db = new HypercubeDB();
    });

    afterAll(() => {
        // Clean up test files
        const dbFiles = fs.readdirSync(__dirname);
        dbFiles.forEach(file => {
            if (file.endsWith('.db')) {
                fs.unlinkSync(path.join(__dirname, file));
            }
        });
    });

    test('should create a database', () => {
        db.createDatabase(dbName);
        expect(db.data[dbName]).toBeDefined();
    });

    test('should create a table', () => {
        db.useDatabase(dbName);
        db.createTable(tableName, schema);
        expect(db.data[dbName][tableName]).toBeDefined();
    });

    test('should insert data into a table', () => {
        const data = { id: '1', name: 'Alice' };
        db.insertData(tableName, data);
        expect(db.data[dbName][tableName]['id-name']).toEqual(data);
    });

    test('should select data from a table', () => {
        const query = { id: '1' };
        db.selectData(tableName, query);
        expect(db.data[dbName][tableName]['id-name']).toEqual({ id: '1', name: 'Alice' });
    });

    test('should update data in a table', () => {
        const newData = { name: 'Bob' };
        db.updateData(tableName, 'id-name', newData);
        expect(db.data[dbName][tableName]['id-name']).toEqual({ id: '1', name: 'Bob' });
    });

    test('should delete data from a table', () => {
        db.deleteData(tableName, 'id-name');
        expect(db.data[dbName][tableName]['id-name']).toBeUndefined();
    });

    test('should drop a table', () => {
        db.dropTable(tableName);
        expect(db.data[dbName][tableName]).toBeUndefined();
    });
});