const nodemailer = require('nodemailer')

function getMailConfig() {
  return {
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    host: process.env.MAIL_HOST,
    pass: process.env.MAIL_PASS,
    port: Number(process.env.MAIL_PORT || 587),
    secure: process.env.MAIL_SECURE === 'true',
    user: process.env.MAIL_USER,
  }
}

function assertMailConfig(config) {
  const missing = ['host', 'user', 'pass', 'from'].filter((key) => !config[key])

  if (missing.length > 0) {
    const error = new Error(`Mailer is not configured. Missing: ${missing.map((key) => `MAIL_${key.toUpperCase()}`).join(', ')}.`)
    error.status = 503
    throw error
  }
}

function createTransport(config) {
  return nodemailer.createTransport({
    auth: {
      pass: config.pass,
      user: config.user,
    },
    host: config.host,
    port: config.port,
    secure: config.secure,
  })
}

async function sendMail({ body, subject, to }) {
  const config = getMailConfig()
  assertMailConfig(config)

  const transport = createTransport(config)
  return transport.sendMail({
    from: config.from,
    subject,
    text: body,
    to,
  })
}

module.exports = {
  sendMail,
}
