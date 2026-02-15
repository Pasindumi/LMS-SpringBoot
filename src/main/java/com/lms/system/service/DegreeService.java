package com.lms.system.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import com.google.firebase.cloud.FirestoreClient;
import com.lms.system.model.Degree;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.concurrent.ExecutionException;

@Service
public class DegreeService {

    private static final String COLLECTION_NAME = "degrees";

    public List<Degree> getAllDegrees() {
        try {
            Firestore db = FirestoreClient.getFirestore();
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME).get();
            List<QueryDocumentSnapshot> documents = future.get().getDocuments();
            return documents.stream().map(doc -> doc.toObject(Degree.class)).toList();
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    public Degree createDegree(Degree degree) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            if (degree.getId() == null) {
                degree.setId(UUID.randomUUID().toString());
            }
            if(degree.getStatus() == null) degree.setStatus("ACTIVE");
            
            ApiFuture<WriteResult> future = db.collection(COLLECTION_NAME).document(degree.getId()).set(degree);
            future.get();
            return degree;
        } catch (Exception e) {
            throw new RuntimeException("Failed to create degree", e);
        }
    }

    public Degree getDegreeById(String id) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            ApiFuture<DocumentSnapshot> future = db.collection(COLLECTION_NAME).document(id).get();
            DocumentSnapshot document = future.get();
            if (document.exists()) {
                return document.toObject(Degree.class);
            }
            return null;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public Degree updateDegree(String id, Degree updatedDegree) {
        try {
            Degree existing = getDegreeById(id);
            if (existing != null) {
                updatedDegree.setId(id);
                if(updatedDegree.getCourseIds() == null || updatedDegree.getCourseIds().isEmpty()) {
                    updatedDegree.setCourseIds(existing.getCourseIds());
                }
                
                Firestore db = FirestoreClient.getFirestore();
                ApiFuture<WriteResult> future = db.collection(COLLECTION_NAME).document(id).set(updatedDegree);
                future.get();
                return updatedDegree;
            }
            return null;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public void deleteDegree(String id) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            ApiFuture<WriteResult> future = db.collection(COLLECTION_NAME).document(id).delete();
            future.get();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void addCourseToDegree(String degreeId, String courseId) {
        try {
            Degree degree = getDegreeById(degreeId);
            if (degree != null && !degree.getCourseIds().contains(courseId)) {
                degree.getCourseIds().add(courseId);
                updateDegree(degreeId, degree);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    public List<Degree> searchDegrees(String query) {
        // Inefficient for large datasets, but acceptable for this scale
        return getAllDegrees().stream()
                .filter(d -> d.getName().toLowerCase().contains(query.toLowerCase()) || 
                             d.getFaculty().toLowerCase().contains(query.toLowerCase()))
                .collect(Collectors.toList());
    }
}
