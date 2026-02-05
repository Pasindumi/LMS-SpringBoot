package com.lms.service;

import com.google.api.core .ApiFuture;
import com.google.cloud.firestore.*;
import com.lms.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
public class UserService {

    @Autowired
    private Firestore firestore;

    private static final String COLLECTION_NAME = "users";

    public String saveUser(User user) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document();
        user.setId(docRef.getId());
        ApiFuture<WriteResult> result = docRef.set(user);
        return result.get().getUpdateTime().toString();
    }

    public User getUser(String id) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(id);
        ApiFuture<DocumentSnapshot> future = docRef.get();
        DocumentSnapshot document = future.get();
        if (document.exists()) {
            return document.toObject(User.class);
        }
        return null;
    }

    public List<User> getAllUsers() throws ExecutionException, InterruptedException {
        List<User> userList = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        for (QueryDocumentSnapshot document : documents) {
            userList.add(document.toObject(User.class));
        }
        return userList;
    }

    public String deleteUser(String id) {
        firestore.collection(COLLECTION_NAME).document(id).delete();
        return "User with ID " + id + " has been deleted";
    }
}
