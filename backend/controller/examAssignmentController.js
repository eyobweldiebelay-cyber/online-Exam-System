
const examAssignmentService = require("../services/examAssignmentService");

const getAllAssignments = async (req, res) => {
  try {
    const assignments =
      await examAssignmentService.getAllAssignments();

    return res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments,
    });
  } catch (error) {
    console.error("Get assignments error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve assignments",
    });
  }
};

const getAssignmentsByStudentId = async (req, res) => {
  try {
    const studentId = Number(req.params.studentId);

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    const assignments =
      await examAssignmentService.getAssignmentsByStudentId(studentId);

    return res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments,
    });
  } catch (error) {
    console.error("Get student assignments error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve student assignments",
    });
  }
};

const createAssignment = async (req, res) => {
  try {
    const examId = Number(req.body.exam_id);
    const studentId = Number(req.body.student_id);

    // Obtain the administrator's ID from authenticated user data.
    const assignedBy = req.user?.id ?? req.user?.user_id;

    if (!Number.isInteger(examId) || examId <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid exam_id is required",
      });
    }

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid student_id is required",
      });
    }

    if (!Number.isInteger(Number(assignedBy)) || Number(assignedBy) <= 0) {
      return res.status(401).json({
        success: false,
        message: "Authenticated administrator ID is missing",
      });
    }

    const assignment =
      await examAssignmentService.createAssignment(
        examId,
        studentId,
        Number(assignedBy)
      );

    return res.status(201).json({
      success: true,
      message: "Exam assigned successfully",
      data: assignment,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "This exam may already be assigned to this student",
      });
    }

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        success: false,
        message: "The exam, student, or administrator does not exist",
      });
    }

    console.error("Create assignment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to assign exam",
    });
  }
};

const deleteAssignment = async (req, res) => {
  try {
    const assignmentId = Number(req.params.id);

    if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    const deleted =
      await examAssignmentService.deleteAssignment(assignmentId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Assignment removed successfully",
    });
  } catch (error) {
    console.error("Delete assignment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove assignment",
    });
  }
};

module.exports = {
  getAllAssignments,
  getAssignmentsByStudentId,
  createAssignment,
  deleteAssignment,
};
