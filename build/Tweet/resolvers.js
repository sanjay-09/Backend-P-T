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
exports.extraResolvers = exports.resolvers = exports.mutationResolvers = void 0;
const prisma_1 = require("../client/prisma");
const CustomError_1 = __importDefault(require("../Utility/CustomError"));
const redis_1 = require("../client/redis");
exports.mutationResolvers = {
    createTweet: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { payload }, ctx) {
        try {
            if (!ctx.user) {
                throw new CustomError_1.default("User not authenticated", 401);
            }
            const rateLimitChecker = yield redis_1.redisClient.get(`RATE_LIMIT_TWEETS:${ctx.user.id}`);
            if (rateLimitChecker) {
                throw new CustomError_1.default('Cant create another tweet before 10 sec', 501);
            }
            console.log("user", ctx.user.email);
            const tweet = yield prisma_1.prisma.tweet.create({
                data: {
                    content: payload === null || payload === void 0 ? void 0 : payload.content,
                    imageUrl: (payload === null || payload === void 0 ? void 0 : payload.imageUrl) || "",
                    authorId: ctx.user.id
                }
            });
            yield redis_1.redisClient.setex(`RATE_LIMIT_TWEETS:${ctx.user.id}`, 10, 1);
            yield redis_1.redisClient.del('All_Tweets');
            return tweet;
        }
        catch (err) {
            console.log(err);
            if (err instanceof CustomError_1.default) {
                throw err; // Propagate custom error
            }
            throw new CustomError_1.default("Internal Server Error", 500);
        }
    })
};
exports.resolvers = {
    getAllTweet: (parent, args, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!ctx.user) {
                throw new CustomError_1.default("user not authenticated", 401);
            }
            const cachedAllTweets = yield redis_1.redisClient.get('All_Tweets');
            if (cachedAllTweets) {
                return JSON.parse(cachedAllTweets);
            }
            const allTweets = yield prisma_1.prisma.tweet.findMany();
            yield redis_1.redisClient.set('All_Tweets', JSON.stringify(allTweets));
            return allTweets;
        }
        catch (err) {
            if (err instanceof CustomError_1.default) {
                throw err; // Propagate custom error
            }
            throw new CustomError_1.default("Internal Server Error", 500);
        }
    })
};
exports.extraResolvers = {
    Tweet: {
        author: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.user.findUnique({
                where: {
                    id: parent.authorId
                }
            });
        })
    }
};
