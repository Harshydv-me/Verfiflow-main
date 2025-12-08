const User = require('../models/User');

// ======================================================
// GET ALL MARKETPLACE USERS
// ======================================================
exports.getMarketplaceUsers = async (req, res) => {
  try {
    // Fetch only users with role 'marketplaceuser'
    const users = await User.find({ role: 'marketplaceuser' })
      .select('-password') // Exclude password field
      .sort({ createdAt: -1 }); // Sort by newest first

    return res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Error fetching marketplace users:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch marketplace users',
      error: error.message
    });
  }
};

// ======================================================
// GET ALL FARMERS (FIELD OPERATORS)
// ======================================================
exports.getFarmers = async (req, res) => {
  try {
    // Fetch only users with role 'farmer'
    const users = await User.find({ role: 'farmer' })
      .select('-password') // Exclude password field
      .sort({ createdAt: -1 }); // Sort by newest first

    return res.status(200).json({
      success: true,
      count: users.length,
      farmers: users
    });
  } catch (error) {
    console.error('Error fetching farmers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch farmers',
      error: error.message
    });
  }
};

// ======================================================
// DELETE USER BY ID
// ======================================================
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

// ======================================================
// UPDATE USER STATUS (Approve/Reject Farmer)
// ======================================================
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, approved, or rejected'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: `User ${status} successfully`,
      user
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
};

// ======================================================
// UPDATE MARKETPLACE USER VERIFICATION
// ======================================================
exports.updateUserVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { verificationStatus } = req.body;

    // Validate verification status
    if (!['unverified', 'verified'].includes(verificationStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification status. Must be unverified or verified'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { verificationStatus },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: `User verification updated successfully`,
      user
    });
  } catch (error) {
    console.error('Error updating user verification:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user verification',
      error: error.message
    });
  }
};
