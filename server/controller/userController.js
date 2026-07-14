import User from "../models/User.js";
import JobApplication from "../models/JobApplication.js";
import Job from "../models/Job.js";
import { v2 } from "cloudinary";
import { getOrCreateUser } from "../utils/syncClerkUser.js";

// Get user Data
export const getUserData = async (req, res) => {
  const userId = req.auth.userId;

  if (!userId) {
    return res.json({ success: false, message: "Not authenticated" });
  }

  try {
    const user = await getOrCreateUser(userId);
    res.json({ success: true, user });
  } catch (error) {
    console.log("Error fetching user:", error.message);
    res.json({ success: false, message: error.message });
  }
};

// Apply For a Job
export const applyForJob = async (req, res) => {
  const { jobId } = req.body;
  const userId = req.auth.userId;

  if (!userId) {
    return res.json({ success: false, message: "Not authenticated" });
  }

  try {
    await getOrCreateUser(userId);

    const isAlreadyApplied = await JobApplication.findOne({ userId, jobId });

    if (isAlreadyApplied) {
      return res.json({
        success: false,
        message: "You have already applied for this job",
      });
    }

    const jobData = await Job.findById(jobId);

    if (!jobData) {
      return res.json({ success: false, message: "Job not found" });
    }

    await JobApplication.create({
      companyId: jobData.companyId,
      userId,
      jobId,
      date: Date.now(),
    });

    res.json({ success: true, message: "Applied Successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get User applied applications
export const getUserJobApplications = async (req, res) => {
  try {
    const userId = req.auth.userId;

    if (!userId) {
      return res.json({ success: false, message: "Not authenticated" });
    }

    await getOrCreateUser(userId);

    const applications = await JobApplication.find({ userId })
      .populate("companyId", "name email image")
      .populate("jobId", "title description location level salary")
      .exec();

    if (!applications) {
      return res.json({
        success: false,
        message: "No applications found for this User",
      });
    }

    return res.json({ success: true, applications });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Update User Profile (resume)
export const updateUserResume = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const resumeFile = req.file;

    if (!userId) {
      return res.json({ success: false, message: "Not authenticated" });
    }

    const userData = await getOrCreateUser(userId);

    if (resumeFile) {
      const resumeUpload = await v2.uploader.upload(resumeFile.path);
      userData.resume = resumeUpload.secure_url;
    }
    await userData.save();

    return res.json({ success: true, message: "Resume Updated Successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};