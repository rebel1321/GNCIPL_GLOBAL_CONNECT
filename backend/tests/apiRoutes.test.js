import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import request from 'supertest';

const successBody = (routeName) => ({
  success: true,
  route: routeName
});

const controllerMocks = {
  authController: {
    register: jest.fn((req, res) => res.status(201).json(successBody('register'))),
    login: jest.fn((req, res) => res.status(200).json(successBody('login'))),
    getMe: jest.fn((req, res) => res.status(200).json(successBody('getMe'))),
    logout: jest.fn((req, res) => res.status(200).json(successBody('logout'))),
    changePassword: jest.fn((req, res) => res.status(200).json(successBody('changePassword')))
  },
  userController: {
    getUserProfile: jest.fn((req, res) => res.status(200).json(successBody('getUserProfile'))),
    getUserProfileById: jest.fn((req, res) => res.status(200).json(successBody('getUserProfileById'))),
    updateUserProfile: jest.fn((req, res) => res.status(200).json(successBody('updateUserProfile'))),
    uploadProfilePicture: jest.fn((req, res) => res.status(200).json(successBody('uploadProfilePicture'))),
    uploadResume: jest.fn((req, res) => res.status(200).json(successBody('uploadResume'))),
    deleteResume: jest.fn((req, res) => res.status(200).json(successBody('deleteResume'))),
    getAllJobs: jest.fn((req, res) => res.status(200).json(successBody('getAllJobs'))),
    applyForJob: jest.fn((req, res) => res.status(201).json(successBody('applyForJob'))),
    getUserApplications: jest.fn((req, res) => res.status(200).json(successBody('getUserApplications'))),
    sendConnectionRequest: jest.fn((req, res) => res.status(201).json(successBody('sendConnectionRequest'))),
    respondToConnectionRequest: jest.fn((req, res) => res.status(200).json(successBody('respondToConnectionRequest'))),
    getDashboardStats: jest.fn((req, res) => res.status(200).json(successBody('getDashboardStats'))),
    getSavedJobs: jest.fn((req, res) => res.status(200).json(successBody('getSavedJobs'))),
    toggleSaveJob: jest.fn((req, res) => res.status(200).json(successBody('toggleSaveJob')))
  },
  recruiterController: {
    getRecruiterProfile: jest.fn((req, res) => res.status(200).json(successBody('getRecruiterProfile'))),
    updateRecruiterProfile: jest.fn((req, res) => res.status(200).json(successBody('updateRecruiterProfile'))),
    uploadCompanyLogo: jest.fn((req, res) => res.status(200).json(successBody('uploadCompanyLogo'))),
    getApplicationsReceived: jest.fn((req, res) => res.status(200).json(successBody('getApplicationsReceived'))),
    updateApplicationStatus: jest.fn((req, res) => res.status(200).json(successBody('updateApplicationStatus'))),
    saveCandidateProfile: jest.fn((req, res) => res.status(200).json(successBody('saveCandidateProfile'))),
    removeSavedCandidate: jest.fn((req, res) => res.status(200).json(successBody('removeSavedCandidate'))),
    createJob: jest.fn((req, res) => res.status(201).json(successBody('createJob'))),
    getRecruiterJobs: jest.fn((req, res) => res.status(200).json(successBody('getRecruiterJobs'))),
    getJobById: jest.fn((req, res) => res.status(200).json(successBody('getJobById'))),
    updateJob: jest.fn((req, res) => res.status(200).json(successBody('updateJob'))),
    deleteJob: jest.fn((req, res) => res.status(200).json(successBody('deleteJob'))),
    toggleJobStatus: jest.fn((req, res) => res.status(200).json(successBody('toggleJobStatus'))),
    getRecruiterStats: jest.fn((req, res) => res.status(200).json(successBody('getRecruiterStats'))),
    getJobApplications: jest.fn((req, res) => res.status(200).json(successBody('getJobApplications')))
  },
  postController: {
    createPost: jest.fn((req, res) => res.status(201).json(successBody('createPost'))),
    getFeedPosts: jest.fn((req, res) => res.status(200).json(successBody('getFeedPosts'))),
    toggleLikePost: jest.fn((req, res) => res.status(200).json(successBody('toggleLikePost'))),
    addComment: jest.fn((req, res) => res.status(201).json(successBody('addComment'))),
    sharePost: jest.fn((req, res) => res.status(201).json(successBody('sharePost'))),
    sendPost: jest.fn((req, res) => res.status(200).json(successBody('sendPost'))),
    getPostById: jest.fn((req, res) => res.status(200).json(successBody('getPostById'))),
    deletePost: jest.fn((req, res) => res.status(200).json(successBody('deletePost'))),
    getUserPosts: jest.fn((req, res) => res.status(200).json(successBody('getUserPosts')))
  },
  connectionController: {
    sendConnectionRequest: jest.fn((req, res) => res.status(201).json(successBody('sendConnectionRequest'))),
    respondToConnectionRequest: jest.fn((req, res) => res.status(200).json(successBody('respondToConnectionRequest'))),
    getConnectionRequests: jest.fn((req, res) => res.status(200).json(successBody('getConnectionRequests'))),
    getUserConnections: jest.fn((req, res) => res.status(200).json(successBody('getUserConnections'))),
    getConnectionSuggestions: jest.fn((req, res) => res.status(200).json(successBody('getConnectionSuggestions'))),
    getNetworkStats: jest.fn((req, res) => res.status(200).json(successBody('getNetworkStats'))),
    removeConnection: jest.fn((req, res) => res.status(200).json(successBody('removeConnection')))
  },
  messageController: {
    getConversations: jest.fn((req, res) => res.status(200).json(successBody('getConversations'))),
    getOrCreateConversation: jest.fn((req, res) => res.status(200).json(successBody('getOrCreateConversation'))),
    getMessages: jest.fn((req, res) => res.status(200).json(successBody('getMessages'))),
    sendMessage: jest.fn((req, res) => res.status(201).json(successBody('sendMessage'))),
    editMessage: jest.fn((req, res) => res.status(200).json(successBody('editMessage'))),
    deleteMessage: jest.fn((req, res) => res.status(200).json(successBody('deleteMessage'))),
    markMessagesAsRead: jest.fn((req, res) => res.status(200).json(successBody('markMessagesAsRead'))),
    getUnreadCount: jest.fn((req, res) => res.status(200).json(successBody('getUnreadCount')))
  },
  publicController: {
    getPublicJobs: jest.fn((req, res) => res.status(200).json(successBody('getPublicJobs')))
  }
};

