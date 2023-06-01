module.exports = {
    roots: ["<rootDir>/tests"],
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFiles: ['dotenv/config'],
    testMatch: [ '<rootDir>/tests/*tests/*.ts' ],
    moduleDirectories: ['node_modules', 'tests', 'src'],
    moduleNameMapper: {
        "^tests/(.*)$": "<rootDir>/tests/$1",
        // '^@src/(.*)$': '<rootDir>/src/$1',
    },
};
