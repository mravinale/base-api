import { createCipheriv, createDecipheriv, createHash, scryptSync } from 'crypto';
import { singleton } from "tsyringe";
import constants from "./../config/constants";

@singleton()
export class CryptoService {

    constructor() {
        // Hash the secret key to ensure it is 32 bytes
        const hash = createHash('sha256');
        hash.update(this.secret);
        this.secretKey = hash.digest(); // Uses the full hash as the key
    }

    public encrypt(text: string): string {
        // Note: ECB mode does not use an IV
        const cipher = createCipheriv(this.algorithm, this.secretKey, null);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }

    public decrypt(encryptedText: string): string {
        // Note: ECB mode does not use an IV
        const decipher = createDecipheriv(this.algorithm, this.secretKey, null);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    private algorithm: string = 'aes-256-ecb';
    private secretKey: Buffer;
    private secret: string = constants.CRYPTO.secret || 'defaultSecret';
}
