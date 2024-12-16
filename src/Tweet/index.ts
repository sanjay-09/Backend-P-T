import { types } from "./types";
import { mutation } from "./mutation";
import {mutationResolvers,resolvers,extraResolvers} from "./resolvers"
import { queries } from "./queries";
export const tweet={
    types,
    mutation,
    mutationResolvers,
    resolvers,
    queries,
    extraResolvers
}