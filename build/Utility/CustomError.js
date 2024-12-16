"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
class CustomError extends graphql_1.GraphQLError {
    constructor(message, statusCode) {
        super(message, {
            extensions: {
                code: "CUSTOM_ERROR",
                statusCode,
            },
        });
    }
}
exports.default = CustomError;
