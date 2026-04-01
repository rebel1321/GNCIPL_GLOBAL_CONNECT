import mongoose from 'mongoose';
import User from '../models/User.js';
import Job from '../models/Job.js';
import JobApplication from '../models/JobApplication.js';
import Connection from '../models/Connection.js';
import { v2 as cloudinary } from 'cloudinary';
// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private (Users only)
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('connections', 'name email profilePic jobTitle location')
      .populate('jobApplications.jobId', 'title company location');

    res.status(200).json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user profile by ID
// @route   GET /api/users/profile/:userId
// @access  Private (Users only)
export const getUserProfileById = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate ObjectId
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const user = await User.findById(userId)
      .select('-password -jobApplications'); // Exclude sensitive data

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get actual connections count from Connection model
    const connectionsCount = await Connection.countDocuments({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' }
      ]
    });

    // Add connections count to user object
    const userWithStats = {
      ...user.toObject(),
      connections: { length: connectionsCount }
    };

    res.status(200).json({
      success: true,
      data: { user: userWithStats }
    });

  } catch (error) {
    console.error('Get user profile by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private (Users only)
export const updateUserProfile = async (req, res) => {
  try {
    const {
      bio,
      jobTitle,
      experience,
      skills,
      education,
      certifications,
      projects
    } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update basic fields
    if (bio !== undefined) user.bio = bio.trim();
    if (jobTitle) user.jobTitle = jobTitle.trim();

    // Update experience
    if (experience && Array.isArray(experience)) {
      user.experience = experience.map(exp => ({
        jobTitle: exp.jobTitle?.trim(),
        company: exp.company?.trim(),
        startDate: exp.startDate,
        endDate: exp.endDate,
        current: exp.current || false,
        description: exp.description?.trim()
      }));
    }

    // Update skills
    if (skills && Array.isArray(skills)) {
      user.skills = skills.map(skill => skill.trim()).filter(skill => skill);
    }

    // Update education
    if (education && Array.isArray(education)) {
      user.education = education.map(edu => ({
        degree: edu.degree?.trim(),
        school: edu.school?.trim(),
        graduationYear: edu.graduationYear,
        fieldOfStudy: edu.fieldOfStudy?.trim()
      }));
    }

    // Update certifications
    if (certifications && Array.isArray(certifications)) {
      user.certifications = certifications.map(cert => ({
        name: cert.name?.trim(),
        issuer: cert.issuer?.trim(),
        issueDate: cert.issueDate,
        expiryDate: cert.expiryDate,
        credentialId: cert.credentialId?.trim()
      }));
    }

    // Update projects
    if (projects && Array.isArray(projects)) {
      user.projects = projects.map(project => ({
        name: project.name?.trim(),
        description: project.description?.trim(),
        technologies: Array.isArray(project.technologies) 
          ? project.technologies.map(tech => tech.trim()).filter(tech => tech)
          : [],
        url: project.url?.trim(),
        startDate: project.startDate,
        endDate: project.endDate
      }));
    }

    // Check if profile is complete
    user.checkProfileComplete();

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Upload profile picture
// @route   POST /api/users/profile-pic
// @access  Private (Users only)
export const uploadProfilePicture = async (req, res) => {
  try {
    console.log('Profile picture upload request received');
    console.log('File info:', req.file);
    console.log('User ID:', req.user?.id);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Please upload JPEG, PNG, or WebP images only.'
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete old profile picture from cloudinary if exists
    if (user.profilePic) {
      const publicId = user.profilePic.split('/').pop().split('.')[0];
      try {
        await cloudinary.uploader.destroy(`profile_pics/${publicId}`);
      } catch (deleteError) {
        console.warn('Could not delete old profile picture:', deleteError);
      }
    }

    // Upload new profile picture to cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'profile_pics',
      width: 200,
      height: 200,
      crop: 'fill',
      gravity: 'face'
    });

    // Update user profile picture URL
    user.profilePic = result.secure_url;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        profilePic: user.profilePic
      }
    });

  } catch (error) {
    console.error('Upload profile picture error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode
    });
    
    res.status(500).json({
      success: false,
      message: 'Server error during image upload',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const uploadResume = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Please upload a resume (PDF)" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Delete old resume from Cloudinary if a prior upload exists
    if (user.resumePublicId) {
      try {
        await cloudinary.uploader.destroy(user.resumePublicId, {
          resource_type: 'raw',
          invalidate: true
        });
      } catch (deleteError) {
        console.warn('Could not delete old resume from Cloudinary:', deleteError);
      }
    }
    
    user.resume = req.file.path;
    user.resumePublicId = req.file.filename;
    user.resumeOriginalName = req.file.originalname;
    user.resumeUploadedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: "Resume uploaded successfully",
      data: {
        resume: user.resume,
        resumeOriginalName: user.resumeOriginalName,
        resumeUploadedAt: user.resumeUploadedAt,
      },
    });
  } catch (error) {
    console.error("Upload resume error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete resume
export const deleteResume = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.resume) return res.status(404).json({ success: false, message: "No resume found" });

    // Delete resume from Cloudinary using saved public ID when available.
    const derivedPublicId = !user.resumePublicId && user.resume
      ? user.resume.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?(?:\?|$)/)?.[1]
      : null;
    const publicId = user.resumePublicId || derivedPublicId;

    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId, {
          resource_type: 'raw',
          invalidate: true
        });
      } catch (deleteError) {
        console.warn('Could not delete resume from Cloudinary:', deleteError);
      }
    }

    user.resume = null;
    user.resumePublicId = null;
    user.resumeOriginalName = null;
    user.resumeUploadedAt = null;
    await user.save();

    res.json({ success: true, message: "Resume deleted" });
  } catch (error) {
    console.error("Delete resume error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get all available jobs
// @route   GET /api/users/jobs
// @access  Private (Users only)
export const getAllJobs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      location, 
      type, 
      level, 
      department,
      salary_min,
      salary_max 
    } = req.query;

    // Build query
    let query = { isActive: true };

    if (search) {
      query.$text = { $search: search };
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    if (level && level !== 'all') {
      query.level = level;
    }

    if (department && department !== 'all') {
      query.department = department;
    }

    if (salary_min || salary_max) {
      query.salary = {};
      if (salary_min) query.salary.$gte = parseInt(salary_min);
      if (salary_max) query.salary.$lte = parseInt(salary_max);
    }

    const jobs = await Job.find(query)
      .populate('recruiterId', 'companyName profileImage location')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalJobs = await Job.countDocuments(query);

    res.status(200).json({
      success: true,
      jobs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalJobs / parseInt(limit)),
        totalJobs
      }
    });

  } catch (error) {
    console.error('Get all jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Apply for a job
// @route   POST /api/users/apply/:jobId
// @access  Private (Users only)
export const applyForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { coverLetter } = req.body;
    const userId = req.user.id;

    console.log('Applying for job:', { jobId, userId, coverLetter });

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
    }

    // Check if user exists and has required profile data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has uploaded resume
    if (!user.resume) {
      return res.status(400).json({
        success: false,
        message: 'Please upload your resume before applying to jobs'
      });
    }

    // Check if job exists and is active
    const job = await Job.findOne({ _id: jobId, isActive: true });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or no longer active'
      });
    }

    console.log('Job found:', { jobTitle: job.title, companyName: job.companyName });

    // Check if already applied
    const existingApplication = await JobApplication.findOne({
      jobId,
      applicantId: userId
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    // Create new job application with explicit field population
    const application = new JobApplication({
      jobId,
      applicantId: userId,
      recruiterId: job.recruiterId,
      applicantName: user.name || 'Unknown',
      applicantEmail: user.email,
      applicantPhone: user.phone || '',
      applicantPhoto: user.profileImage || '',
      resumeUrl: user.resume,
      coverLetter: coverLetter?.trim() || '',
      jobTitle: job.title,
      jobLocation: job.location,
      companyName: job.companyName
    });

    console.log('Creating application with data:', {
      jobId: application.jobId,
      applicantId: application.applicantId,
      recruiterId: application.recruiterId,
      applicantName: application.applicantName,
      jobTitle: application.jobTitle
    });

    await application.save();

    console.log('Application saved successfully:', application._id);

    res.status(200).json({
      success: true,
      message: 'Job application submitted successfully',
      application: {
        _id: application._id,
        jobTitle: application.jobTitle,
        companyName: application.companyName,
        status: application.status,
        appliedAt: application.appliedAt
      }
    });

  } catch (error) {
    console.error('Apply for job error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// @desc    Get user's job applications
// @route   GET /api/users/applications
// @access  Private (Users only)
export const getUserApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    // Build query
    let query = { applicantId: userId };
    if (status && status !== 'all') {
      query.status = status;
    }

    const applications = await JobApplication.find(query)
      .populate('jobId', 'title location salary companyName type level')
      .populate('recruiterId', 'companyName profileImage')
      .sort({ appliedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalApplications = await JobApplication.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        applications,
        totalApplications,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalApplications / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get user applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Send connection request
// @route   POST /api/users/connect/:targetUserId
// @access  Private (Users only)
export const sendConnectionRequest = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const { message } = req.body;

    if (targetUserId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send connection request to yourself'
      });
    }

    const user = await User.findById(req.user.id);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already connected
    if (user.connections.includes(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Already connected with this user'
      });
    }

    // Check if request already sent
    const existingRequest = targetUser.connectionRequests.find(
      req => req.from.toString() === user._id.toString()
    );

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Connection request already sent'
      });
    }

    // Add connection request to target user
    targetUser.connectionRequests.push({
      from: user._id,
      message: message?.trim() || '',
      sentAt: new Date(),
      status: 'pending'
    });

    await targetUser.save();

    res.status(200).json({
      success: true,
      message: 'Connection request sent successfully'
    });

  } catch (error) {
    console.error('Send connection request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Respond to connection request
// @route   PUT /api/users/connection-requests/:requestId
// @access  Private (Users only)
export const respondToConnectionRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use "accept" or "reject"'
      });
    }

    const user = await User.findById(req.user.id);
    const connectionRequest = user.connectionRequests.id(requestId);

    if (!connectionRequest) {
      return res.status(404).json({
        success: false,
        message: 'Connection request not found'
      });
    }

    if (action === 'accept') {
      // Add both users to each other's connections
      user.connections.push(connectionRequest.from);
      
      const requesterUser = await User.findById(connectionRequest.from);
      requesterUser.connections.push(user._id);
      await requesterUser.save();

      connectionRequest.status = 'accepted';
    } else {
      connectionRequest.status = 'rejected';
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `Connection request ${action}ed successfully`
    });

  } catch (error) {
    console.error('Respond to connection request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get user dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user data
    const user = await User.findById(userId);
    
    // Get actual connections count from Connection model
    const connectionsCount = await Connection.countDocuments({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' }
      ]
    });
    
    // Get application count
    const applicationsCount = await JobApplication.countDocuments({ applicantId: userId });
    
    // Get saved jobs count
    const savedJobsCount = user.savedJobs ? user.savedJobs.length : 0;
    
    // Calculate profile completeness
    const profileFields = [
      user.name,
      user.email,
      user.jobTitle,
      user.location,
      user.bio,
      user.skills?.length > 0,
      user.experience?.length > 0,
      user.education?.length > 0,
      user.resume
    ];
    
    const completedFields = profileFields.filter(field => field).length;
    const profileCompleteness = Math.round((completedFields / profileFields.length) * 100);

    res.status(200).json({
      success: true,
      data: {
        connectionsCount: connectionsCount,
        applicationsCount: applicationsCount,
        savedJobsCount: savedJobsCount,
        profileCompleteness: profileCompleteness,
        isProfileComplete: profileCompleteness === 100,
        hasResume: !!user.resume
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard statistics',
      error: error.message
    });
  }
};

