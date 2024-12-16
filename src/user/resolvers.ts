import { User } from "@prisma/client";
import { prisma } from "../client/prisma";
import { GraphQLContext } from "../Context/context";
import UserService from "../Services/user";
import CustomError from "../Utility/CustomError";
import { threadId } from "worker_threads";
import { redisClient } from "../client/redis";

const UserServiceObj=new UserService();


export const resolvers={
    getJwtToken:async(parent:any,{token}:{token:string})=>{
        try{
            if(!token){
                throw new CustomError("Token not available1", 400); // Bad Request
            }
            const googleToken=token;
            const jwtToken=await UserServiceObj.getJWTToken(googleToken);
            return jwtToken;

        }
        catch(err:any){
            if (err instanceof CustomError) {
                throw err; // Propagate custom error
              }
              throw new CustomError("Internal Server Error", 500);

        }
   
       
    },
    getUserById:async(parent:any,{id}:{id:string},ctx:GraphQLContext)=>{

        try{
            if(!ctx.user){
                throw new CustomError("User not authenticated",401);

            }
            const user=await UserServiceObj.getUserById(id);
            console.log("user",user);
            return user;
            

        }
        catch(err){
            if(err instanceof CustomError){
                throw err;
            }
            throw new CustomError("Internal Server Error", 500);




        }

    },
    getCurrentUser:async(parent:any,args:any,ctx:GraphQLContext)=>{
        try{
            if(!ctx.user){

                 throw new CustomError("user not authenticated",401);
            }
            
            return await UserServiceObj.getUserById(ctx.user.id)

        }
        catch(err){
            if(err instanceof CustomError){
                throw err;

            }
            console.log("error---->",err);
            throw new CustomError("Internal Server Error", 500);


        }
    }
}
export const mutationResolvers={
    followUser:async(parent:any,{to}:{to:string},ctx:GraphQLContext)=>{
        try{
        
            if(!ctx.user){
                 throw new CustomError("User unauthenticated",401)
            }
            const data=await UserServiceObj.followUser(ctx.user.id,to);
            if(!data){
                return false;
            }
            await redisClient.del(`RECOMMEND_USER_${ctx.user.id}`);
            await redisClient.del(`FOLLOWERS_DATA_${ctx.user.id}`)
            await redisClient.del(`FOLLOWING_DATA_${ctx.user.id}`)
            console.log("keyDeleted");
            return true;

        }
        catch(err){
            if(err instanceof CustomError){
                throw err;
            }
            throw new CustomError("INTERNAL_SEVER_ERROR",404);

        }
    },
    unfollowUser:async(parent:any,{to}:{to:string},ctx:GraphQLContext)=>{
        try{
            if(!ctx.user){
                throw new CustomError("user not authenticated",401);
            }
            const data=await UserServiceObj.unfollowUser(ctx.user.id,to);
            if(!data){
                return false;
            }
            await redisClient.del(`RECOMMEND_USER_${ctx.user.id}`);
            await redisClient.del(`FOLLOWERS_DATA_${ctx.user.id}`)
            await redisClient.del(`FOLLOWING_DATA_${ctx.user.id}`)
            return true;

        }
        catch(err){

        }
    }

}

export const extraResolvers={
    User:{
        tweets:async(parent:User)=>{
            return await prisma.tweet.findMany({
                where:{
                    authorId:parent.id
                }

            })

        },
        follower:async(parent:User)=>{
            const cacheValue=await redisClient.get(`FOLLOWERS_DATA_${parent.id}`);
            if(cacheValue){
                return JSON.parse(cacheValue);
            }
           
            const data=await prisma.follows.findMany({
                where:{
                    following:{
                        id:parent.id
                    },
                   
                },
                include:{
                    follower:true
                }
            })
            const result=data.map((el)=>{
                 return el.follower

            })
            await redisClient.set(`FOLLOWERS_DATA_${parent.id}`,JSON.stringify(result));

            
            
            
            return result;
        },
        following:async(parent:User)=>{
            const cacheValue=await redisClient.get(`FOLLOWING_DATA_${parent.id}`);
            if(cacheValue){
                return JSON.parse(cacheValue);
            }
            const data= await prisma.follows.findMany({
                where:{
                    followerId:parent.id
                },
                include:{
                    following:true
                }
            })
            const result=data.map((el)=>
               {
                return el.following

               }
            
            )
            await redisClient.set(`FOLLOWING_DATA_${parent.id}`,JSON.stringify(result));
            return result;
            

        },
        recommmendedUsers:async(parent:any,_:any,ctx:GraphQLContext)=>{
            try{
                if(!ctx.user){
                    throw new CustomError("User not authenticated",401);
                }
                const data=await redisClient.get(`RECOMMEND_USER_${ctx.user.id}`);
                if(data){
                    console.log("cachedValue");
                    return JSON.parse(data);
                }
                const followings=await prisma.follows.findMany({
                    where:{
                        follower:{
                            id:ctx.user.id
                        }
                    },
                    include:{
                        following:{
                            include:{
                                follower:{
                                    include:{
                                        following:true
                                    }
                                }
                            }
                        }
                    }
                });
                const result=[];
                for(let i=0;i<=followings.length-1;i++){
                    for(let j=0;j<=followings[i].following.follower.length-1;j++){
                        if(followings[i].following.follower[j].following.id===ctx.user.id||followings.findIndex((foll)=>{
                            return foll.followingId===followings[i].following.follower[j].following.id

                       })>=0){
                            continue;

                        }
                        else{
                            result.push(followings[i].following.follower[j].following)

                        }
                    }
                }
                await redisClient.set(`RECOMMEND_USER_${ctx.user.id}`,JSON.stringify(result))
              return result;

            }
            catch(err){
                if(err instanceof CustomError){
                     throw err;
                    
                }
                throw new CustomError("INTERNAL_SERVER_ERROR",501);

            }
        }
    }

}