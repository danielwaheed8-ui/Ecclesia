import crypto from 'crypto'
import bs58 from 'bs58'

// Ed25519 multicodec prefix (varint 0xed01)
const ED25519_PREFIX = Buffer.from([0xed, 0x01])

export function generateKeypair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'der' },
    privateKeyEncoding: { type: 'pkcs8', format: 'der' },
  })

  // spki DER for Ed25519 has a 12-byte header; raw key is the last 32 bytes
  const rawPublic = publicKey.subarray(publicKey.length - 32)
  // pkcs8 DER for Ed25519 has a 16-byte header; raw key is the last 32 bytes
  const rawPrivate = privateKey.subarray(privateKey.length - 32)

  return {
    publicKey: rawPublic.toString('hex'),
    privateKey: rawPrivate.toString('hex'),
  }
}

export function generateDID(publicKeyHex: string): string {
  const keyBytes = Buffer.from(publicKeyHex, 'hex')
  const prefixed = Buffer.concat([ED25519_PREFIX, keyBytes])
  // 'z' is the multibase prefix for base58btc
  return 'did:key:z' + bs58.encode(prefixed)
}

export function verifyCredential(
  credential: string,
  publicKeyHex: string
): boolean {
  try {
    const [payload, signatureHex] = credential.split('.')
    if (!payload || !signatureHex) return false

    const rawPublic = Buffer.from(publicKeyHex, 'hex')

    // Reconstruct spki DER from raw Ed25519 public key
    const spkiHeader = Buffer.from(
      '302a300506032b6570032100',
      'hex'
    )
    const spkiDer = Buffer.concat([spkiHeader, rawPublic])

    const keyObject = crypto.createPublicKey({
      key: spkiDer,
      format: 'der',
      type: 'spki',
    })

    const verify = crypto.createVerify('Ed25519')
    verify.update(Buffer.from(payload, 'utf8'))
    return verify.verify(keyObject, Buffer.from(signatureHex, 'hex'))
  } catch {
    return false
  }
}
