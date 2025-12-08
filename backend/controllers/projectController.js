const Project = require('../models/Project');
const sharp = require("sharp");
const path = require('path');

// ======================================================
// CREATE PROJECT
// ======================================================
exports.createProject = async (req, res) => {
  try {
    const { title, description, location, areaHectares, cropType, startDate, endDate, metadata } = req.body;

    if (!title) return res.status(400).json({ message: 'title is required' });

    const owner = req.user?.id || req.body.owner;
    if (!owner) return res.status(400).json({ message: 'owner is required' });

    const project = new Project({
      title,
      description,
      owner,
      location,
      areaHectares,
      cropType,
      startDate,
      endDate,
      metadata,
    });

    await project.save();
    return res.status(201).json({ project });

  } catch (err) {
    console.error('createProject error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ======================================================
// GET PROJECT LIST
// ======================================================
exports.getProjects = async (req, res) => {
  try {
    const filter = {};
    if (req.query.owner) filter.owner = req.query.owner;
    if (req.query.status) filter.status = req.query.status;

    const projects = await Project.find(filter)
      .populate('owner', 'name email role')
      .sort({ createdAt: -1 });

    return res.json({ count: projects.length, projects });

  } catch (err) {
    console.error('getProjects error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ======================================================
// GET SINGLE PROJECT
// ======================================================
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email role');

    if (!project) return res.status(404).json({ message: 'Project not found' });

    return res.json({ project });

  } catch (err) {
    console.error('getProjectById error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ======================================================
// UPLOAD PROJECT IMAGE  (FINAL & CLEANED VERSION)
// ======================================================
exports.uploadProjectImage = async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findById(projectId);

    if (!project) return res.status(404).json({ message: "Project not found" });

    // Authorization
    if (req.user && req.user.role !== "admin" && project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!req.file) return res.status(400).json({ message: "No image uploaded" });

    const { latitude, longitude, timestamp, description } = req.body;

    // Paths
    const uploadsDir = path.join(__dirname, "..", "uploads");
    const thumbnailName = `thumb-${req.file.filename}`;
    const thumbnailPath = path.join(uploadsDir, thumbnailName);

    // Create thumbnail
    await sharp(req.file.path)
      .resize(300)
      .jpeg({ quality: 70 })
      .toFile(thumbnailPath);

    // Read image dimensions
    const metadata = await sharp(req.file.path).metadata();

    const imageData = {
      filename: req.file.filename,
      url: `/uploads/${req.file.filename}`,
      thumbnailUrl: `/uploads/${thumbnailName}`,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      width: metadata.width,
      height: metadata.height,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      capturedAt: timestamp ? new Date(timestamp) : null,
      uploadedAt: new Date(),
      description: description || null,
    };

    project.images.push(imageData);
    await project.save();

    return res.json({
      message: "Image uploaded successfully",
      image: imageData,
    });

  } catch (err) {
    console.error("uploadProjectImage error", err);
    return res.status(500).json({ message: "Error uploading image", error: err.message });
  }
};

// ======================================================
// DELETE PROJECT
// ======================================================
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (req.user && req.user.role !== 'admin' && project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await project.deleteOne();
    return res.json({ message: 'Project deleted' });

  } catch (err) {
    console.error('deleteProject error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ======================================================
// UPDATE PROJECT (PATCH)
// ======================================================
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Only admin can update project status
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    // Update allowed fields
    const { status, title, description, location, areaHectares, cropType, startDate, endDate } = req.body;

    if (status) project.status = status;
    if (title) project.title = title;
    if (description) project.description = description;
    if (location) project.location = location;
    if (areaHectares) project.areaHectares = areaHectares;
    if (cropType) project.cropType = cropType;
    if (startDate) project.startDate = startDate;
    if (endDate) project.endDate = endDate;

    await project.save();
    return res.json({ message: 'Project updated successfully', project });

  } catch (err) {
    console.error('updateProject error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Upload image and attach to project.images
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const projectId = req.params.id;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const requester = req.user;
    if (requester && requester.role !== 'admin' && project.owner.toString() !== requester.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // build image metadata
    const file = req.file;
    const host = req.get('host');
    const protocol = req.protocol;
    const url = `${protocol}://${host}/uploads/${file.filename}`;

    const imageMeta = {
      filename: file.originalname,
      url,
      thumbnailUrl: null,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      width: null,
      height: null,
      uploadedAt: new Date(),
      description: req.body.description || '',
    };

    project.images = project.images || [];
    project.images.push(imageMeta);
    await project.save();

    return res.status(201).json({ image: imageMeta });
  } catch (err) {
    console.error('uploadImage error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
