import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { HTTPException } from 'hono/http-exception'
import { sign } from 'hono/jwt'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { getCookie, setCookie } from 'hono/cookie'
import { bearerAuth } from 'hono/bearer-auth'

const app = new Hono()

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
})

app.use(logger())

// app.get('/', (c) => {
//   return c.text('Hello Hono!')
// })

app.post('/login', zValidator('json', schema), async (c) => {
  const { email, password } = await c.req.json()

  if (password !== 'hono') {
    throw new HTTPException(401, { message: 'Invalid credentials' })
  }

  const payload = {
    email,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
  }
  
  const token = await sign(payload, Bun.env.SECRET || '')

  setCookie(c, 'token', token)

  return c.json({
    token,
    payload,
  })
})

app.use(
  '/index/*',
  bearerAuth({
    verifyToken: async (token, c) => {
      return token === getCookie(c, 'token')
    },
  })
)

app.get('/index/movies', (c) => {
  return c.json({
    movies: ['The Shawshank Redemption', 'The Godfather', 'The Godfather: Part II', 'The Dark Knight', '12 Angry Men'],
  })
})

export default app
