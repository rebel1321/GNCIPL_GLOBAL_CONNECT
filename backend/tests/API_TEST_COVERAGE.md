# Backend API Test Coverage

This file tracks endpoint coverage against the required API test strategy.

Legend:
- ✅ Covered
- ⚠️ Partial (covered at route level, missing real controller/input branch)

## Auth API (`/api/auth`)

| Endpoint | Success | Validation | Auth | Error |
| --- | --- | --- | --- | --- |
| POST `/register` | ✅ (`authController.test.js`) | ✅ missing fields/invalid email/password/role | N/A | ✅ duplicate email |
| POST `/login` | ✅ valid login | ✅ missing fields/invalid email | N/A | ✅ invalid credentials |
| GET `/me` | ✅ (`apiRoutes.test.js`) | N/A | ✅ requires token | ⚠️ no forced controller exception case |
| POST `/logout` | ✅ (`authController.test.js`) | N/A | ✅ requires token | ⚠️ no forced controller exception case |
| PUT `/change-password` | ✅ valid change | ✅ missing fields/short password | ✅ requires token (`apiRoutes.test.js`) | ⚠️ no forced controller exception case |

## User API (`/api/users`)

| Endpoint | Success | Validation | Auth | Error |
| --- | --- | --- | --- | --- |
| GET `/profile` | ✅ (`apiRoutes.test.js`) | N/A | ✅ requires token/role | ⚠️ no controller error branch test |
| GET `/profile/:userId` | ✅ | ⚠️ no invalid ObjectId branch yet | ✅ | ⚠️ no controller error branch test |
| PUT `/profile` | ✅ | ⚠️ no invalid body branch yet | ✅ | ⚠️ no controller error branch test |
| POST `/profile-pic` | ✅ | ⚠️ no missing file/type branch yet | ✅ | ⚠️ no controller error branch test |
| POST `/resume` | ✅ | ⚠️ no file validation branch yet | ✅ | ⚠️ no controller error branch test |
| DELETE `/resume` | ✅ | N/A | ✅ | ⚠️ no controller error branch test |
| GET `/jobs` | ✅ | N/A | ✅ | ⚠️ no controller error branch test |
| POST `/apply/:jobId` | ✅ | ⚠️ no invalid jobId/body branch yet | ✅ | ⚠️ no controller error branch test |
| GET `/applications` | ✅ | N/A | ✅ | ⚠️ no controller error branch test |
| POST `/connect/:targetUserId` | ✅ | ⚠️ no invalid target branch yet | ✅ | ⚠️ no controller error branch test |
| PUT `/connection-requests/:requestId` | ✅ | ⚠️ no invalid action branch yet | ✅ | ⚠️ no controller error branch test |
| GET `/dashboard-stats` | ✅ | N/A | ✅ | ⚠️ no controller error branch test |
| GET `/saved-jobs` | ✅ | N/A | ✅ | ⚠️ no controller error branch test |
| POST `/jobs/:jobId/save` | ✅ | ⚠️ no invalid jobId branch yet | ✅ | ⚠️ no controller error branch test |

## Recruiter API (`/api/recruiters`)

| Endpoint | Success | Validation | Auth | Error |
| --- | --- | --- | --- | --- |
| GET `/profile` | ✅ (`apiRoutes.test.js`) | N/A | ✅ role-protected | ⚠️ no controller error branch test |
| PUT `/profile` | ✅ | ⚠️ no invalid body branch yet | ✅ | ⚠️ no controller error branch test |
| POST `/logo` | ✅ | ⚠️ no missing/invalid file branch yet | ✅ | ⚠️ no controller error branch test |
| GET `/stats` | ✅ | N/A | ✅ | ⚠️ no controller error branch test |
| POST `/jobs` | ✅ | ⚠️ no invalid payload branch yet | ✅ | ⚠️ no controller error branch test |
| GET `/jobs` | ✅ | N/A | ✅ | ⚠️ no controller error branch test |
| GET `/jobs/:jobId` | ✅ | ⚠️ no invalid jobId branch yet | ✅ | ⚠️ no controller error branch test |
| PUT `/jobs/:jobId` | ✅ | ⚠️ no invalid payload branch yet | ✅ | ⚠️ no controller error branch test |
| DELETE `/jobs/:jobId` | ✅ | ⚠️ no invalid jobId branch yet | ✅ | ⚠️ no controller error branch test |
| PATCH `/jobs/:jobId/toggle-status` | ✅ | ⚠️ no invalid jobId branch yet | ✅ | ⚠️ no controller error branch test |
| GET `/applications` | ✅ | N/A | ✅ | ⚠️ no controller error branch test |
| GET `/jobs/:jobId/applications` | ✅ | ⚠️ no invalid jobId branch yet | ✅ | ⚠️ no controller error branch test |
| PATCH `/applications/:applicationId/status` | ✅ | ⚠️ no invalid status branch yet | ✅ | ⚠️ no controller error branch test |
| PUT `/applications/:applicationId` | ✅ | ⚠️ no invalid status branch yet | ✅ | ⚠️ no controller error branch test |
| POST `/saved-candidates/:userId` | ✅ | ⚠️ no invalid userId branch yet | ✅ | ⚠️ no controller error branch test |
| DELETE `/saved-candidates/:userId` | ✅ | ⚠️ no invalid userId branch yet | ✅ | ⚠️ no controller error branch test |

