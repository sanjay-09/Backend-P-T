"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.user = void 0;
const types_1 = require("./types");
const queries_1 = require("./queries");
const resolvers_1 = require("./resolvers");
const mutation_1 = require("./mutation");
exports.user = {
    types: types_1.types,
    queries: queries_1.queries,
    resolvers: resolvers_1.resolvers,
    extraResolvers: resolvers_1.extraResolvers,
    mutationResolvers: resolvers_1.mutationResolvers,
    mutation: mutation_1.mutation
};
