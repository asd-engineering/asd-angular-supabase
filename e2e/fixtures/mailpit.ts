/**
 * Mailpit API utilities for testing email functionality
 *
 * Mailpit runs at http://127.0.0.1:54324 as part of Supabase local setup
 */

const MAILPIT_API_URL = process.env['MAILPIT_API_URL'] || 'http://127.0.0.1:54324/api/v1'

export interface MailpitMessage {
  ID: string
  From: { Address: string; Name: string }
  To: Array<{ Address: string; Name: string }>
  Subject: string
  Text: string
  HTML: string
  Created: string
}

interface MailpitSearchResponse {
  total: number
  count: number
  messages: MailpitMessage[]
}

/**
 * Get messages filtered by recipient email
 */
async function getMessagesByRecipient(email: string): Promise<MailpitMessage[]> {
  const response = await fetch(`${MAILPIT_API_URL}/messages?limit=100`)
  if (!response.ok) throw new Error(`Mailpit fetch failed: ${response.statusText}`)
  const data: MailpitSearchResponse = await response.json()
  return (data.messages || []).filter((msg) => msg.To && msg.To.some((r) => r.Address === email))
}

/**
 * Get full message content by ID
 */
async function getMessageById(messageId: string): Promise<MailpitMessage> {
  const response = await fetch(`${MAILPIT_API_URL}/message/${messageId}`)
  if (!response.ok) throw new Error(`Mailpit message fetch failed: ${response.statusText}`)
  return await response.json()
}

/**
 * Wait for an email to arrive for a specific recipient.
 * Polls Mailpit every 500ms until timeout.
 */
export async function waitForEmail(
  email: string,
  options?: { timeout?: number; subject?: string },
): Promise<MailpitMessage> {
  const timeout = options?.timeout || 10000
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    const messages = await getMessagesByRecipient(email)

    for (const message of messages) {
      if (options?.subject && !message.Subject.includes(options.subject)) continue
      return await getMessageById(message.ID)
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  throw new Error(
    `Email not received for ${email} within ${timeout}ms` +
      (options?.subject ? ` with subject "${options.subject}"` : ''),
  )
}

/**
 * Extract confirmation/verify link from email HTML or plain text
 */
export function extractConfirmationLink(message: MailpitMessage): string | null {
  if (message.HTML) {
    const match = message.HTML.match(/href=["']([^"']*(?:confirm|verify)[^"']*)["']/i)
    if (match) {
      return match[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    }
  }

  if (message.Text) {
    const match = message.Text.match(/(https?:\/\/[^\s]+(?:confirm|verify)[^\s]*)/i)
    if (match) return match[1]
  }

  return null
}

/**
 * Delete all messages from Mailpit (test cleanup)
 */
export async function deleteAllMessages(): Promise<void> {
  await fetch(`${MAILPIT_API_URL}/messages`, { method: 'DELETE' })
}
