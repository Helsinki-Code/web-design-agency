import Parallel from "parallel-web";
import { env } from "@/lib/env";

export const parallelClient = new Parallel({
  apiKey: env.PARALLEL_API_KEY,
  defaultHeaders: {
    "parallel-beta": env.PARALLEL_FINDALL_BETA
  }
});
