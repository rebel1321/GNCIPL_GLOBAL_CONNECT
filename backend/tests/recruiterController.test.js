import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';

const mockRecruiterModel = {
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn()
};

const MockJob = jest.fn();
MockJob.countDocuments = jest.fn();
MockJob.find = jest.fn();
MockJob.findOne = jest.fn();
MockJob.findByIdAndDelete = jest.fn();
MockJob.findByIdAndUpdate = jest.fn();

const mockJobApplicationModel = {
  countDocuments: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  deleteMany: jest.fn()
};

const mockCloudinary = {
  v2: {
    uploader: {
      upload: jest.fn(),
      destroy: jest.fn()
    }
  }
};

const createResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const resetMockJobConstructor = () => {
  MockJob.mockImplementation((data) => {
    const instance = {
      ...data,
      _id: 'job-1',
      save: jest.fn().mockResolvedValue(undefined)
    };
    return instance;
  });
};

const loadController = async () => {
  jest.resetModules();

  Object.values(mockRecruiterModel).forEach((mockFn) => mockFn.mockReset());
  MockJob.mockReset();
  MockJob.countDocuments.mockReset();
  MockJob.find.mockReset();
  MockJob.findOne.mockReset();
  MockJob.findByIdAndDelete.mockReset();
  MockJob.findByIdAndUpdate.mockReset();
  Object.values(mockJobApplicationModel).forEach((mockFn) => mockFn.mockReset());
  mockCloudinary.v2.uploader.upload.mockReset();
  mockCloudinary.v2.uploader.destroy.mockReset();

  resetMockJobConstructor();

  await jest.unstable_mockModule('../models/Recruiter.js', () => ({ default: mockRecruiterModel }));
  await jest.unstable_mockModule('../models/Job.js', () => ({ default: MockJob }));
  await jest.unstable_mockModule('../models/JobApplication.js', () => ({ default: mockJobApplicationModel }));
  await jest.unstable_mockModule('../models/User.js', () => ({ default: {} }));
  await jest.unstable_mockModule('cloudinary', () => ({ default: mockCloudinary }));

  return import('../controllers/recruiterController.js');
};

