export type userPayload={
    id:string,
    email:string

}
export type GraphQLContext={
    user:userPayload | null
}