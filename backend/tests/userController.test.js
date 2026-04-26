import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';

const mockUserModel = {
  findById: jest.fn()
};

const mockJobModel = {
  find: jest.fn(),
  countDocuments: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn()
};

const mockJobApplicationModel = {
  findOne: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn()
};

const mockConnectionModel = {
  countDocuments: jest.fn()
};

const mockCloudinary = {
  uploader: {
    destroy: jest.fn(),
    upload: jest.fn()
  }
};

const createResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const loadController = async () => {
  jest.resetModules();

  Object.values(mockUserModel).forEach((mockFn) => mockFn.mockReset());
  Object.values(mockJobModel).forEach((mockFn) => mockFn.mockReset());
  Object.values(mockJobApplicationModel).forEach((mockFn) => mockFn.mockReset());
  Object.values(mockConnectionModel).forEach((mockFn) => mockFn.mockReset());
  mockCloudinary.uploader.destroy.mockReset();
  mockCloudinary.uploader.upload.mockReset();

  await jest.unstable_mockModule('../models/User.js', () => ({ default: mockUserModel }));
  await jest.unstable_mockModule('../models/Job.js', () => ({ default: mockJobModel }));
  await jest.unstable_mockModule('../models/JobApplication.js', () => ({ default: mockJobApplicationModel }));
  await jest.unstable_mockModule('../models/Connection.js', () => ({ default: mockConnectionModel }));
  await jest.unstable_mockModule('cloudinary', () => ({ v2: mockCloudinary }));

  return import('../controllers/userController.js');
};

