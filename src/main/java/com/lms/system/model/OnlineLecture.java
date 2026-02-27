package com.lms.system.model;

import lombok.Data;
import java.util.Date;

@Data
public class OnlineLecture {
    private String id;
    private String title;
    private String description;
    private Date dateTime;
    private String degreeId;
    private String moduleId; // Using moduleId/courseId
    private String lecturerId;
    private String meetingLink;
    private String status; // UPCOMING, COMPLETED, CANCELLED
}
