package com.lms.system.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import com.google.firebase.cloud.FirestoreClient;
import com.lms.system.model.Task;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@Service
public class TaskService {

    private static final String COLLECTION_NAME = "tasks";

    public List<Task> getAllTasks() {
        try {
            Firestore db = FirestoreClient.getFirestore();
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME).get();
            return future.get().getDocuments().stream().map(doc -> doc.toObject(Task.class)).collect(Collectors.toList());
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    public List<Task> getTasksByCourseId(String courseId) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME).whereEqualTo("courseId", courseId).get();
            return future.get().getDocuments().stream().map(doc -> doc.toObject(Task.class)).collect(Collectors.toList());
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    public Task createTask(Task task) {
        try {
            if (task.getId() == null) {
                task.setId(UUID.randomUUID().toString());
            }
            Firestore db = FirestoreClient.getFirestore();
            ApiFuture<WriteResult> future = db.collection(COLLECTION_NAME).document(task.getId()).set(task);
            future.get();
            return task;
        } catch (Exception e) {
            throw new RuntimeException("Failed to create task", e);
        }
    }
    
    public void deleteTask(String taskId) {
        try {
             Firestore db = FirestoreClient.getFirestore();
             db.collection(COLLECTION_NAME).document(taskId).delete();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    // update is same as create (upsert)
}
