package com.lms.system.model;

import lombok.Data;
import java.util.Date;

@Data
public class Announcement {
    private String id;
    private String title;
    private String content;
    private Date timestamp;
    private String authorId;
    private String courseId;
    private String imageUrl;
}
