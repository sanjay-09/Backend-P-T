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
exports.extraResolvers = exports.mutationResolvers = exports.resolvers = void 0;
const prisma_1 = require("../client/prisma");
const user_1 = __importDefault(require("../Services/user"));
const CustomError_1 = __importDefault(require("../Utility/CustomError"));
const redis_1 = require("../client/redis");
const UserServiceObj = new user_1.default();
exports.resolvers = {
    getJwtToken: (parent_1, _a) => __awaiter(void 0, [parent_1, _a], void 0, function* (parent, { token }) {
        try {
            if (!token) {
                throw new CustomError_1.default("Token not available1", 400); // Bad Request
            }
            const googleToken = token;
            const jwtToken = yield UserServiceObj.getJWTToken(googleToken);
            return jwtToken;
        }
        catch (err) {
            if (err instanceof CustomError_1.default) {
                throw err; // Propagate custom error
            }
            throw new CustomError_1.default("Internal Server Error", 500);
        }
    }),
    getUserById: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { id }, ctx) {
        try {
            if (!ctx.user) {
                throw new CustomError_1.default("User not authenticated", 401);
            }
            const user = yield UserServiceObj.getUserById(id);
            console.log("user", user);
            return user;
        }
        catch (err) {
            if (err instanceof CustomError_1.default) {
                throw err;
            }
            throw new CustomError_1.default("Internal Server Error", 500);
        }
    }),
    getCurrentUser: (parent, args, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!ctx.user) {
                throw new CustomError_1.default("user not authenticated", 401);
            }
            return yield UserServiceObj.getUserById(ctx.user.id);
        }
        catch (err) {
            if (err instanceof CustomError_1.default) {
                throw err;
            }
            console.log("error---->", err);
            throw new CustomError_1.default("Internal Server Error", 500);
        }
    })
};
exports.mutationResolvers = {
    followUser: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { to }, ctx) {
        try {
            if (!ctx.user) {
                throw new CustomError_1.default("User unauthenticated", 401);
            }
            const data = yield UserServiceObj.followUser(ctx.user.id, to);
            if (!data) {
                return false;
            }
            yield redis_1.redisClient.del(`RECOMMEND_USER_${ctx.user.id}`);
            yield redis_1.redisClient.del(`FOLLOWERS_DATA_${ctx.user.id}`);
            yield redis_1.redisClient.del(`FOLLOWING_DATA_${ctx.user.id}`);
            console.log("keyDeleted");
            return true;
        }
        catch (err) {
            if (err instanceof CustomError_1.default) {
                throw err;
            }
            throw new CustomError_1.default("INTERNAL_SEVER_ERROR", 404);
        }
    }),
    unfollowUser: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { to }, ctx) {
        try {
            if (!ctx.user) {
                throw new CustomError_1.default("user not authenticated", 401);
            }
            const data = yield UserServiceObj.unfollowUser(ctx.user.id, to);
            if (!data) {
                return false;
            }
            yield redis_1.redisClient.del(`RECOMMEND_USER_${ctx.user.id}`);
            yield redis_1.redisClient.del(`FOLLOWERS_DATA_${ctx.user.id}`);
            yield redis_1.redisClient.del(`FOLLOWING_DATA_${ctx.user.id}`);
            return true;
        }
        catch (err) {
        }
    })
};
exports.extraResolvers = {
    User: {
        tweets: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.tweet.findMany({
                where: {
                    authorId: parent.id
                }
            });
        }),
        follower: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            const cacheValue = yield redis_1.redisClient.get(`FOLLOWERS_DATA_${parent.id}`);
            if (cacheValue) {
                return JSON.parse(cacheValue);
            }
            const data = yield prisma_1.prisma.follows.findMany({
                where: {
                    following: {
                        id: parent.id
                    },
                },
                include: {
                    follower: true
                }
            });
            const result = data.map((el) => {
                return el.follower;
            });
            yield redis_1.redisClient.set(`FOLLOWERS_DATA_${parent.id}`, JSON.stringify(result));
            return result;
        }),
        following: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            const cacheValue = yield redis_1.redisClient.get(`FOLLOWING_DATA_${parent.id}`);
            if (cacheValue) {
                return JSON.parse(cacheValue);
            }
            const data = yield prisma_1.prisma.follows.findMany({
                where: {
                    followerId: parent.id
                },
                include: {
                    following: true
                }
            });
            const result = data.map((el) => {
                return el.following;
            });
            yield redis_1.redisClient.set(`FOLLOWING_DATA_${parent.id}`, JSON.stringify(result));
            return result;
        }),
        recommmendedUsers: (parent, _, ctx) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                if (!ctx.user) {
                    throw new CustomError_1.default("User not authenticated", 401);
                }
                const data = yield redis_1.redisClient.get(`RECOMMEND_USER_${ctx.user.id}`);
                if (data) {
                    console.log("cachedValue");
                    return JSON.parse(data);
                }
                const followings = yield prisma_1.prisma.follows.findMany({
                    where: {
                        follower: {
                            id: ctx.user.id
                        }
                    },
                    include: {
                        following: {
                            include: {
                                follower: {
                                    include: {
                                        following: true
                                    }
                                }
                            }
                        }
                    }
                });
                const result = [];
                for (let i = 0; i <= followings.length - 1; i++) {
                    for (let j = 0; j <= followings[i].following.follower.length - 1; j++) {
                        if (followings[i].following.follower[j].following.id === ctx.user.id || followings.findIndex((foll) => {
                            return foll.followingId === followings[i].following.follower[j].following.id;
                        }) >= 0) {
                            continue;
                        }
                        else {
                            result.push(followings[i].following.follower[j].following);
                        }
                    }
                }
                yield redis_1.redisClient.set(`RECOMMEND_USER_${ctx.user.id}`, JSON.stringify(result));
                return result;
            }
            catch (err) {
                if (err instanceof CustomError_1.default) {
                    throw err;
                }
                throw new CustomError_1.default("INTERNAL_SERVER_ERROR", 501);
            }
        })
    }
};
