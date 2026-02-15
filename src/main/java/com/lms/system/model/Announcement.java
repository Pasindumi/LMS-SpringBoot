package com.lms.system.model;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class Announcement {
    private String id;
    private String title;
    private String content;
    private LocalDateTime timestamp;
    private String authorId;
}