const authMiddleware = {
  authenticate: jest.fn((req, res, next) => {
    const authorization = req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    if (authorization === 'Bearer invalid') {
      return res.status(401).json({ success: false, message: 'Token is not valid' });
    }

    const role = authorization.includes('recruiter') ? 'recruiter' : 'user';
    req.user = { id: role === 'user' ? 'user-1' : 'recruiter-1', role };
    req.userRole = role;
    next();
  }),
  authorize: (...roles) => (req, res, next) => {
    if (!req.user || !req.userRole) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ success: false, message: `User role ${req.userRole} is not authorized to access this route` });
    }

    next();
  }
};

const uploadMiddleware = {
  default: {
    single: () => (req, res, next) => next()
  },
  uploadResume: {
    single: () => (req, res, next) => next()
  },
  uploadPostFiles: (req, res, next) => next()
};

const loadApp = async () => {
  jest.resetModules();

  Object.values(controllerMocks).forEach((group) => {
    Object.values(group).forEach((mockFn) => mockFn.mockClear());
  });

  authMiddleware.authenticate.mockClear();

  await jest.unstable_mockModule('../controllers/authController.js', () => controllerMocks.authController);
  await jest.unstable_mockModule('../controllers/userController.js', () => controllerMocks.userController);
  await jest.unstable_mockModule('../controllers/recruiterController.js', () => controllerMocks.recruiterController);
  await jest.unstable_mockModule('../controllers/postController.js', () => controllerMocks.postController);
  await jest.unstable_mockModule('../controllers/connectionController.js', () => controllerMocks.connectionController);
  await jest.unstable_mockModule('../controllers/messageController.js', () => controllerMocks.messageController);
  await jest.unstable_mockModule('../controllers/publicController.js', () => controllerMocks.publicController);
  await jest.unstable_mockModule('../middleware/auth.js', () => authMiddleware);
  await jest.unstable_mockModule('../config/multer.js', () => ({
    default: uploadMiddleware.default,
    uploadResume: uploadMiddleware.uploadResume,
    uploadPostFiles: uploadMiddleware.uploadPostFiles
  }));

  return import('../app.js');
};

