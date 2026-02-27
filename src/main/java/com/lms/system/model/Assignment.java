package com.lms.system.model;

import lombok.Data;
import java.util.Date;

@Data
public class Assignment {
    private String id;
    private String courseId;
    private String title;
    private String description;
    private Object deadline; // Changed from String to Object to handle Firestore Timestamp
    private int totalMarks;
    private String attachmentUrl;
    private String allowedFileTypes; // "pdf,docx,zip" etc.
    private Date createdAt = new Date();
    
    // Custom getter to handle Timestamp conversion for JSON serialization
    public String getDeadline() {
        if (deadline instanceof com.google.cloud.Timestamp) {
            return ((com.google.cloud.Timestamp) deadline).toSqlTimestamp().toLocalDateTime().toString();
        }
        return deadline != null ? deadline.toString() : null;
    }
    
    // Future: List<Submission> submissions;
}
