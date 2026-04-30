const axios = require('axios')
const cheerio = require('cheerio')
const crypto = require('crypto')

async function dphnChat(prompt) {
  const { data: stream } = await axios.post(
    "https://chat.dphn.ai/api/chat",
    {
      messages: [{ role: "user", content: prompt }],
      model: "dolphinserver:24B",
      template: "logical"
    },
    {
      headers: {
        accept: "text/event-stream",
        "content-type": "application/json"
      },
      responseType: "stream"
    }
  )

  return new Promise((resolve, reject) => {
    let result = ""
    let buffer = ""

    stream.on("data", chunk => {
      buffer += chunk.toString()

      const parts = buffer.split("\n")
      buffer = parts.pop()

      for (let line of parts) {
        line = line.trim()
        if (!line.startsWith("data:")) continue

        const payload = line.slice(5).trim()

        if (payload === "[DONE]") {
          resolve(result)
          return
        }

        try {
          const json = JSON.parse(payload)
          const text = json?.choices?.[0]?.delta?.content
          if (text) result += text
        } catch {}
      }
    })

    stream.on("end", () => resolve(result))
    stream.on("error", reject)
  })
}

module.exports = { dphnChat }
