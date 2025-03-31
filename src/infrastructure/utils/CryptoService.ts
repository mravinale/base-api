import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { singleton } from "tsyringe";
import constants from "./../config/constants";

@singleton()
export class CryptoService {
    // Private instance fields first
    private algorithm: string = 'aes-256-cbc';
    private secretKey: Buffer;
    private secret: string = constants.CRYPTO.secret || 'defaultSecret';

    constructor() {
        // Hash the secret key to ensure it is 32 bytes
        const hash = createHash('sha256');
        hash.update(this.secret);
        this.secretKey = hash.digest(); // Uses the full hash as the key
    }

    public encrypt(text: string): string {
        // Generate a random initialization vector
        const iv = randomBytes(16);
        const cipher = createCipheriv(this.algorithm, this.secretKey, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        // Prepend the IV to the encrypted data (IV is needed for decryption)
        return iv.toString('hex') + ':' + encrypted;
    }

    public decrypt(encryptedText: string): string {
        // Extract the IV from the encrypted text
        const textParts = encryptedText.split(':');
        if (textParts.length !== 2) {
            throw new Error('Invalid encrypted text format');
        }
        
        const iv = Buffer.from(textParts[0], 'hex');
        const encryptedData = textParts[1];
        
        const decipher = createDecipheriv(this.algorithm, this.secretKey, iv);
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
