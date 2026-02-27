package com.lms.system.model;

import lombok.Data;

@Data
public class ContentProgress {
    private String id; // collection: progress, docId: studentId + "_" + contentId
    private String studentId;
    private String contentId;
    private boolean completed;
}
