package com.lms.system.model;

import lombok.Data;
import java.util.Date;

@Data
public class CourseMaterial {
    private String id;
    private String courseId;
    private String type; // LECTURE_VIDEO, SLIDE, SUPPORTING_DOC
    private String title;
    private String description;
    private String fileUrl;
    private String thumbnailUrl;
    private Date createdAt = new Date();
}
