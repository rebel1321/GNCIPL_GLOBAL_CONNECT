import { jest, describe, expect, test, beforeEach, afterEach } from '@jest/globals';

const mockJobModel = {
  find: jest.fn(),
  countDocuments: jest.fn()
};

const createResponse = () => {
  const response = {};
  response.status = jest.fn().mockReturnValue(response);
  response.json = jest.fn().mockReturnValue(response);
  return response;
};

const loadController = async () => {
  jest.resetModules();

  mockJobModel.find.mockReset();
  mockJobModel.countDocuments.mockReset();

  await jest.unstable_mockModule('../models/Job.js', () => ({ default: mockJobModel }));

  return import('../controllers/publicController.js');
};

describe('publicController', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('returns public jobs with pagination', async () => {
    const { getPublicJobs } = await loadController();
    const response = createResponse();

    const jobDoc = {
      _id: 'job-1',
      title: 'Frontend Developer',
      description: 'Build UI',
      location: 'Remote',
      salary: '100000',
      skills: ['React'],
      jobType: 'Full time',
      createdAt: '2026-04-26T00:00:00.000Z',
      applicantCount: 2,
      recruiterId: { companyName: 'Globex', location: 'Remote', profileImage: 'logo.png' }
    };

    mockJobModel.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue([jobDoc])
            })
          })
        })
      })
    });
    mockJobModel.countDocuments.mockResolvedValue(1);

    await getPublicJobs({ query: { page: '1', limit: '3' } }, response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        total: 1,
        totalPages: 1
      })
    );
  });

  test('returns 500 when job lookup fails', async () => {
    const { getPublicJobs } = await loadController();
    const response = createResponse();

    mockJobModel.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              select: jest.fn().mockRejectedValue(new Error('database failed'))
            })
          })
        })
      })
    });

    await getPublicJobs({ query: {} }, response);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Error fetching jobs'
      })
    );
  });
});