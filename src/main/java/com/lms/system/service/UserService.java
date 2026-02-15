package com.lms.system.service;

import com.lms.system.model.User;
import com.lms.system.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.concurrent.ExecutionException;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public User getUserByEmail(String email) throws ExecutionException, InterruptedException {
        return userRepository.findByEmail(email);
    }

    public User getUserById(String userId) throws ExecutionException, InterruptedException {
        return userRepository.findById(userId);
    }

    public void updateUser(User user) throws ExecutionException, InterruptedException {
        userRepository.update(user);
    }

    public java.util.List<User> getAllUsers() throws ExecutionException, InterruptedException {
        return userRepository.findAll();
    }

    public void deleteUser(String userId) throws ExecutionException, InterruptedException {
        userRepository.delete(userId);
    }
}
