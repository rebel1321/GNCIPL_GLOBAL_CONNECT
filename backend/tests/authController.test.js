import { jest, describe, expect, test, beforeEach } from '@jest/globals';

const mockUserModel = {
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn()
};

const mockRecruiterModel = {
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn()
};

const mockJwt = {
  sign: jest.fn(() => 'signed-token')
};

const mockValidator = {
  isEmail: jest.fn((value) => value.includes('@'))
};

const createResponse = () => {
  const response = {};
  response.status = jest.fn().mockReturnValue(response);
  response.json = jest.fn().mockReturnValue(response);
  return response;
};

const loadController = async () => {
  jest.resetModules();

  mockUserModel.findOne.mockReset();
  mockUserModel.create.mockReset();
  mockUserModel.findById.mockReset();
  mockRecruiterModel.findOne.mockReset();
  mockRecruiterModel.create.mockReset();
  mockRecruiterModel.findById.mockReset();
  mockJwt.sign.mockClear();
  mockValidator.isEmail.mockImplementation((value) => value.includes('@'));

  await jest.unstable_mockModule('../models/User.js', () => ({ default: mockUserModel }));
  await jest.unstable_mockModule('../models/Recruiter.js', () => ({ default: mockRecruiterModel }));
  await jest.unstable_mockModule('jsonwebtoken', () => ({ default: mockJwt }));
  await jest.unstable_mockModule('validator', () => ({ default: mockValidator }));

  return import('../controllers/authController.js');
};

