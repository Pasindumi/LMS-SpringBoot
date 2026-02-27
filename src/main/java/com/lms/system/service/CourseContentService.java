package com.lms.system.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import com.google.firebase.cloud.FirestoreClient;
import com.lms.system.model.CourseMaterial;
import com.lms.system.model.ContentProgress;
import com.lms.system.model.GradeSheet;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CourseContentService {

    private static final String MATERIALS_COLLECTION = "course_materials";
    private static final String PROGRESS_COLLECTION = "content_progress";
    private static final String GRADES_COLLECTION = "grade_sheets";

    // --- Materials ---
    public CourseMaterial addMaterial(CourseMaterial material) {
        try {
            if (material.getId() == null) material.setId(UUID.randomUUID().toString());
            Firestore db = FirestoreClient.getFirestore();
            db.collection(MATERIALS_COLLECTION).document(material.getId()).set(material).get();
            return material;
        } catch (Exception e) {
            throw new RuntimeException("Failed to add material", e);
        }
    }

    public List<CourseMaterial> getMaterialsByCourseId(String courseId) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            ApiFuture<QuerySnapshot> future = db.collection(MATERIALS_COLLECTION).whereEqualTo("courseId", courseId).get();
            return future.get().toObjects(CourseMaterial.class);
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    public void deleteMaterial(String id) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            db.collection(MATERIALS_COLLECTION).document(id).delete().get();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // --- Progress ---
    public void markProgress(ContentProgress progress) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            String id = progress.getStudentId() + "_" + progress.getContentId();
            progress.setId(id);
            db.collection(PROGRESS_COLLECTION).document(id).set(progress).get();
        } catch (Exception e) {
            throw new RuntimeException("Failed to mark progress", e);
        }
    }

    public List<ContentProgress> getProgressByStudent(String studentId) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            ApiFuture<QuerySnapshot> future = db.collection(PROGRESS_COLLECTION).whereEqualTo("studentId", studentId).get();
            return future.get().toObjects(ContentProgress.class);
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    // --- Grade Sheets ---
    public GradeSheet addGradeSheet(GradeSheet sheet) {
        try {
            if (sheet.getId() == null) sheet.setId(UUID.randomUUID().toString());
            Firestore db = FirestoreClient.getFirestore();
            db.collection(GRADES_COLLECTION).document(sheet.getId()).set(sheet).get();
            return sheet;
        } catch (Exception e) {
            throw new RuntimeException("Failed to add grade sheet", e);
        }
    }

    public List<GradeSheet> getGradeSheetsByCourseId(String courseId) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            ApiFuture<QuerySnapshot> future = db.collection(GRADES_COLLECTION).whereEqualTo("courseId", courseId).get();
            return future.get().toObjects(GradeSheet.class).stream()
                    .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }
    
    public void deleteGradeSheet(String id) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            db.collection(GRADES_COLLECTION).document(id).delete().get();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
