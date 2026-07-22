import { GoogleGenerativeAI } from '@google/generative-ai';
import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const pool = mysql.createPool({
  host: process.env.DB_HOST!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

interface SipoNotification {
  id_notifikasi: number;
  judul: string;
  judul_document: string;
  dibaca: number;
  updated_at: string;
  redirect_url: string;
}

// Menentukan lokasi file untuk menyimpan jumlah notifikasi terakhir
const CACHE_FILE = path.join(process.cwd(), 'last_notif_count.txt');

export async function POST(req: Request) {
  try {
    // -------------------------------------------------------------
    // TAHAP 1: Baca Jumlah Notifikasi Terakhir dari Cache Lokal
    // -------------------------------------------------------------
    let lastCount = 0;
    try {
      const data = await fs.readFile(CACHE_FILE, 'utf-8');
      lastCount = parseInt(data, 10) || 0;
    } catch (err) {
      // Jika file belum ada, biarkan lastCount tetap 0
    }

    // -------------------------------------------------------------
    // TAHAP 2: Proses Login untuk mendapatkan Session Cookie
    // -------------------------------------------------------------
    const loginUrl = 'https://sipo.ptrekaindo.co.id/login';
    const loginPageRes = await fetch(loginUrl);
    const loginHtml = await loginPageRes.text();
    
    const tokenMatch = loginHtml.match(/name="_token"\s+value="([^"]+)"/i);
    const csrfToken = tokenMatch ? tokenMatch[1] : '';
    
    const setCookieHeader = loginPageRes.headers.getSetCookie();
    let cookieString = setCookieHeader.map(c => c.split(';')[0]).join('; ');

    const loginPayload = new URLSearchParams({
      _token: csrfToken,
      credential: process.env.CREDENTIAL!,
      password: process.env.CREDENTIAL!,
    });

    const authRes = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookieString,
      },
      body: loginPayload,
      redirect: 'manual'
    });

    const authCookiesArray = authRes.headers.getSetCookie();
    if (authCookiesArray.length > 0) {
       cookieString = authCookiesArray.map(c => c.split(';')[0]).join('; ');
    }

    // -------------------------------------------------------------
    // TAHAP 3: Cek API Jumlah Notifikasi
    // -------------------------------------------------------------
    const countRes = await fetch('https://sipo.ptrekaindo.co.id/notifikasi/jumlah', {
      headers: { 'Cookie': cookieString }
    });

    if (!countRes.ok) throw new Error("Gagal mengambil API jumlah notifikasi");
    
    const countData = await countRes.json();
    const currentCount = countData.count || 0;

    // Logika Pembanding: Berhenti jika tidak ada penambahan
    if (currentCount <= lastCount) {
      return Response.json({ 
        success: true, 
        message: "Proses dihentikan. Angka notifikasi tetap.", 
        current_count: currentCount,
        last_count: lastCount
      });
    }

    // -------------------------------------------------------------
    // TAHAP 4: Ambil API Notifikasi Penuh karena Ada Penambahan
    // -------------------------------------------------------------
    const notifRes = await fetch('https://sipo.ptrekaindo.co.id/notifikasi', {
      headers: { 'Cookie': cookieString }
    });

    if (!notifRes.ok) throw new Error("Gagal mengambil detail notifikasi");
    
    const notifData = await notifRes.json();
    const notifications: SipoNotification[] = notifData.notifications || [];

    // Menghitung berapa banyak notifikasi baru yang masuk
    const newItemsCount = currentCount - lastCount;
    
    // Hanya memotong array notifikasi sebanyak jumlah data yang baru masuk
    const newNotifications = notifications.slice(0, newItemsCount);

    // Cek apakah di antara notifikasi baru tersebut ada permohonan material
const targetNotifs = newNotifications.filter((n) => {
      const judul = n.judul_document.toLowerCase();
      return (
        judul.includes("material") ||
        judul.includes("pengadaan") ||
        judul.includes("komponen") ||
        judul.includes("permohonan")
      );
    });

    // Jika notifikasi baru bukan tentang material, simpan angka terbaru dan berhenti
    if (targetNotifs.length === 0) {
      await fs.writeFile(CACHE_FILE, currentCount.toString(), 'utf-8');
      return Response.json({ 
        success: true, 
        message: `Ada ${newItemsCount} notifikasi baru, tetapi tidak ada yang terkait material.` 
      });
    }

    // -------------------------------------------------------------
    // TAHAP 5: Ekstrak PDF dari 1 Dokumen Material Terbaru
    // -------------------------------------------------------------
    const newestNotif = targetNotifs[0]; // Tetap ambil 1 yang paling atas
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
    let totalInserted = 0;

    const urlParts = newestNotif.redirect_url.split('/');
    const documentId = urlParts[urlParts.length - 1];
    const pdfUrl = `https://sipo.ptrekaindo.co.id/view/memoPDF/${documentId}`;

    const pdfResponse = await fetch(pdfUrl, {
      headers: { 'Cookie': cookieString }
    });

    if (!pdfResponse.ok) {
      throw new Error(`Gagal mengunduh PDF untuk dokumen ID: ${documentId}`);
    }
    
    const arrayBuffer = await pdfResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Pdf = buffer.toString('base64');
    
    const prompt = `
      Anda adalah asisten ekstraksi data. Ekstrak informasi dari dokumen PDF yang dilampirkan ini menjadi format JSON murni tanpa markdown.
      Struktur JSON harus berupa objek tunggal dengan format berikut:
      {
        "no_surat": "Ambil dari field Nomor surat",
        "pic": "Ambil nama departemen pengirim atau yang menandatangani dokumen",
        "tanggal": "Ambil dari field Tanggal surat dan ubah formatnya HANYA menjadi YYYY-MM-DD",
        "project_name": "Ambil nama dari objek yang dikerjakan atau WBS pekerjaan",
        "materials": [
          {
            "kode_material": "ambil kode unik material dari dokumen",
            "material_name": "Ambil dari detail material dengan nama paling panjang",
            "qty": "Ambil angka dari jumlah atau kuantitas / qty yang diminta",
            "satuan": "Ambil dari Unit/satuan yang tercantum di dokumen"
          }
        ]
      }
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Pdf,
          mimeType: "application/pdf"
        }
      }
    ]);
    
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const extractedData = JSON.parse(jsonMatch[0]);
      
      for (const item of extractedData.materials) {
        const query = `
          INSERT INTO request_pr 
          (no_surat, pic, tanggal, project_name, kode_material, material_name, qty, satuan, link) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
          extractedData.no_surat,
          extractedData.pic,
          extractedData.tanggal, 
          extractedData.project_name,
          item.kode_material,
          item.material_name,
          item.qty,
          item.satuan,
          pdfUrl
        ];

        await pool.execute(query, values);
        totalInserted++;
      }
    }

    // TAHAP AKHIR: Simpan count terbaru ke file cache setelah berhasil ekstraksi
    await fs.writeFile(CACHE_FILE, currentCount.toString(), 'utf-8');

    return Response.json({ 
      success: true, 
      processed_documents: 1,
      inserted_rows: totalInserted,
      document_title: newestNotif.judul_document,
      new_count_saved: currentCount
    });

  } catch (error: unknown) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui";
    return Response.json({ success: false, error: errorMessage }, { status: 500 });
  }
}