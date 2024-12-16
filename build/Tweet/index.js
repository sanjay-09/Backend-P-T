"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tweet = void 0;
const types_1 = require("./types");
const mutation_1 = require("./mutation");
const resolvers_1 = require("./resolvers");
const queries_1 = require("./queries");
exports.tweet = {
    types: types_1.types,
    mutation: mutation_1.mutation,
    mutationResolvers: resolvers_1.mutationResolvers,
    resolvers: resolvers_1.resolvers,
    queries: queries_1.queries,
    extraResolvers: resolvers_1.extraResolvers
};
