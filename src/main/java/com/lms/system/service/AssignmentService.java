package com.lms.system.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import com.google.firebase.cloud.FirestoreClient;
import com.lms.system.model.Assignment;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AssignmentService {

    private static final String COLLECTION_NAME = "assignments";

    public List<Assignment> getAssignmentsByCourseId(String courseId) {
        try {
             Firestore db = FirestoreClient.getFirestore();
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME).whereEqualTo("courseId", courseId).get();
            return future.get().getDocuments().stream().map(doc -> doc.toObject(Assignment.class)).collect(Collectors.toList());
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    public Assignment getAssignmentById(String id) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            return db.collection(COLLECTION_NAME).document(id).get().get().toObject(Assignment.class);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public Assignment createAssignment(Assignment assignment) {
        try {
            if (assignment.getId() == null) {
                assignment.setId(UUID.randomUUID().toString());
            }
            Firestore db = FirestoreClient.getFirestore();
            ApiFuture<WriteResult> future = db.collection(COLLECTION_NAME).document(assignment.getId()).set(assignment);
            future.get();
            return assignment;
        } catch (Exception e) {
            throw new RuntimeException("Failed to create assignment", e);
        }
    }
    
     public void deleteAssignment(String id) {
        try {
             Firestore db = FirestoreClient.getFirestore();
             db.collection(COLLECTION_NAME).document(id).delete();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
