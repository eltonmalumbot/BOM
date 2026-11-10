import {json,ready} from "../lib/security.js";
export default function handler(req,res) {
  if(req.method!=="GET") return json(res,405,{error:"Method not allowed"});
  return json(res,200,{configured:ready(),provider:"Twilio Verify",mode:"real-with-authorization"});
}
