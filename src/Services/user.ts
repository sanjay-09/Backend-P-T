import { User } from "@prisma/client";
import jwt from "jsonwebtoken";
import { prisma } from "../client/prisma";
import { connect } from "http2";
import { redisClient } from "../client/redis";
const JWT_SECRET="dajcnadvcnvdvcjnadcd"
type GoogleAuthToken = {
    iss: string; // Issuer
    azp: string; // Authorized party
    aud: string; // Audience
    sub: string; // Subject (unique identifier)
    email: string; // User's email address
    email_verified: 'true' | 'false'; // Email verification status as a string
    nbf: string; // Not Before (time in seconds since epoch)
    name: string; // Full name
    picture: string; // URL to the user's profile picture
    given_name: string; // First name
    family_name: string; // Last name
    iat: string; // Issued At (time in seconds since epoch)
    exp: string; // Expiration time (time in seconds since epoch)
    jti: string; // JWT ID
    alg: string; // Algorithm used to sign the token
    kid: string; // Key ID
    typ: string;
}

class UserService{
   async getJWTToken(token:string){

    const data=await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    if(!data.ok){
        return null;

   }
   const userData:GoogleAuthToken=await data.json();

   const isUserPresent=await prisma.user.findUnique({
       where:{
           email:userData.email

       }
   })
  
   if(!isUserPresent){
       await prisma.user.create({
           data:{
               name:userData.name,
               email:userData.email,
               profileImage:userData.picture
           }
       })

   }
   const user=await prisma.user.findUnique({
       where:{
           email:userData.email

       }
   });
   const jwtToken=this.generateToken(user!);
   return jwtToken;



      
   }

   generateToken(user:User){
    const payload={
        id:user.id,
        email:user.email
    }
    const token=jwt.sign(payload,JWT_SECRET);
    return token;

   }
   verifyToken(token:string){
    try{
        console.log("token");
         return jwt.verify(token,JWT_SECRET);


    }
    catch(err){
        return null;

    }
   }

   async getUserById(id:string){
    try{
        const cachedData=await redisClient.get(`USER_DATA_${id}`);
        if(cachedData){
            return JSON.parse(cachedData)
        }
         const data=await prisma.user.findUnique({
            where:{
                id:id
            }
         });
         console.log("value going to be cached",data)
         await redisClient.set(`USER_DATA_${id}`,JSON.stringify(data))

         return data;

    }
    catch(err){
        console.log("err",err);
        throw err;

    }
   }

   async followUser(from:string,to:string){
        try{
            const data=await prisma.follows.create({
                data:{
                    follower:{
                        connect:{
                            id:from
                        }
                    },
                    following:{
                        connect:{
                            id:to
                        }
                    }
                }
            });
            console.log("folloower",data)
            return data;



        }
        catch(err){
            throw err;

        }
   }
   async unfollowUser(from:string,to:string){
    try{
        const data= await prisma.follows.delete({
            where:{
                followerId_followingId:{
                    followerId:from,
                    followingId:to
                }
            }
        })
        
        return data;

    }
    catch(err){
         throw err;

    }
   }
}
export default UserService