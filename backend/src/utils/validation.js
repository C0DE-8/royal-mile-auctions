function boolToInt(value) {
  return value === false || value === 0 || value === '0' ? 0 : 1
}

function requireFields(body, fields) {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === '')
  if (missing.length > 0) {
    const error = new Error(`Missing required fields: ${missing.join(', ')}`)
    error.status = 400
    throw error
  }
}

module.exports = {
  boolToInt,
  requireFields,
}