describe('userController', () => {
  let consoleErrorSpy;
  let consoleWarnSpy;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  test('getUserProfile returns user data', async () => {
    const { getUserProfile } = await loadController();
    const res = createResponse();

    const userDoc = { _id: 'u1', name: 'Alice' };
    mockUserModel.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(userDoc)
      })
    });

    await getUserProfile({ user: { id: 'u1' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { user: userDoc } });
  });

  test('getUserProfileById rejects invalid user id', async () => {
    const { getUserProfileById } = await loadController();
    const res = createResponse();

    await getUserProfileById({ params: { userId: 'bad-id' } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid user ID' })
    );
  });

  test('getUserProfileById returns 404 when user is missing', async () => {
    const { getUserProfileById } = await loadController();
    const res = createResponse();

    mockUserModel.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null)
    });

    await getUserProfileById({ params: { userId: '507f1f77bcf86cd799439011' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('getUserProfileById returns user with connections count', async () => {
    const { getUserProfileById } = await loadController();
    const res = createResponse();

    const userDoc = {
      _id: 'u1',
      toObject: () => ({ _id: 'u1', name: 'Alice' })
    };

    mockUserModel.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(userDoc)
    });
    mockConnectionModel.countDocuments.mockResolvedValue(3);

    await getUserProfileById({ params: { userId: '507f1f77bcf86cd799439011' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: { user: expect.objectContaining({ connections: { length: 3 } }) }
      })
    );
  });

  test('updateUserProfile returns 404 when user is missing', async () => {
    const { updateUserProfile } = await loadController();
    const res = createResponse();

    mockUserModel.findById.mockResolvedValue(null);

    await updateUserProfile({ user: { id: 'u1' }, body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('updateUserProfile updates and saves user profile', async () => {
    const { updateUserProfile } = await loadController();
    const res = createResponse();

    const user = {
      checkProfileComplete: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined)
    };
    mockUserModel.findById.mockResolvedValue(user);

    await updateUserProfile(
      {
        user: { id: 'u1' },
        body: {
          bio: '  Dev bio  ',
          jobTitle: '  Engineer ',
          skills: [' JS ', ' React  '],
          projects: [{ name: ' App ', description: ' Desc ', technologies: [' Node '], url: ' x ' }]
        }
      },
      res
    );

    expect(user.bio).toBe('Dev bio');
    expect(user.jobTitle).toBe('Engineer');
    expect(user.skills).toEqual(['JS', 'React']);
    expect(user.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('uploadProfilePicture validates missing file', async () => {
    const { uploadProfilePicture } = await loadController();
    const res = createResponse();

    await uploadProfilePicture({ user: { id: 'u1' }, file: null }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Please upload an image' }));
  });

  test('uploadProfilePicture validates invalid file type', async () => {
    const { uploadProfilePicture } = await loadController();
    const res = createResponse();

    await uploadProfilePicture(
      {
        user: { id: 'u1' },
        file: { mimetype: 'application/pdf' }
      },
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('uploadProfilePicture returns 404 for missing user', async () => {
    const { uploadProfilePicture } = await loadController();
    const res = createResponse();

    mockUserModel.findById.mockResolvedValue(null);

    await uploadProfilePicture(
      {
        user: { id: 'u1' },
        file: { mimetype: 'image/png', path: '/tmp/img.png' }
      },
      res
    );

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('uploadProfilePicture uploads and saves profile image', async () => {
    const { uploadProfilePicture } = await loadController();
    const res = createResponse();

    const user = { profilePic: '', save: jest.fn().mockResolvedValue(undefined) };
    mockUserModel.findById.mockResolvedValue(user);
    mockCloudinary.uploader.upload.mockResolvedValue({ secure_url: 'https://cdn/profile.png' });

    await uploadProfilePicture(
      {
        user: { id: 'u1' },
        file: { mimetype: 'image/png', path: '/tmp/img.png' }
      },
      res
    );

    expect(user.profilePic).toBe('https://cdn/profile.png');
    expect(user.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('uploadResume validates missing file', async () => {
    const { uploadResume } = await loadController();
    const res = createResponse();

    await uploadResume({ user: { id: 'u1' }, file: null }, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('uploadResume validates missing user', async () => {
    const { uploadResume } = await loadController();
    const res = createResponse();

    mockUserModel.findById.mockResolvedValue(null);

    await uploadResume(
      { user: { id: 'u1' }, file: { path: 'resume.pdf', filename: 'r1', originalname: 'resume.pdf' } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('uploadResume stores resume metadata', async () => {
    const { uploadResume } = await loadController();
    const res = createResponse();

    const user = { save: jest.fn().mockResolvedValue(undefined) };
    mockUserModel.findById.mockResolvedValue(user);

    await uploadResume(
      { user: { id: 'u1' }, file: { path: 'resume.pdf', filename: 'r1', originalname: 'resume.pdf' } },
      res
    );

    expect(user.resume).toBe('resume.pdf');
    expect(user.resumePublicId).toBe('r1');
    expect(user.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('deleteResume returns 404 when no resume exists', async () => {
    const { deleteResume } = await loadController();
    const res = createResponse();

    mockUserModel.findById.mockResolvedValue({ resume: null });

    await deleteResume({ user: { id: 'u1' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('deleteResume clears resume fields', async () => {
    const { deleteResume } = await loadController();
    const res = createResponse();

    const user = {
      resume: 'https://cdn/resume.pdf',
      resumePublicId: 'resume_1',
      save: jest.fn().mockResolvedValue(undefined)
    };
    mockUserModel.findById.mockResolvedValue(user);

    await deleteResume({ user: { id: 'u1' } }, res);

    expect(user.resume).toBeNull();
    expect(user.resumePublicId).toBeNull();
    expect(user.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('getAllJobs returns jobs list', async () => {
    const { getAllJobs } = await loadController();
    const res = createResponse();

    mockJobModel.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockResolvedValue([{ _id: 'j1' }])
          })
        })
      })
    });
    mockJobModel.countDocuments.mockResolvedValue(1);

    await getAllJobs({ query: {} }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('applyForJob validates invalid job id', async () => {
    const { applyForJob } = await loadController();
    const res = createResponse();

    await applyForJob({ params: { jobId: 'bad-id' }, user: { id: 'u1' }, body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('applyForJob validates missing user', async () => {
    const { applyForJob } = await loadController();
    const res = createResponse();

    mockUserModel.findById.mockResolvedValue(null);

    await applyForJob(
      {
        params: { jobId: '507f1f77bcf86cd799439011' },
        user: { id: 'u1' },
        body: {}
      },
      res
    );

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('applyForJob validates resume requirement', async () => {
    const { applyForJob } = await loadController();
    const res = createResponse();

    mockUserModel.findById.mockResolvedValue({ resume: '' });

    await applyForJob(
      {
        params: { jobId: '507f1f77bcf86cd799439011' },
        user: { id: 'u1' },
        body: {}
      },
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('applyForJob validates active job existence', async () => {
    const { applyForJob } = await loadController();
    const res = createResponse();

    mockUserModel.findById.mockResolvedValue({
      resume: 'resume.pdf',
      name: 'Alice',
      email: 'a@example.com',
      phone: ''
    });
    mockJobModel.findOne.mockResolvedValue(null);

    await applyForJob(
      {
        params: { jobId: '507f1f77bcf86cd799439011' },
        user: { id: 'u1' },
        body: {}
      },
      res
    );

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('applyForJob rejects duplicate applications', async () => {
    const { applyForJob } = await loadController();
    const res = createResponse();

    mockUserModel.findById.mockResolvedValue({
      resume: 'resume.pdf',
      name: 'Alice',
      email: 'a@example.com',
      phone: ''
    });
    mockJobModel.findOne.mockResolvedValue({ recruiterId: 'r1', title: 'Engineer', location: 'Remote', companyName: 'Globex' });
    mockJobApplicationModel.findOne.mockResolvedValue({ _id: 'existing' });

    await applyForJob(
      {
        params: { jobId: '507f1f77bcf86cd799439011' },
        user: { id: 'u1' },
        body: {}
      },
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('getUserApplications returns application list', async () => {
    const { getUserApplications } = await loadController();
    const res = createResponse();

    mockJobApplicationModel.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue([{ _id: 'a1' }])
            })
          })
        })
      })
    });
    mockJobApplicationModel.countDocuments.mockResolvedValue(1);

    await getUserApplications({ user: { id: 'u1' }, query: {} }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('sendConnectionRequest validates self requests', async () => {
    const { sendConnectionRequest } = await loadController();
    const res = createResponse();

    await sendConnectionRequest(
      { user: { id: 'u1' }, params: { targetUserId: 'u1' }, body: {} },
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('sendConnectionRequest validates missing target user', async () => {
    const { sendConnectionRequest } = await loadController();
    const res = createResponse();

    mockUserModel.findById
      .mockResolvedValueOnce({ _id: 'u1', connections: [] })
      .mockResolvedValueOnce(null);

    await sendConnectionRequest(
      { user: { id: 'u1' }, params: { targetUserId: 'u2' }, body: {} },
      res
    );

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('respondToConnectionRequest validates action and request existence', async () => {
    const { respondToConnectionRequest } = await loadController();
    const res = createResponse();

    await respondToConnectionRequest(
      { user: { id: 'u1' }, params: { requestId: 'r1' }, body: { action: 'maybe' } },
      res
    );
    expect(res.status).toHaveBeenCalledWith(400);

    const user = { connectionRequests: { id: jest.fn().mockReturnValue(null) } };
    mockUserModel.findById.mockResolvedValue(user);

    await respondToConnectionRequest(
      { user: { id: 'u1' }, params: { requestId: 'r1' }, body: { action: 'accept' } },
      res
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('getDashboardStats returns computed stats', async () => {
    const { getDashboardStats } = await loadController();
    const res = createResponse();

    mockUserModel.findById.mockResolvedValue({
      name: 'Alice',
      email: 'a@example.com',
      jobTitle: 'Engineer',
      location: 'Remote',
      bio: 'Bio',
      skills: ['JS'],
      experience: [{ company: 'X' }],
      education: [{ school: 'Y' }],
      resume: 'resume.pdf',
      savedJobs: ['j1']
    });
    mockConnectionModel.countDocuments.mockResolvedValue(5);
    mockJobApplicationModel.countDocuments.mockResolvedValue(2);

    await getDashboardStats({ user: { id: 'u1' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ connectionsCount: 5, applicationsCount: 2 })
      })
    );
  });

  test('toggleSaveJob validates missing job and toggles saved state', async () => {
    const { toggleSaveJob } = await loadController();
    const res = createResponse();

    mockUserModel.findById.mockResolvedValue({ savedJobs: [], save: jest.fn() });
    mockJobModel.findById.mockResolvedValue(null);

    await toggleSaveJob({ user: { id: 'u1' }, params: { jobId: 'j1' } }, res);
    expect(res.status).toHaveBeenCalledWith(404);

    const user = { savedJobs: [], save: jest.fn().mockResolvedValue(undefined) };
    mockUserModel.findById.mockResolvedValue(user);
    mockJobModel.findById.mockResolvedValue({ _id: 'j1' });

    await toggleSaveJob({ user: { id: 'u1' }, params: { jobId: 'j1' } }, res);
    expect(user.savedJobs).toContain('j1');

    await toggleSaveJob({ user: { id: 'u1' }, params: { jobId: 'j1' } }, res);
    expect(user.savedJobs).not.toContain('j1');
  });
});
