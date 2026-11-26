import { env } from "cloudflare:workers";
import scores from "../../server/scores.js";

export const prerender = false;
export const ALL = ({request, params}) => scores.fetch(request, env, "/v1/" + params.resource);
