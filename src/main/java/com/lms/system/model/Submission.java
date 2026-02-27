package com.lms.system.model;

import lombok.Data;
import java.util.Date;

@Data
public class Submission {
    private String id;
    private String assignmentId;
    private String studentId;
    private String studentName;
    private String fileUrl;
    private Date submittedAt = new Date();
    private String grade; // Optional: for future grading
    private String feedback; // Optional: for future feedback
}
