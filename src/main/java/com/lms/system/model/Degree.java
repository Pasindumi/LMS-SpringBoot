package com.lms.system.model;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class Degree {
    private String id;
    private String name;
    private String faculty;
    private int duration; // in years
    private String description;
    private String status; // ACTIVE, ARCHIVED
    private List<String> courseIds = new ArrayList<>();
}