const protectedAuth = 'Bearer user-token';
const recruiterAuth = 'Bearer recruiter-token';

describe('route coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('auth routes enforce validation and auth', async () => {
    const { default: app } = await loadApp();

    const registerResponse = await request(app).post('/api/auth/register').send({});
    expect(registerResponse.status).toBe(201);
    expect(controllerMocks.authController.register).toHaveBeenCalled();

    const loginResponse = await request(app).post('/api/auth/login').send({});
    expect(loginResponse.status).toBe(200);

    const meUnauthorized = await request(app).get('/api/auth/me');
    expect(meUnauthorized.status).toBe(401);

    const meAuthorized = await request(app).get('/api/auth/me').set('Authorization', protectedAuth);
    expect(meAuthorized.status).toBe(200);

    const logoutAuthorized = await request(app).post('/api/auth/logout').set('Authorization', protectedAuth);
    expect(logoutAuthorized.status).toBe(200);

    const passwordChange = await request(app).put('/api/auth/change-password').set('Authorization', protectedAuth).send({});
    expect(passwordChange.status).toBe(200);
  });

  test('user routes require auth and hit every endpoint', async () => {
    const { default: app } = await loadApp();

    const unauthorized = await request(app).get('/api/users/profile');
    expect(unauthorized.status).toBe(401);

    const cases = [
      ['get', '/api/users/profile', 200, 'getUserProfile'],
      ['get', '/api/users/profile/123', 200, 'getUserProfileById'],
      ['put', '/api/users/profile', 200, 'updateUserProfile'],
      ['post', '/api/users/profile-pic', 200, 'uploadProfilePicture'],
      ['post', '/api/users/resume', 200, 'uploadResume'],
      ['delete', '/api/users/resume', 200, 'deleteResume'],
      ['get', '/api/users/jobs', 200, 'getAllJobs'],
      ['post', '/api/users/apply/job-1', 201, 'applyForJob'],
      ['get', '/api/users/applications', 200, 'getUserApplications'],
      ['post', '/api/users/connect/user-2', 201, 'sendConnectionRequest'],
      ['put', '/api/users/connection-requests/request-1', 200, 'respondToConnectionRequest'],
      ['get', '/api/users/dashboard-stats', 200, 'getDashboardStats'],
      ['get', '/api/users/saved-jobs', 200, 'getSavedJobs'],
      ['post', '/api/users/jobs/job-1/save', 200, 'toggleSaveJob']
    ];

    for (const [method, path, expectedStatus, routeName] of cases) {
      const response = await request(app)[method](path).set('Authorization', protectedAuth);
      expect(response.status).toBe(expectedStatus);
      expect(response.body.route).toBe(routeName);
    }
  });

  test('recruiter routes require recruiter auth and hit every endpoint', async () => {
    const { default: app } = await loadApp();

    const forbidden = await request(app).get('/api/recruiters/profile').set('Authorization', protectedAuth);
    expect(forbidden.status).toBe(403);

    const cases = [
      ['get', '/api/recruiters/profile', 200, 'getRecruiterProfile'],
      ['put', '/api/recruiters/profile', 200, 'updateRecruiterProfile'],
      ['post', '/api/recruiters/logo', 200, 'uploadCompanyLogo'],
      ['get', '/api/recruiters/stats', 200, 'getRecruiterStats'],
      ['post', '/api/recruiters/jobs', 201, 'createJob'],
      ['get', '/api/recruiters/jobs', 200, 'getRecruiterJobs'],
      ['get', '/api/recruiters/jobs/job-1', 200, 'getJobById'],
      ['put', '/api/recruiters/jobs/job-1', 200, 'updateJob'],
      ['delete', '/api/recruiters/jobs/job-1', 200, 'deleteJob'],
      ['patch', '/api/recruiters/jobs/job-1/toggle-status', 200, 'toggleJobStatus'],
      ['get', '/api/recruiters/applications', 200, 'getApplicationsReceived'],
      ['get', '/api/recruiters/jobs/job-1/applications', 200, 'getJobApplications'],
      ['patch', '/api/recruiters/applications/app-1/status', 200, 'updateApplicationStatus'],
      ['put', '/api/recruiters/applications/app-1', 200, 'updateApplicationStatus'],
      ['post', '/api/recruiters/saved-candidates/user-2', 200, 'saveCandidateProfile'],
      ['delete', '/api/recruiters/saved-candidates/user-2', 200, 'removeSavedCandidate']
    ];

    for (const [method, path, expectedStatus, routeName] of cases) {
      const response = await request(app)[method](path).set('Authorization', recruiterAuth);
      expect(response.status).toBe(expectedStatus);
      expect(response.body.route).toBe(routeName);
    }
  });

  test('post routes require auth and hit every endpoint', async () => {
    const { default: app } = await loadApp();

    const unauthorized = await request(app).get('/api/posts/feed');
    expect(unauthorized.status).toBe(401);

    const cases = [
      ['post', '/api/posts', 201, 'createPost'],
      ['get', '/api/posts/feed', 200, 'getFeedPosts'],
      ['get', '/api/posts/user/user-1', 200, 'getUserPosts'],
      ['get', '/api/posts/post-1', 200, 'getPostById'],
      ['delete', '/api/posts/post-1', 200, 'deletePost'],
      ['post', '/api/posts/post-1/like', 200, 'toggleLikePost'],
      ['post', '/api/posts/post-1/comment', 201, 'addComment'],
      ['post', '/api/posts/post-1/share', 201, 'sharePost'],
      ['post', '/api/posts/post-1/send', 200, 'sendPost']
    ];

    for (const [method, path, expectedStatus, routeName] of cases) {
      const response = await request(app)[method](path).set('Authorization', protectedAuth);
      expect(response.status).toBe(expectedStatus);
      expect(response.body.route).toBe(routeName);
    }
  });

  test('connection routes require auth and hit every endpoint', async () => {
    const { default: app } = await loadApp();

    const unauthorized = await request(app).get('/api/connections/requests');
    expect(unauthorized.status).toBe(401);

    const cases = [
      ['post', '/api/connections/request/user-2', 201, 'sendConnectionRequest'],
      ['patch', '/api/connections/request/connection-1/respond', 200, 'respondToConnectionRequest'],
      ['delete', '/api/connections/connection-1', 200, 'removeConnection'],
      ['get', '/api/connections/requests', 200, 'getConnectionRequests'],
      ['get', '/api/connections/my-connections', 200, 'getUserConnections'],
      ['get', '/api/connections/suggestions', 200, 'getConnectionSuggestions'],
      ['get', '/api/connections/stats', 200, 'getNetworkStats']
    ];

    for (const [method, path, expectedStatus, routeName] of cases) {
      const response = await request(app)[method](path).set('Authorization', protectedAuth);
      expect(response.status).toBe(expectedStatus);
      expect(response.body.route).toBe(routeName);
    }
  });

  test('message routes require auth and hit every endpoint', async () => {
    const { default: app } = await loadApp();

    const unauthorized = await request(app).get('/api/messages/conversations');
    expect(unauthorized.status).toBe(401);

    const cases = [
      ['get', '/api/messages/conversations', 200, 'getConversations'],
      ['get', '/api/messages/conversations/user-2', 200, 'getOrCreateConversation'],
      ['get', '/api/messages/unread-count', 200, 'getUnreadCount'],
      ['get', '/api/messages/conversation-1/messages', 200, 'getMessages'],
      ['post', '/api/messages/conversation-1/messages', 201, 'sendMessage'],
      ['put', '/api/messages/messages/message-1', 200, 'editMessage'],
      ['delete', '/api/messages/messages/message-1', 200, 'deleteMessage'],
      ['patch', '/api/messages/conversation-1/read', 200, 'markMessagesAsRead']
    ];

    for (const [method, path, expectedStatus, routeName] of cases) {
      const response = await request(app)[method](path).set('Authorization', protectedAuth);
      expect(response.status).toBe(expectedStatus);
      expect(response.body.route).toBe(routeName);
    }
  });

  test('public jobs route is public and returns success', async () => {
    const { default: app } = await loadApp();

    const response = await request(app).get('/api/jobs/public');
    expect(response.status).toBe(200);
    expect(response.body.route).toBe('getPublicJobs');
  });
});