package com.lms.system.model;

import lombok.Data;
import java.util.Date;

@Data
public class GradeSheet {
    private String id;
    private String courseId;
    private String title;
    private String fileUrl;
    private Date createdAt = new Date();
}
