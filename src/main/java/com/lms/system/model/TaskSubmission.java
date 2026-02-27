package com.lms.system.model;

import lombok.Data;
import java.util.Date;

@Data
public class TaskSubmission {
    private String id;
    private String taskId;
    private String studentId;
    private String studentName;
    private String fileUrl;
    private Date submittedAt = new Date();
    private String grade;
    private String feedback;
}
