import { UserModel } from '../models/User';
import bcrypt from 'bcryptjs';

describe('Authentication', () => {
  describe('UserModel', () => {
    const mockUser = {
      email: 'test@example.com',
      password: 'hashedpassword',
      userType: 'sales_company' as const,
      isVerified: false
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should create a new user', async () => {
      const mockCreate = jest.spyOn(UserModel, 'create').mockResolvedValue({
        id: '123',
        ...mockUser,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await UserModel.create(mockUser);

      expect(mockCreate).toHaveBeenCalledWith(mockUser);
      expect(result.email).toBe(mockUser.email);
      expect(result.userType).toBe(mockUser.userType);
    });

    test('should find user by email', async () => {
      const mockFindByEmail = jest.spyOn(UserModel, 'findByEmail').mockResolvedValue({
        id: '123',
        ...mockUser,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await UserModel.findByEmail(mockUser.email);

      expect(mockFindByEmail).toHaveBeenCalledWith(mockUser.email);
      expect(result?.email).toBe(mockUser.email);
    });

    test('should return null when user not found', async () => {
      const mockFindByEmail = jest.spyOn(UserModel, 'findByEmail').mockResolvedValue(null);

      const result = await UserModel.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('Password Hashing', () => {
    test('should hash password correctly', async () => {
      const password = 'testpassword123';
      const hashedPassword = await bcrypt.hash(password, 10);

      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(password.length);
    });

    test('should verify password correctly', async () => {
      const password = 'testpassword123';
      const hashedPassword = await bcrypt.hash(password, 10);

      const isValid = await bcrypt.compare(password, hashedPassword);
      const isInvalid = await bcrypt.compare('wrongpassword', hashedPassword);

      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });
  });
});