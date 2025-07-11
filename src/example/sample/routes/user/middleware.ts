import { Middleware } from "@/handler/types";

export const middleware: Middleware[] = [{
  middleware: ({ request, response }) => {
    if (!request.getHeader("Authorization")) {
      return response.json({
        message: "Unauthorized"
      })
    }
  },
  options: {
    name: "authentication"
  }
}]