
export const types=`#graphql

  type User{
  id:String 
  name:String
  email:String
  profileImage:String
  createdAt:String
  updatedAt:String
  tweets:[Tweet]
  follower:[User]
  following:[User]
  recommmendedUsers:[User]
  }
  
`