describe('authController', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  test('registers a user account', async () => {
    const { register } = await loadController();
    const response = createResponse();

    mockUserModel.findOne.mockResolvedValue(null);
    mockRecruiterModel.findOne.mockResolvedValue(null);
    mockUserModel.create.mockResolvedValue({
      _id: 'user-1',
      name: 'Alice',
      email: 'alice@example.com',
      isProfileComplete: false,
      createdAt: '2026-04-26T00:00:00.000Z'
    });

    await register(
      {
        body: {
          name: 'Alice',
          email: 'alice@example.com',
          password: 'secret123',
          role: 'user'
        }
      },
      response
    );

    expect(mockUserModel.create).toHaveBeenCalledWith({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'secret123'
    });
    expect(response.status).toHaveBeenCalledWith(201);
  });

  test('rejects registration missing required fields', async () => {
    const { register } = await loadController();
    const response = createResponse();

    await register({ body: { email: 'alice@example.com' } }, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Please provide name, email, password, and role'
      })
    );
  });

  test('rejects invalid registration email', async () => {
    const { register } = await loadController();
    const response = createResponse();

    await register(
      {
        body: {
          name: 'Alice',
          email: 'not-an-email',
          password: 'secret123',
          role: 'user'
        }
      },
      response
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Please provide a valid email'
      })
    );
  });

  test('rejects short registration passwords', async () => {
    const { register } = await loadController();
    const response = createResponse();

    await register(
      {
        body: {
          name: 'Alice',
          email: 'alice@example.com',
          password: '123',
          role: 'user'
        }
      },
      response
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Password must be at least 6 characters'
      })
    );
  });

  test('rejects invalid registration role', async () => {
    const { register } = await loadController();
    const response = createResponse();

    await register(
      {
        body: {
          name: 'Alice',
          email: 'alice@example.com',
          password: 'secret123',
          role: 'admin'
        }
      },
      response
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Role must be either user or recruiter'
      })
    );
  });

  test('rejects duplicate registration email', async () => {
    const { register } = await loadController();
    const response = createResponse();

    mockUserModel.findOne.mockResolvedValue({ _id: 'existing-user' });
    mockRecruiterModel.findOne.mockResolvedValue(null);

    await register(
      {
        body: {
          name: 'Alice',
          email: 'alice@example.com',
          password: 'secret123',
          role: 'user'
        }
      },
      response
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'An account already exists with this email'
      })
    );
  });

  test('registers a recruiter account', async () => {
    const { register } = await loadController();
    const response = createResponse();

    mockUserModel.findOne.mockResolvedValue(null);
    mockRecruiterModel.findOne.mockResolvedValue(null);
    mockRecruiterModel.create.mockResolvedValue({
      _id: 'recruiter-1',
      companyName: 'Globex',
      email: 'jobs@globex.com',
      industry: 'Technology',
      isProfileComplete: false,
      createdAt: '2026-04-26T00:00:00.000Z'
    });

    await register(
      {
        body: {
          name: 'Globex',
          email: 'jobs@globex.com',
          password: 'secret123',
          role: 'recruiter',
          companyName: 'Globex',
          industry: 'Technology'
        }
      },
      response
    );

    expect(mockRecruiterModel.create).toHaveBeenCalledWith({
      name: 'Globex',
      companyName: 'Globex',
      email: 'jobs@globex.com',
      password: 'secret123',
      industry: 'Technology'
    });
    expect(response.status).toHaveBeenCalledWith(201);
  });

  test('rejects recruiter signup without company details', async () => {
    const { register } = await loadController();
    const response = createResponse();

    await register(
      {
        body: {
          name: 'Globex',
          email: 'jobs@globex.com',
          password: 'secret123',
          role: 'recruiter'
        }
      },
      response
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Company name and industry are required for recruiters'
      })
    );
  });

  test('logs in a user account', async () => {
    const { login } = await loadController();
    const response = createResponse();

    const account = {
      _id: 'user-1',
      name: 'Alice',
      email: 'alice@example.com',
      role: 'user',
      bio: 'Dev',
      profilePic: '',
      jobTitle: 'Engineer',
      location: 'Remote',
      skills: ['JS'],
      isProfileComplete: true,
      lastLogin: new Date('2026-04-26T00:00:00.000Z'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(undefined)
    };

    mockUserModel.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(account) });
    mockRecruiterModel.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

    await login(
      {
        body: {
          email: 'alice@example.com',
          password: 'secret123'
        }
      },
      response
    );

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          token: 'signed-token'
        })
      })
    );
  });

  test('rejects invalid login credentials', async () => {
    const { login } = await loadController();
    const response = createResponse();

    mockUserModel.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    mockRecruiterModel.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

    await login(
      {
        body: {
          email: 'missing@example.com',
          password: 'secret123'
        }
      },
      response
    );

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid credentials' }));
  });

  test('rejects login with missing fields', async () => {
    const { login } = await loadController();
    const response = createResponse();

    await login({ body: { email: 'alice@example.com' } }, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Please provide email and password'
      })
    );
  });

  test('rejects login with invalid email', async () => {
    const { login } = await loadController();
    const response = createResponse();

    await login(
      {
        body: {
          email: 'invalid-email',
          password: 'secret123'
        }
      },
      response
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Please provide a valid email'
      })
    );
  });

  test('returns the current user profile', async () => {
    const { getMe } = await loadController();
    const response = createResponse();

    const userDoc = { _id: 'user-1', name: 'Alice', email: 'alice@example.com' };
    mockUserModel.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(userDoc)
      })
    });

    await getMe({ user: { id: 'user-1' } }, response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({ success: true, data: { user: userDoc } });
  });

  test('logs out successfully', async () => {
    const { logout } = await loadController();
    const response = createResponse();

    await logout({}, response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Logged out successfully'
      })
    );
  });

  test('changes password successfully', async () => {
    const { changePassword } = await loadController();
    const response = createResponse();

    const account = {
      password: 'old-secret',
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(undefined)
    };

    mockUserModel.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(account)
    });

    await changePassword(
      {
        user: { id: 'user-1' },
        body: {
          currentPassword: 'old-secret',
          newPassword: 'new-secret'
        }
      },
      response
    );

    expect(account.password).toBe('new-secret');
    expect(account.save).toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(200);
  });

  test('rejects password changes with missing fields', async () => {
    const { changePassword } = await loadController();
    const response = createResponse();

    await changePassword(
      {
        user: { id: 'user-1' },
        body: { currentPassword: 'old-secret' }
      },
      response
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Please provide current password and new password'
      })
    );
  });

  test('rejects short new passwords', async () => {
    const { changePassword } = await loadController();
    const response = createResponse();

    await changePassword(
      {
        user: { id: 'user-1' },
        body: {
          currentPassword: 'old-secret',
          newPassword: '123'
        }
      },
      response
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'New password must be at least 6 characters'
      })
    );
  });
});