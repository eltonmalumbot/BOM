import {json,ready,authorized,allowedPhone,masked,oncePerInterval,twilioVerify} from "../lib/security.js";
export default async function handler(req,res) {
  if(req.method!=="POST") return json(res,405,{error:"Method not allowed"});
  if(!ready()) return json(res,503,{error:"Pengiriman belum dikonfigurasi oleh administrator."});
  if(!authorized(req)) return json(res,401,{error:"Kunci admin tidak valid."});
  const phone=allowedPhone(req.body?.phone);
  if(!phone) return json(res,403,{error:"Nomor tidak ada dalam daftar pengujian yang diizinkan."});
  try {
    const canSend=await oncePerInterval("send",phone,900);
    if(!canSend) return json(res,429,{error:"Nomor ini sedang dalam cooldown 15 menit."});
    const result=await twilioVerify("Verifications",{To:phone,Channel:"sms"});
    if(!result.ok) return json(res,502,{error:"Provider menolak permintaan. Periksa konfigurasi atau batas penggunaan."});
    return json(res,200,{success:true,status:result.status,number:masked(phone)});
  } catch {
    return json(res,503,{error:"Layanan sementara tidak tersedia. Request dihentikan dengan aman."});
  }
}
