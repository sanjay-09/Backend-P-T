import { GraphQLError } from "graphql";

class CustomError extends GraphQLError {
  constructor(message: string, statusCode: number) {
    super(message, {
      extensions: {
        code: "CUSTOM_ERROR",
        statusCode,
      },
    });
  }
}
export default CustomError;