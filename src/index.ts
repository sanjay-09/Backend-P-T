import express from "express";
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import bodyParser from "body-parser";
import { user } from "./user";
import cors from "cors";
import { GraphQLContext } from "./Context/context";
import UserService from "./Services/user";
import { tweet } from "./Tweet";
const userServiceObj=new UserService();



const start=async()=>{
    const app=express();
    app.use(cors());
    app.use(bodyParser.json());
    const server = new ApolloServer<GraphQLContext>({
        typeDefs:`
        ${user.types}
        ${tweet.types}
          type Query{
             ${user.queries}
             ${tweet.queries}
             
          }
             type Mutation{
                ${tweet.mutation}
                ${user.mutation}
             }
        `,
        resolvers:{
            Query: {
               ...user.resolvers,
               ...tweet.resolvers
            },
            Mutation:{
              ...tweet.mutationResolvers,
              ...user.mutationResolvers
            },
            ...tweet.extraResolvers,
            ...user.extraResolvers
        },
        formatError: (err) => {
          return {
            message: err.message,
            statusCode: err.extensions?.statusCode || 500,
            code: err.extensions?.code || "INTERNAL_SERVER_ERROR",
          };
        },
      });
      await server.start();
      //@ts-ignore
      app.use("/graphql",cors<cors.CorsRequest>(),expressMiddleware(server,{
        context: async ({ req }) => {
          return {
            user:req.headers.authorization ? userServiceObj.verifyToken(req.headers.authorization.split(" ")[1]):null
          }
        },


      }));


  
    app.listen(3001,()=>{
        
    
        console.log("Server starting on the server 3001")
    })

}
start();

