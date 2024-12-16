"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queries = void 0;
exports.queries = `#graphql
    getJwtToken(token:String!):String
    getUserById(id:String!):User
    getCurrentUser:User
`;
