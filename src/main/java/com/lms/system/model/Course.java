package com.lms.system.model;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class Course {
    private String courseId;
    private String title;
    private String description;
    private String instructorId;
    private String category;
    private String degreeId;
    private String courseCode;
    private int semester;
    private int credits;
    private String status; // ACTIVE, ARCHIVED
    private String lecturerId;
    private String lecturerType; // MAIN, ASSISTANT
    private List<String> studentIds = new ArrayList<>();
}
