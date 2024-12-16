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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../client/prisma");
const redis_1 = require("../client/redis");
const JWT_SECRET = "dajcnadvcnvdvcjnadcd";
class UserService {
    getJWTToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
            if (!data.ok) {
                return null;
            }
            const userData = yield data.json();
            const isUserPresent = yield prisma_1.prisma.user.findUnique({
                where: {
                    email: userData.email
                }
            });
            if (!isUserPresent) {
                yield prisma_1.prisma.user.create({
                    data: {
                        name: userData.name,
                        email: userData.email,
                        profileImage: userData.picture
                    }
                });
            }
            const user = yield prisma_1.prisma.user.findUnique({
                where: {
                    email: userData.email
                }
            });
            const jwtToken = this.generateToken(user);
            return jwtToken;
        });
    }
    generateToken(user) {
        const payload = {
            id: user.id,
            email: user.email
        };
        const token = jsonwebtoken_1.default.sign(payload, JWT_SECRET);
        return token;
    }
    verifyToken(token) {
        try {
            console.log("token");
            return jsonwebtoken_1.default.verify(token, JWT_SECRET);
        }
        catch (err) {
            return null;
        }
    }
    getUserById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cachedData = yield redis_1.redisClient.get(`USER_DATA_${id}`);
                if (cachedData) {
                    return JSON.parse(cachedData);
                }
                const data = yield prisma_1.prisma.user.findUnique({
                    where: {
                        id: id
                    }
                });
                console.log("value going to be cached", data);
                yield redis_1.redisClient.set(`USER_DATA_${id}`, JSON.stringify(data));
                return data;
            }
            catch (err) {
                console.log("err", err);
                throw err;
            }
        });
    }
    followUser(from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield prisma_1.prisma.follows.create({
                    data: {
                        follower: {
                            connect: {
                                id: from
                            }
                        },
                        following: {
                            connect: {
                                id: to
                            }
                        }
                    }
                });
                console.log("folloower", data);
                return data;
            }
            catch (err) {
                throw err;
            }
        });
    }
    unfollowUser(from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield prisma_1.prisma.follows.delete({
                    where: {
                        followerId_followingId: {
                            followerId: from,
                            followingId: to
                        }
                    }
                });
                return data;
            }
            catch (err) {
                throw err;
            }
        });
    }
}
exports.default = UserService;
