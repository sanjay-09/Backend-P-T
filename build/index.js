"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const server_1 = require("@apollo/server");
const express4_1 = require("@apollo/server/express4");
const body_parser_1 = __importDefault(require("body-parser"));
const user_1 = require("./user");
const cors_1 = __importDefault(require("cors"));
const user_2 = __importDefault(require("./Services/user"));
const Tweet_1 = require("./Tweet");
const userServiceObj = new user_2.default();
const start = () => __awaiter(void 0, void 0, void 0, function* () {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)());
    app.use(body_parser_1.default.json());
    const server = new server_1.ApolloServer({
        typeDefs: `
        ${user_1.user.types}
        ${Tweet_1.tweet.types}
          type Query{
             ${user_1.user.queries}
             ${Tweet_1.tweet.queries}
             
          }
             type Mutation{
                ${Tweet_1.tweet.mutation}
                ${user_1.user.mutation}
             }
        `,
        resolvers: Object.assign(Object.assign({ Query: Object.assign(Object.assign({}, user_1.user.resolvers), Tweet_1.tweet.resolvers), Mutation: Object.assign(Object.assign({}, Tweet_1.tweet.mutationResolvers), user_1.user.mutationResolvers) }, Tweet_1.tweet.extraResolvers), user_1.user.extraResolvers),
        formatError: (err) => {
            var _a, _b;
            return {
                message: err.message,
                statusCode: ((_a = err.extensions) === null || _a === void 0 ? void 0 : _a.statusCode) || 500,
                code: ((_b = err.extensions) === null || _b === void 0 ? void 0 : _b.code) || "INTERNAL_SERVER_ERROR",
            };
        },
    });
    yield server.start();
    //@ts-ignore
    app.use("/graphql", (0, cors_1.default)(), (0, express4_1.expressMiddleware)(server, {
        context: (_a) => __awaiter(void 0, [_a], void 0, function* ({ req }) {
            return {
                user: req.headers.authorization ? userServiceObj.verifyToken(req.headers.authorization.split(" ")[1]) : null
            };
        }),
    }));
    app.listen(3001, () => {
        console.log("Server starting on the server 3001");
    });
});
start();