## Post API (`/api/posts`)

| Endpoint | Success | Validation | Auth | Error |
| --- | --- | --- | --- | --- |
| POST `/` | ✅ (`apiRoutes.test.js`) | ⚠️ no missing content/file branch yet | ✅ | ⚠️ no controller error branch test |
| GET `/feed` | ✅ | N/A | ✅ | ⚠️ no controller error branch test |
| GET `/user/:userId` | ✅ | ⚠️ no invalid userId branch yet | ✅ | ⚠️ no controller error branch test |
| GET `/:postId` | ✅ | ⚠️ no invalid postId branch yet | ✅ | ⚠️ no controller error branch test |
| DELETE `/:postId` | ✅ | ⚠️ no invalid postId branch yet | ✅ | ⚠️ no controller error branch test |
| POST `/:postId/like` | ✅ | ⚠️ no invalid postId branch yet | ✅ | ⚠️ no controller error branch test |
| POST `/:postId/comment` | ✅ | ⚠️ no missing content branch yet | ✅ | ⚠️ no controller error branch test |
| POST `/:postId/share` | ✅ | ⚠️ no invalid payload branch yet | ✅ | ⚠️ no controller error branch test |
| POST `/:postId/send` | ✅ | ⚠️ no invalid payload branch yet | ✅ | ⚠️ no controller error branch test |

## Connection API (`/api/connections`)

| Endpoint | Success | Validation | Auth | Error |
| --- | --- | --- | --- | --- |
| POST `/request/:recipientId` | ✅ (`apiRoutes.test.js`) | ⚠️ no self-request/invalid ID branch yet | ✅ | ⚠️ no controller error branch test |
| PATCH `/request/:connectionId/respond` | ✅ | ⚠️ no invalid action branch yet | ✅ | ⚠️ no controller error branch test |
| DELETE `/:connectionId` | ✅ | ⚠️ no invalid ID branch yet | ✅ | ⚠️ no controller error branch test |
| GET `/requests` | ✅ | N/A | ✅ | ⚠️ no controller error branch test |
| GET `/my-connections` | ✅ | ⚠️ no invalid query branch yet | ✅ | ⚠️ no controller error branch test |
| GET `/suggestions` | ✅ | N/A | ✅ | ⚠️ no controller error branch test |
| GET `/stats` | ✅ | N/A | ✅ | ⚠️ no controller error branch test |

## Message API (`/api/messages`)

| Endpoint | Success | Validation | Auth | Error |
| --- | --- | --- | --- | --- |
| GET `/conversations` | ✅ (`apiRoutes.test.js`) | N/A | ✅ | ⚠️ no controller error branch test |
| GET `/conversations/:participantId` | ✅ | ⚠️ no self-message/non-connection branch yet | ✅ | ⚠️ no controller error branch test |
| GET `/unread-count` | ✅ | N/A | ✅ | ⚠️ no controller error branch test |
| GET `/:conversationId/messages` | ✅ | ⚠️ no invalid conversation branch yet | ✅ | ⚠️ no controller error branch test |
| POST `/:conversationId/messages` | ✅ | ⚠️ no missing content branch yet | ✅ | ⚠️ no controller error branch test |
| PUT `/messages/:messageId` | ✅ | ⚠️ no invalid body branch yet | ✅ | ⚠️ no controller error branch test |
| DELETE `/messages/:messageId` | ✅ | ⚠️ no invalid message branch yet | ✅ | ⚠️ no controller error branch test |
| PATCH `/:conversationId/read` | ✅ | ⚠️ no invalid conversation branch yet | ✅ | ⚠️ no controller error branch test |

## Public Jobs API (`/api/jobs`)

| Endpoint | Success | Validation | Auth | Error |
| --- | --- | --- | --- | --- |
| GET `/public` | ✅ (`publicController.test.js`, `apiRoutes.test.js`) | ⚠️ no invalid query branch yet | N/A (public route) | ✅ DB failure path covered |

## Notes

- Route-level endpoint coverage is broad via `apiRoutes.test.js`.
- Deep validation and error branches are currently strongest for auth and public jobs.
- Next expansion should prioritize replacing ⚠️ items with controller-level tests per endpoint group.
