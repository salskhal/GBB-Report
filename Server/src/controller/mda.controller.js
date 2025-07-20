import mdaService from "../service/mdaService.js";

// Get all MDAs
export const getAllMDAs = async (req, res) => {
  try {
    const mdas = await mdaService.getAllMDAs();
    res.status(200).json({
      success: true,
      count: mdas.length,
      data: mdas,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get MDA by ID
export const getMDA = async (req, res) => {
  try {
    const mda = await mdaService.getMDAById(req.params.id);
    res.status(200).json({
      success: true,
      data: mda,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create new MDA
// @route   POST /api/mdas
// @access  Private (Admin only)
export const createNewMDA = async (req, res) => {
  try {
    const mda = await mdaService.createMDA(req.body);
    res.status(201).json({
      success: true,
      message: "MDA created successfully",
      data: mda,
    });
  } catch (error) {
    if (error.message === "MDA name already exists") {
      return res.status(400).json({
        success: false,
        message: "MDA name already exists",
      });
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Update MDA
// @route   PUT /api/mdas/:id
// @access  Private (Admin only)
export const updateMDA = async (req, res) => {
  try {
    const mda = await mdaService.updateMDA(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: "MDA updated successfully",
      data: mda,
    });
  } catch (error) {
    if (error.message === "MDA not found") {
      return res.status(404).json({
        success: false,
        message: "MDA not found",
      });
    }

    if (error.message === "MDA name already exists") {
      return res.status(400).json({
        success: false,
        message: "MDA name already exists",
      });
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Delete MDA (soft delete)
// @route   DELETE /api/mdas/:id
// @access  Private (Admin only)
export const deleteMDA = async (req, res) => {
  try {
    const result = await mdaService.deleteMDA(req.params.id);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    if (error.message === "MDA not found") {
      return res.status(404).json({
        success: false,
        message: "MDA not found",
      });
    }

    if (error.message.includes("Cannot delete MDA with active users")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
