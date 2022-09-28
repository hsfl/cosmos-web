module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFiles: ['dotenv/config'],
    testMatch: [ '<rootDir>/tests/*tests/*.ts' ],
};