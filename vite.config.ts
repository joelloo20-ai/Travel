import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const itineraryInstruction = `You are an expert couple's travel planner. Return only valid JSON: {"itinerary":[...]}. Each item must have date (YYYY-MM-DD), startTime, endTime, duration, placeOfInterest, category, transitMode, distanceKm, notes, googleMapsLink, actualCostSgd, manualActualCostSgd, howWasIt. Build a chronological, geographically compact plan. Preserve the caller's trip dates. Include realistic walking/transit distances, food stops, booking notes and a return to hotel. Never include hotel or flight changes.`

export default defineConfig({
  // GitHub Pages serves this project from /Travel/, not from the domain root.
  base: process.env.GITHUB_ACTIONS ? '/Travel/' : '/',
  plugins: [
    react(),
    {
      name: 'itinerary-assistant-api',
      configureServer(server) {
        server.middlewares.use('/api/itinerary-assistant', async (request, response) => {
          if (request.method !== 'POST') { response.statusCode = 405; response.end(); return }
          const apiKey = process.env.OPENAI_API_KEY
          if (!apiKey) { response.statusCode = 503; response.end(JSON.stringify({ error: 'OPENAI_API_KEY is not configured' })); return }
          let rawBody = ''
          request.on('data', (chunk) => { rawBody += chunk })
          request.on('end', async () => {
            try {
              const body = JSON.parse(rawBody) as { trip: unknown }
              const openAiResponse = await fetch('https://api.openai.com/v1/responses', {
                method: 'POST',
                headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: 'gpt-5.6-luna', store: false, input: `${itineraryInstruction}\n\nTrip data:\n${JSON.stringify(body.trip)}` }),
              })
              if (!openAiResponse.ok) throw new Error(`OpenAI request failed (${openAiResponse.status})`)
              const payload = await openAiResponse.json() as { output_text?: string }
              const match = payload.output_text?.match(/\{[\s\S]*\}/)
              if (!match) throw new Error('No JSON itinerary returned')
              response.setHeader('Content-Type', 'application/json')
              response.end(match[0])
            } catch (error) {
              response.statusCode = 502
              response.setHeader('Content-Type', 'application/json')
              response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Unable to build itinerary' }))
            }
          })
        })
      },
    },
  ],
})
