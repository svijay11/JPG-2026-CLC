import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { sendOrderNotificationEmail } from './server/sendOrderEmail.js'

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve(raw ? JSON.parse(raw) : {})
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

function orderEmailApiPlugin(env) {
  return {
    name: 'order-email-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0]
        if (url !== '/api/send-order') return next()

        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        try {
          const payload = await readJsonBody(req)
          const result = await sendOrderNotificationEmail(payload, env)
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(result))
        } catch (err) {
          console.error('send-order failed:', err?.details || err)
          res.statusCode = err.statusCode || 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err.message || 'Failed to send order email.' }))
        }
      })
    }
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), orderEmailApiPlugin(env)]
  }
})
