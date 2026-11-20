import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { sendOrderNotificationEmail } from './server/sendOrderEmail.js'
import { createSquarePayment } from './server/createSquarePayment.js'
import { createCheckoutSession } from './server/createCheckoutSession.js'
import { verifyCheckoutSession } from './server/verifyCheckoutSession.js'
import { handleStripeWebhook } from './server/handleStripeWebhook.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function readJsonBody(req) {
  return readRawBody(req).then((buf) => {
    const raw = buf.toString('utf8')
    return raw ? JSON.parse(raw) : {}
  })
}

function sendJson(res, statusCode, body) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

function localApiPlugin(env) {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0]

        try {
          if (url === '/api/send-order') {
            if (req.method !== 'POST') {
              return sendJson(res, 405, { error: 'Method not allowed' })
            }
            const payload = await readJsonBody(req)
            const result = await sendOrderNotificationEmail(payload, env)
            return sendJson(res, 200, result)
          }

          if (url === '/api/create-square-payment') {
            if (req.method !== 'POST') {
              return sendJson(res, 405, { error: 'Method not allowed' })
            }
            const payload = await readJsonBody(req)
            const result = await createSquarePayment(payload, env)
            return sendJson(res, 200, result)
          }

          if (url === '/api/create-checkout-session') {
            if (req.method !== 'POST') {
              return sendJson(res, 405, { error: 'Method not allowed' })
            }
            const payload = await readJsonBody(req)
            const result = await createCheckoutSession(payload, env)
            return sendJson(res, 200, result)
          }

          if (url === '/api/verify-checkout-session') {
            if (req.method !== 'POST' && req.method !== 'GET') {
              return sendJson(res, 405, { error: 'Method not allowed' })
            }
            let sessionId
            if (req.method === 'GET') {
              const q = new URL(req.url, 'http://localhost').searchParams
              sessionId = q.get('session_id')
            } else {
              const payload = await readJsonBody(req)
              sessionId = payload.sessionId || payload.session_id
            }
            const result = await verifyCheckoutSession(sessionId, env)
            if (!result.paid) {
              return sendJson(res, 402, { error: 'Payment not completed.', ...result })
            }
            return sendJson(res, 200, result)
          }

          if (url === '/api/stripe-webhook') {
            if (req.method !== 'POST') {
              return sendJson(res, 405, { error: 'Method not allowed' })
            }
            const rawBody = await readRawBody(req)
            const signature = req.headers['stripe-signature']
            if (!signature) {
              return sendJson(res, 400, { error: 'Missing stripe-signature header.' })
            }
            const result = await handleStripeWebhook({ rawBody, signature, env })
            return sendJson(res, 200, result)
          }
        } catch (err) {
          console.error(`${url} failed:`, err?.details || err)
          return sendJson(res, err.statusCode || 500, {
            error: err.message || 'Request failed.'
          })
        }

        return next()
      })
    }
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), localApiPlugin(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    }
  }
})
