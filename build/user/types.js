"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.types = void 0;
exports.types = `#graphql

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
  
`;
