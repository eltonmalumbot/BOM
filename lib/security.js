import crypto from "node:crypto";

export function json(res, status, data) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.status(status).json(data);
}
export function ready() {
  const needed = ["BOM_ADMIN_KEY","BOM_ALLOWED_NUMBERS","TWILIO_ACCOUNT_SID","TWILIO_AUTH_TOKEN","TWILIO_VERIFY_SERVICE_SID","UPSTASH_REDIS_REST_URL","UPSTASH_REDIS_REST_TOKEN"];
  return needed.every((k) => Boolean(process.env[k])) && (process.env.BOM_ADMIN_KEY?.length ?? 0) >= 24;
}
export function authorized(req) {
  const expected = process.env.BOM_ADMIN_KEY ?? "";
  const supplied = req.headers["x-bom-admin-key"];
  if (typeof supplied !== "string" || !expected || expected.length < 24) return false;
  const a=Buffer.from(supplied), b=Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a,b);
}
export function normalizePhone(value) {
  if (typeof value !== "string") return null;
  const trimmed=value.replace(/[\s()-]/g,"");
  const number=trimmed.startsWith("0") ? "+62"+trimmed.slice(1) : trimmed.startsWith("62") ? "+"+trimmed : trimmed;
  return /^\+[1-9]\d{7,14}$/.test(number) ? number : null;
}
export function allowedPhone(raw) {
  const num=normalizePhone(raw);
  if (!num) return null;
  const list=(process.env.BOM_ALLOWED_NUMBERS??"").split(",").map(normalizePhone).filter(Boolean);
  return list.includes(num) ? num : null;
}
export function masked(phone) {
  return phone.slice(0,Math.min(4,phone.length))+"••••"+phone.slice(-3);
}
async function redis(command) {
  const url=process.env.UPSTASH_REDIS_REST_URL;
  const token=process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token || !/^https:\/\//.test(url)) throw new Error("Redis unavailable");
  const res=await fetch(url.replace(/\/$/,""),{
    method:"POST",
    headers:{"Authorization":`Bearer ${token}`,"Content-Type":"application/json"},
    body:JSON.stringify(command),
    signal:AbortSignal.timeout(8000)
  });
  if (!res.ok) throw new Error("Redis unavailable");
  const data=await res.json();
  if (data.error) throw new Error("Redis unavailable");
  return data.result;
}
export async function oncePerInterval(kind, phone, seconds) {
  const secret=process.env.BOM_ADMIN_KEY??"";
  const hash=crypto.createHmac("sha256",secret).update(kind+"|"+phone).digest("hex");
  const result=await redis(["SET",`bom:${kind}:${hash}`,"1","EX",String(seconds),"NX"]);
  return result === "OK";
}
export async function twilioVerify(route, fields) {
  const account=process.env.TWILIO_ACCOUNT_SID;
  const token=process.env.TWILIO_AUTH_TOKEN;
  const service=process.env.TWILIO_VERIFY_SERVICE_SID;
  const response=await fetch(`https://verify.twilio.com/v2/Services/${encodeURIComponent(service)}/${route}`,{
    method:"POST",
    headers:{"Authorization":"Basic "+Buffer.from(account+":"+token).toString("base64"),"Content-Type":"application/x-www-form-urlencoded"},
    body:new URLSearchParams(fields),
    signal:AbortSignal.timeout(12000)
  });
  const body=await response.json().catch(()=>({}));
  if (!response.ok) return {ok:false,code:"PROVIDER_REJECTED"};
  return {ok:true,status:body.status??"pending"};
}
