import { customAlphabet } from 'nanoid'

const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
const nanoid = customAlphabet(alphabet, 8)

export function generateSlug(): string {
  return nanoid()
}