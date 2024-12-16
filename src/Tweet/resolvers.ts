import { Tweet } from "@prisma/client"
import { prisma } from "../client/prisma"
import { GraphQLContext } from "../Context/context"
import CustomError from "../Utility/CustomError"
import { redisClient } from "../client/redis"

type CreateTweet={
    content:string,
    imageUrl?:string
}

export const  mutationResolvers={
    createTweet:async(parent:any,{payload}:{payload:CreateTweet},ctx:GraphQLContext)=>{
      try{
        if(!ctx.user){
            throw new CustomError("User not authenticated",401)
        }
        const rateLimitChecker=await redisClient.get(`RATE_LIMIT_TWEETS:${ctx.user.id}`);
        if(rateLimitChecker){
            throw new CustomError('Cant create another tweet before 10 sec',501);
        }
        console.log("user",ctx.user.email)
        const tweet=await prisma.tweet.create({
            data:{
                content:payload?.content,
                imageUrl:payload?.imageUrl || "",
               authorId:ctx.user.id
            }
        })
        await redisClient.setex(`RATE_LIMIT_TWEETS:${ctx.user.id}`,10,1);
    await redisClient.del('All_Tweets')
        return tweet;

      }
      catch(err){
        console.log(err);
        if (err instanceof CustomError) {
            throw err; // Propagate custom error
          }
          throw new CustomError("Internal Server Error", 500); 

      }

    }

}

export const resolvers={
    getAllTweet:async(parent:any,args:any,ctx:GraphQLContext)=>{
        try{
            if(!ctx.user){
                throw new CustomError("user not authenticated",401)
   
           }
           const cachedAllTweets=await redisClient.get('All_Tweets');
           if(cachedAllTweets){
            return JSON.parse(cachedAllTweets);
           }
           const allTweets=await prisma.tweet.findMany();
           await redisClient.set('All_Tweets',JSON.stringify(allTweets));
           return allTweets;


        }
        catch(err){
            if (err instanceof CustomError) {
                throw err; // Propagate custom error
              }
              throw new CustomError("Internal Server Error", 500); 

        }

    }
}

export const extraResolvers={
    Tweet:{
        author:async(parent:Tweet)=>{
            return await prisma.user.findUnique({
                where:{
                    id:parent.authorId
                }
            })
        }


    }
}