import dotenv from "dotenv"
import { Client } from "whatsapp-web.js"
import qrcode from "qrcode-terminal"
import { GoogleGenerativeAI } from "@google/generative-ai"

dotenv.config()

const genAI = new GoogleGenerativeAI(process.env.API_KEY)
const model = genAI.getGenerativeModel({ model: "gemini-pro" })

const client = new Client()

// Predefined cat-related responses
const PREDEFINED_RESPONSES = {
  halo: "Meow! Saya adalah CatBot, ahli kucing sejati. Ada yang ingin kamu tahu tentang kucing?",
  "!ping": "Purr... (Pong!)",
  "!help": `Selamat datang di CatBot! 🐱
Berikut topik kucing yang bisa kamu tanyakan:
- !breeds : Jenis-jenis kucing
- !personality : Kepribadian kucing
- !care : Merawat kucing
- !health : Kesehatan kucing
- !food : Makanan kucing
- !play : Aktivitas kucing

Kirim pertanyaan apapun tentang kucing!`,
}

// Comprehensive Cat Prompt
const CAT_SYSTEM_PROMPT = `
Kamu adalah CatBot, seorang ahli kucing profesional dengan pengetahuan mendalam tentang:
- Berbagai ras kucing
- Perilaku dan kepribadian kucing
- Nutrisi dan makanan kucing
- Kesehatan dan perawatan kucing
- Aktivitas kucing sehari-hari
- Psikologi kucing
- Hubungan manusia dan kucing
- Informasi tentang kucing berdasarkan pakarnya atau dokter hewan
- Sejarah dan budaya kucing di berbagai belahan dunia

Karakteristik komunikasi:
- Gunakan bahasa Indonesia yang ramah
- Selalu panggil dengan "Kak"/ "Kakak" / "Cat Lovers" dan hindari memanggil dengan sebutan "Anda". 
- Jawab dengan detail tapi singkat (maks 3 paragraf)
- Tambahkan fakta menarik bila memungkinkan
- Gunakan nada bicara yang antusias tentang kucing
- Jawab hanya yang kamu tahu saja
- Kamu juga dapat memberikan rekomendasi kucing dari data yang kamu punya jika mereka menanyakan rekomendasi yang diambil. Tanyakan dulu mengenai kenginan perilaku dan aktivitas sehari-harinya. Kemudian cocokkan dengan data yang kamu punya. Rekomendasikan setidaknya 5 kucing yang cocok.
- Hindari penggunaan emoticon berlebihan
`

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true })
  console.log("Scan QR Code untuk login WhatsApp")
})

client.on("ready", () => {
  console.log("CatBot siap melayani pecinta kucing! 🐱")
})

client.on("message", async (msg) => {
  // Ignore group messages
  if (msg.from.includes("@g.us")) return

  try {
    // Check for predefined responses first
    const lowercaseBody = msg.body.toLowerCase()
    for (let [key, response] of Object.entries(PREDEFINED_RESPONSES)) {
      if (lowercaseBody === key.toLowerCase()) {
        await msg.reply(response)
        return
      }
    }

    // Special command for echo
    if (msg.body.startsWith("!echo ")) {
      await msg.reply(msg.body.slice(6))
      return
    }

    // Check for media
    if (msg.hasMedia) {
      await msg.reply("Maaf, saat ini saya hanya melayani pesan teks tentang kucing.")
      return
    }

    // AI-powered response for cat-related queries
    const chat = model.startChat({
      history: [],
      generationConfig: { maxOutputTokens: 300 },
    })

    const prompt = `${CAT_SYSTEM_PROMPT}
Pertanyaan pengguna: ${msg.body}`

    const result = await chat.sendMessage(prompt)
    const response = await result.response
    const text = response.text()

    await msg.reply(text)
  } catch (error) {
    console.error("Error processing message:", error)
    await msg.reply("Maaf, ada gangguan. Coba tanya lagi tentang kucing.")
  }
})

client.initialize()
