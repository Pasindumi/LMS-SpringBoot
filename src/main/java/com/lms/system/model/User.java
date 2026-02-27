package com.lms.system.model;

import lombok.Data;

@Data
public class User {
    private String userId;
    private String name;
    private String email;
    private String password;
    private String role; // "ADMIN", "INSTRUCTOR", "STUDENT"
    
    // Profile Fields
    private String bio;
    private String specialization;
    private String phoneNumber;
    private String profileImageUrl;
}
