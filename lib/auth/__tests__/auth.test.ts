import { describe, it, expect } from "vitest";
import { hashPassword, comparePassword } from "../bcrypt";
import { createToken, verifyToken } from "../jwt";

describe("Authentication Utilities", () => {
  describe("Bcrypt Hashing", () => {
    it("should hash and compare passwords correctly", async () => {
      const password = "mySecurePassword123!";
      const hash = await hashPassword(password);
      
      expect(hash).not.toBe(password);
      expect(await comparePassword(password, hash)).toBe(true);
      expect(await comparePassword("wrongPassword", hash)).toBe(false);
    });
  });

  describe("JWT Tokens", () => {
    it("should create and verify valid tokens", async () => {
      const payload = { userId: "123", role: "admin" };
      const token = await createToken(payload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      
      const verified = await verifyToken(token);
      expect(verified).toMatchObject(payload);
    });

    it("should return null for invalid tokens", async () => {
      const invalidToken = "this.is.not.a.valid.token";
      const verified = await verifyToken(invalidToken);
      expect(verified).toBeNull();
    });

    it("should have correct expiration (checked via payload iat/exp)", async () => {
      const payload = { test: true };
      const token = await createToken(payload);
      const verified = await verifyToken(token) as any;
      
      // jose returns exp and iat as numbers (timestamps in seconds)
      expect(verified.iat).toBeDefined();
      expect(verified.exp).toBeDefined();
      
      const durationHours = (verified.exp - verified.iat) / 3600;
      expect(Math.round(durationHours)).toBe(2); // 2 hours as requested
    });
  });
});
