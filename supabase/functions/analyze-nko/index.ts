import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set");
    const { pdfBase64 } = await req.json();
    if (!pdfBase64) throw new Error("pdfBase64 required");
    const prompt = `Kamu analis KPI senior PLN. Baca dokumen NKO ini dan kembalikan HANYA JSON valid (tanpa markdown) dengan struktur: {"metadata":{"judul":"","divisi":"","periode":"","tanggal_ttd":"","total_nilai":0,"evp":""},"kpi":[{"no":"","nama":"","satuan":"","bobot":0,"target_periode":0,"realisasi":0,"pencapaian_pct":0,"nilai":0,"status":"tercapai","gap":0,"gap_pct":0}],"summary":{"total_kpi":0,"tercapai":0,"waspada":0,"dibawah":0,"kpi_terbaik":"","kpi_terburuk":"","rata_pencapaian":0},"evaluasi":{"kinerja_umum":"","kpi_kritis":[{"nama":"","masalah":"","akar_masalah":"","dampak":""}],"kpi_unggulan":[{"nama":"","faktor_sukses":""}]},"prediksi":{"bulan_prediksi":"","narasi":"","kpi_forecast":[{"nama":"","realisasi_saat_ini":0,"prediksi_bulan_depan":0,"satuan":"","tren":"naik","confidence":"tinggi","asumsi":""}],"nilai_prediksi":0,"skenario_optimis":0,"skenario_pesimis":0},"rekomendasi":[{"prioritas":"urgent","judul":"","deskripsi":"","target_kpi":"","pic":""}],"action_plan":""}`;
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{inline_data:{mime_type:"application/pdf",data:pdfBase64}},{text:prompt}]}],generationConfig:{temperature:0.2,maxOutputTokens:8192}})});
    if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.error?.message||`Gemini error ${res.status}`); }
    const d = await res.json();
    const raw = d.candidates?.[0]?.content?.parts?.[0]?.text||"";
    const parsed = JSON.parse(raw.replace(/```json|```/g,"").trim());
    return new Response(JSON.stringify({success:true,data:parsed}),{headers:{...cors,"Content-Type":"application/json"}});
  } catch(e: any) {
    return new Response(JSON.stringify({success:false,error:e.message}),{status:400,headers:{...cors,"Content-Type":"application/json"}});
  }
});
