package com.lms.controller;

import com.google.cloud.firestore.Firestore;
import com.lms.model.User;
import com.lms.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/test")
public class TestController {

    @Autowired
    private Firestore firestore;

    @Autowired
    private UserService userService;

    @GetMapping("/firebase")
    public String testFirebase() {
        if (firestore != null) {
            return "Firebase Firestore is configured correctly!";
        } else {
            return "Firebase Firestore configuration failed.";
        }
    }

    @PostMapping("/users")
    public String createUser(@RequestBody User user) throws ExecutionException, InterruptedException {
        return userService.saveUser(user);
    }

    @GetMapping("/users/{id}")
    public User getUser(@PathVariable String id) throws ExecutionException, InterruptedException {
        return userService.getUser(id);
    }

    @GetMapping("/users")
    public List<User> getAllUsers() throws ExecutionException, InterruptedException {
        return userService.getAllUsers();
    }

    @DeleteMapping("/users/{id}")
    public String deleteUser(@PathVariable String id) {
        return userService.deleteUser(id);
    }
}
