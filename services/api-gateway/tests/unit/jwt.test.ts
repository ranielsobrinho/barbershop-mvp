import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'test-secret-key-for-testing-min-32-chars-long';

describe('API Gateway - JWT verification logic', () => {
  describe('token verification', () => {
    it('verifica token válido e retorna payload', () => {
      const payload = { sub: 'user-123', email: 'test@example.com' };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

      const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; email: string };

      expect(decoded.sub).toBe('user-123');
      expect(decoded.email).toBe('test@example.com');
    });

    it('rejeita token com assinatura inválida', () => {
      const payload = { sub: 'user-123', email: 'test@example.com' };
      const token = jwt.sign(payload, 'wrong-secret', { expiresIn: '7d' });

      expect(() => jwt.verify(token, JWT_SECRET)).toThrow(jwt.JsonWebTokenError);
    });

    it('rejeita token expirado', () => {
      const payload = { sub: 'user-123', email: 'test@example.com' };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '-1s' }); // já expirado

      expect(() => jwt.verify(token, JWT_SECRET)).toThrow(jwt.TokenExpiredError);
    });

    it('rejeita token malformado', () => {
      expect(() => jwt.verify('invalid.token.string', JWT_SECRET)).toThrow(jwt.JsonWebTokenError);
    });

    it('extrai user ID do payload', () => {
      const payload = { sub: 'user-456', email: 'admin@example.com' };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

      const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; email: string };
      expect(decoded.sub).toBe('user-456');
    });
  });

  describe('token extraction logic', () => {
    it('extrai token do cookie auth_token', () => {
      const cookies = { auth_token: 'cookie-token-value' };
      const headers = {};

      // Simula a lógica do middleware: request.cookies.auth_token || request.headers.authorization?.replace('Bearer ', '')
      const token = cookies.auth_token || headers['authorization']?.replace('Bearer ', '');
      expect(token).toBe('cookie-token-value');
    });

    it('extrai token do header Authorization Bearer', () => {
      const cookies = {};
      const headers = { authorization: 'Bearer header-token-value' };

      const token = cookies.auth_token || headers['authorization']?.replace('Bearer ', '');
      expect(token).toBe('header-token-value');
    });

    it('prioritiza cookie sobre header', () => {
      const cookies = { auth_token: 'cookie-token' };
      const headers = { authorization: 'Bearer header-token' };

      const token = cookies.auth_token || headers['authorization']?.replace('Bearer ', '');
      expect(token).toBe('cookie-token');
    });

    it('retorna undefined quando não há token', () => {
      const cookies = {};
      const headers = {};

      const token = cookies.auth_token || headers['authorization']?.replace('Bearer ', '');
      expect(token).toBeUndefined();
    });

    it('remove prefixo Bearer do header (um espaço)', () => {
      const headers = { authorization: 'Bearer abc123' };
      const token = headers['authorization']?.replace('Bearer ', '');
      expect(token).toBe('abc123');
    });
  });
});