describe('recruiterController', () => {
  let consoleErrorSpy;
  let consoleLogSpy;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  test('getRecruiterProfile returns recruiter data', async () => {
    const { getRecruiterProfile } = await loadController();
    const res = createResponse();

    const recruiterDoc = { _id: 'r1', companyName: 'Globex' };
    mockRecruiterModel.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(recruiterDoc)
      })
    });

    await getRecruiterProfile({ user: { id: 'r1' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('updateRecruiterProfile returns 404 for missing recruiter', async () => {
    const { updateRecruiterProfile } = await loadController();
    const res = createResponse();

    mockRecruiterModel.findById.mockResolvedValue(null);

    await updateRecruiterProfile({ user: { id: 'r1' }, body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('updateRecruiterProfile updates fields and saves recruiter', async () => {
    const { updateRecruiterProfile } = await loadController();
    const res = createResponse();

    const recruiter = {
      socialMedia: {},
      checkProfileComplete: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined)
    };
    mockRecruiterModel.findById.mockResolvedValue(recruiter);

    await updateRecruiterProfile(
      {
        user: { id: 'r1' },
        body: {
          companyName: '  Globex  ',
          industry: '  Tech ',
          location: '  Remote '
        }
      },
      res
    );

    expect(recruiter.companyName).toBe('Globex');
    expect(recruiter.industry).toBe('Tech');
    expect(recruiter.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('updateRecruiterProfile handles profile upload errors', async () => {
    const { updateRecruiterProfile } = await loadController();
    const res = createResponse();

    const recruiter = { profileImage: '', save: jest.fn() };
    mockRecruiterModel.findById.mockResolvedValue(recruiter);
    mockCloudinary.v2.uploader.upload.mockRejectedValue(new Error('upload failed'));

    await updateRecruiterProfile(
      {
        user: { id: 'r1' },
        body: {},
        file: { path: '/tmp/profile.png' }
      },
      res
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Error uploading profile image' }));
  });

  test('uploadCompanyLogo validates missing file and missing recruiter', async () => {
    const { uploadCompanyLogo } = await loadController();
    const res = createResponse();

    await uploadCompanyLogo({ user: { id: 'r1' }, file: null }, res);
    expect(res.status).toHaveBeenCalledWith(400);

    mockRecruiterModel.findById.mockResolvedValue(null);
    await uploadCompanyLogo({ user: { id: 'r1' }, file: { path: '/tmp/logo.png' } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('uploadCompanyLogo uploads logo and saves recruiter', async () => {
    const { uploadCompanyLogo } = await loadController();
    const res = createResponse();

    const recruiter = { profilePic: '', profileImage: '', save: jest.fn().mockResolvedValue(undefined) };
    mockRecruiterModel.findById.mockResolvedValue(recruiter);
    mockCloudinary.v2.uploader.upload.mockResolvedValue({ secure_url: 'https://cdn/logo.png' });

    await uploadCompanyLogo({ user: { id: 'r1' }, file: { path: '/tmp/logo.png' } }, res);

    expect(recruiter.profilePic).toBe('https://cdn/logo.png');
    expect(recruiter.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('updateApplicationStatus validates status and missing application', async () => {
    const { updateApplicationStatus } = await loadController();
    const res = createResponse();

    await updateApplicationStatus(
      {
        user: { id: 'r1' },
        params: { applicationId: 'a1' },
        body: { status: 'unknown' }
      },
      res
    );
    expect(res.status).toHaveBeenCalledWith(400);

    mockJobApplicationModel.findOne.mockResolvedValue(null);
    await updateApplicationStatus(
      {
        user: { id: 'r1' },
        params: { applicationId: 'a1' },
        body: { status: 'accepted' }
      },
      res
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('updateApplicationStatus updates and saves application', async () => {
    const { updateApplicationStatus } = await loadController();
    const res = createResponse();

    const application = { save: jest.fn().mockResolvedValue(undefined) };
    mockJobApplicationModel.findOne.mockResolvedValue(application);

    await updateApplicationStatus(
      {
        user: { id: 'r1' },
        params: { applicationId: 'a1' },
        body: { status: 'accepted' }
      },
      res
    );

    expect(application.status).toBe('accepted');
    expect(application.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('saveCandidateProfile validates duplicates and saves candidate', async () => {
    const { saveCandidateProfile } = await loadController();
    const res = createResponse();

    const duplicateRecruiter = {
      savedCandidates: ['u2'],
      save: jest.fn()
    };
    mockRecruiterModel.findById.mockResolvedValueOnce(duplicateRecruiter);

    await saveCandidateProfile(
      { user: { id: 'r1' }, params: { userId: 'u2' } },
      res
    );
    expect(res.status).toHaveBeenCalledWith(400);

    const recruiter = {
      savedCandidates: [],
      save: jest.fn().mockResolvedValue(undefined)
    };
    mockRecruiterModel.findById.mockResolvedValueOnce(recruiter);

    await saveCandidateProfile(
      { user: { id: 'r1' }, params: { userId: 'u2' } },
      res
    );

    expect(recruiter.savedCandidates).toContain('u2');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('removeSavedCandidate removes candidate from list', async () => {
    const { removeSavedCandidate } = await loadController();
    const res = createResponse();

    const recruiter = {
      savedCandidates: ['u2', 'u3'],
      save: jest.fn().mockResolvedValue(undefined)
    };
    mockRecruiterModel.findById.mockResolvedValue(recruiter);

    await removeSavedCandidate(
      { user: { id: 'r1' }, params: { userId: 'u2' } },
      res
    );

    expect(recruiter.savedCandidates).toEqual(['u3']);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('getRecruiterStats returns counts', async () => {
    const { getRecruiterStats } = await loadController();
    const res = createResponse();

    MockJob.countDocuments
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2);
    mockJobApplicationModel.countDocuments
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(3);

    await getRecruiterStats({ user: { id: 'r1' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        stats: expect.objectContaining({ totalJobs: 4, activeJobs: 2 })
      })
    );
  });

  test('createJob creates and links new job', async () => {
    const { createJob } = await loadController();
    const res = createResponse();

    await createJob(
      {
        user: { id: 'r1', companyName: 'Globex' },
        body: { title: 'Engineer', location: 'Remote' }
      },
      res
    );

    expect(MockJob).toHaveBeenCalled();
    expect(mockRecruiterModel.findByIdAndUpdate).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('createJob returns 400 for validation errors', async () => {
    const { createJob } = await loadController();
    const res = createResponse();

    MockJob.mockImplementationOnce(() => ({
      save: jest.fn().mockRejectedValue({
        name: 'ValidationError',
        errors: {
          title: { message: 'Title is required' }
        }
      })
    }));

    await createJob(
      {
        user: { id: 'r1', companyName: 'Globex' },
        body: {}
      },
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('getRecruiterJobs returns jobs with applicant counts', async () => {
    const { getRecruiterJobs } = await loadController();
    const res = createResponse();

    const jobs = [
      {
        _id: 'j1',
        toObject: () => ({ _id: 'j1', title: 'Engineer' })
      }
    ];

    MockJob.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          skip: jest.fn().mockResolvedValue(jobs)
        })
      })
    });
    mockJobApplicationModel.countDocuments
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);
    MockJob.countDocuments.mockResolvedValue(1);

    await getRecruiterJobs({ user: { id: 'r1' }, query: {} }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('getJobById returns 404 for missing jobs', async () => {
    const { getJobById } = await loadController();
    const res = createResponse();

    MockJob.findOne.mockResolvedValue(null);

    await getJobById({ user: { id: 'r1' }, params: { jobId: 'j1' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('updateJob validates missing jobs and updates existing job', async () => {
    const { updateJob } = await loadController();
    const res = createResponse();

    MockJob.findOne.mockResolvedValueOnce(null);
    await updateJob({ user: { id: 'r1' }, params: { jobId: 'j1' }, body: {} }, res);
    expect(res.status).toHaveBeenCalledWith(404);

    const job = { save: jest.fn().mockResolvedValue(undefined) };
    MockJob.findOne.mockResolvedValueOnce(job);

    await updateJob(
      { user: { id: 'r1' }, params: { jobId: 'j1' }, body: { title: 'Senior Engineer' } },
      res
    );

    expect(job.title).toBe('Senior Engineer');
    expect(job.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('deleteJob validates missing jobs and deletes existing job', async () => {
    const { deleteJob } = await loadController();
    const res = createResponse();

    MockJob.findOne.mockResolvedValueOnce(null);
    await deleteJob({ user: { id: 'r1' }, params: { jobId: 'j1' } }, res);
    expect(res.status).toHaveBeenCalledWith(404);

    MockJob.findOne.mockResolvedValueOnce({ _id: 'j1' });
    await deleteJob({ user: { id: 'r1' }, params: { jobId: 'j1' } }, res);

    expect(mockJobApplicationModel.deleteMany).toHaveBeenCalledWith({ jobId: 'j1' });
    expect(MockJob.findByIdAndDelete).toHaveBeenCalledWith('j1');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('toggleJobStatus validates and toggles job status', async () => {
    const { toggleJobStatus } = await loadController();
    const res = createResponse();

    MockJob.findOne.mockResolvedValueOnce(null);
    await toggleJobStatus({ user: { id: 'r1' }, params: { jobId: 'j1' } }, res);
    expect(res.status).toHaveBeenCalledWith(404);

    const job = { isActive: true, save: jest.fn().mockResolvedValue(undefined) };
    MockJob.findOne.mockResolvedValueOnce(job);

    await toggleJobStatus({ user: { id: 'r1' }, params: { jobId: 'j1' } }, res);

    expect(job.isActive).toBe(false);
    expect(job.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('getJobApplications validates job ownership and returns applications', async () => {
    const { getJobApplications } = await loadController();
    const res = createResponse();

    MockJob.findOne.mockResolvedValueOnce(null);
    await getJobApplications({ user: { id: 'r1' }, params: { jobId: 'j1' }, query: {} }, res);
    expect(res.status).toHaveBeenCalledWith(404);

    MockJob.findOne.mockResolvedValueOnce({ _id: 'j1' });
    mockJobApplicationModel.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockResolvedValue([{ _id: 'a1' }])
          })
        })
      })
    });
    mockJobApplicationModel.countDocuments.mockResolvedValue(1);

    await getJobApplications({ user: { id: 'r1' }, params: { jobId: 'j1' }, query: {} }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});
