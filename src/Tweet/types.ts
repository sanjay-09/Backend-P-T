export const types=`#graphql

     input CreateTweetData{
        content:String!
        imageUrl:String   
     
     }
        
   type Tweet{
    id:String
    content:String
    imageUrl:String
    author:User
    createdAt:String
    updatedAt:String
   }

`