const HypercubeDB = require('./main').HypercubeDB;
const readline = require('readline');

jest.mock('readline', () => {
    return {
        createInterface: jest.fn().mockImplementation(() => {
            return {
                on: jest.fn(),
                close: jest.fn()
            };
        })
    };
});

describe('HypercubeDB with user input', () => {
    let db;
    const rl = readline.createInterface();

    beforeAll(() => {
        db = new HypercubeDB();
    });

    test('should handle user input to create a database', () => {
        const dbName = 'testDB';
        rl.on.mock.calls[0][1](`create database ${dbName}`);
        expect(db.data[dbName]).toBeDefined();
    });

    test('should handle user input to create a table', () => {
        const tableName = 'testTable';
        const schema = 'id,name';
        rl.on.mock.calls[0][1](`use ${dbName}`);
        rl.on.mock.calls[0][1](`create table ${tableName} (${schema})`);
        expect(db.data[dbName][tableName]).toBeDefined();
    });

    test('should handle user input to insert data', () => {
        const data = '{id: "1", name: "Alice"}';
        rl.on.mock.calls[0][1](`insert into testTable values ${data}`);
        expect(db.data[dbName][tableName]['id-name']).toEqual({ id: '1', name: 'Alice' });
    });

    test('should handle user input to select data', () => {
        const query = 'id=1';
        rl.on.mock.calls[0][1](`select * from testTable where ${query}`);
        expect(db.data[dbName][tableName]['id-name']).toEqual({ id: '1', name: 'Alice' });
    });

    test('should handle user input to update data', () => {
        const newData = '{name: "Bob"}';
        rl.on.mock.calls[0][1](`update testTable set ${newData} where id=1`);
        expect(db.data[dbName][tableName]['id-name']).toEqual({ id: '1', name: 'Bob' });
    });

    test('should handle user input to delete data', () => {
        rl.on.mock.calls[0][1](`delete from testTable where id=1`);
        expect(db.data[dbName][tableName]['id-name']).toBeUndefined();
    });

    test('should handle user input to drop a table', () => {
        rl.on.mock.calls[0][1](`drop table testTable`);
        expect(db.data[dbName][tableName]).toBeUndefined();
    });

    afterAll(() => {
        rl.close();
    });
});