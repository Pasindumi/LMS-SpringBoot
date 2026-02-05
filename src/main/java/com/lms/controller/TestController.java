package com.lms.controller;

import com.google.cloud.firestore.Firestore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
public class TestController {

    @Autowired
    private Firestore firestore;

    @GetMapping("/firebase")
    public String testFirebase() {
        if (firestore != null) {
            return "Firebase Firestore is configured correctly!";
        } else {
            return "Firebase Firestore configuration failed.";
        }
    }
}