// Get saved jobs
export const getSavedJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId)
      .populate({
        path: 'savedJobs',
        populate: {
          path: 'company',
          select: 'name logo'
        },
        options: {
          skip: skip,
          limit: limit,
          sort: { createdAt: -1 }
        }
      });

    const totalSavedJobs = user.savedJobs?.length || 0;
    const totalPages = Math.ceil(totalSavedJobs / limit);

    res.status(200).json({
      success: true,
      data: {
        savedJobs: user.savedJobs || [],
        pagination: {
          currentPage: page,
          totalPages,
          totalJobs: totalSavedJobs,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get saved jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get saved jobs',
      error: error.message
    });
  }
};

// Toggle save job
export const toggleSaveJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const { jobId } = req.params;

    const user = await User.findById(userId);
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const isJobSaved = user.savedJobs?.includes(jobId);

    if (isJobSaved) {
      // Remove from saved jobs
      user.savedJobs = user.savedJobs.filter(id => id.toString() !== jobId);
    } else {
      // Add to saved jobs
      if (!user.savedJobs) user.savedJobs = [];
      user.savedJobs.push(jobId);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: isJobSaved ? 'Job removed from saved list' : 'Job saved successfully',
      data: {
        isSaved: !isJobSaved,
        savedJobsCount: user.savedJobs.length
      }
    });

  } catch (error) {
    console.error('Toggle save job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle save job',
      error: error.message
    });
  }
};