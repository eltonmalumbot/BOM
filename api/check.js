import {json,ready,authorized,allowedPhone,oncePerInterval,twilioVerify} from "../lib/security.js";
export default async function handler(req,res) {
  if(req.method!=="POST") return json(res,405,{error:"Method not allowed"});
  if(!ready()) return json(res,503,{error:"Verifikasi belum dikonfigurasi."});
  if(!authorized(req)) return json(res,401,{error:"Kunci admin tidak valid."});
  const phone=allowedPhone(req.body?.phone);
  const code=req.body?.code;
  if(!phone) return json(res,403,{error:"Nomor tidak diizinkan."});
  if(typeof code!=="string" || !/^\d{4,10}$/.test(code)) return json(res,400,{error:"Format kode OTP tidak valid."});
  try{
    if(!await oncePerInterval("check",phone,30)) return json(res,429,{error:"Tunggu 30 detik sebelum mencoba verifikasi lagi."});
    const result=await twilioVerify("VerificationCheck",{To:phone,Code:code});
    if(!result.ok) return json(res,400,{error:"Kode tidak cocok, kedaluwarsa, atau ditolak provider."});
    return json(res,200,{success:result.status==="approved",status:result.status});
  } catch {
    return json(res,503,{error:"Layanan verifikasi belum tersedia."});
  }
}
