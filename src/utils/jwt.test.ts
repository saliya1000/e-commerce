import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken, hashToken } from './jwt';

describe('JWT Utilities', () => {
  const mockUserId = '123-abc';
  const mockRole = 'customer';

  it('should generate and verify an access token', () => {
    const token = generateAccessToken(mockUserId, mockRole);
    expect(token).toBeDefined();

    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(mockUserId);
    expect(decoded.role).toBe(mockRole);
  });

  it('should generate and verify a refresh token', () => {
    const token = generateRefreshToken(mockUserId);
    expect(token).toBeDefined();

    const decoded = verifyRefreshToken(token);
    expect(decoded.userId).toBe(mockUserId);
  });

  it('should create a consistent hash for a token', () => {
    const token = 'sample_refresh_token';
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(token);
  });

  it('should throw an error for an invalid access token', () => {
    expect(() => verifyAccessToken('invalid.token.here')).toThrow();
  });
});
