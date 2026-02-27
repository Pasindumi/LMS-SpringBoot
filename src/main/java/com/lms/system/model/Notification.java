package com.lms.system.model;

import lombok.Data;
import java.util.Date;

@Data
public class Notification {
    private String id;
    private String userId;
    private String title;
    private String message;
    private Date timestamp;
    private boolean read;
    private String type; // e.g., "LECTURE", "ANNOUNCEMENT", "ASSIGNMENT"
    private String link;
}
