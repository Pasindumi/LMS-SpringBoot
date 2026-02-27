package com.lms.system.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import com.google.firebase.cloud.FirestoreClient;
import com.lms.system.model.Submission;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
public class SubmissionService {

    private static final String COLLECTION_NAME = "submissions";

    public Submission submitAssignment(Submission submission) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            if (submission.getId() == null) {
                // Check if user already submitted for this assignment
                Submission existing = getSubmissionByStudentAndAssignment(submission.getStudentId(), submission.getAssignmentId());
                if (existing != null) {
                    submission.setId(existing.getId());
                } else {
                    submission.setId(UUID.randomUUID().toString());
                }
            }
            submission.setSubmittedAt(new Date());
            
            ApiFuture<WriteResult> future = db.collection(COLLECTION_NAME).document(submission.getId()).set(submission);
            future.get();
            return submission;
        } catch (Exception e) {
            throw new RuntimeException("Failed to submit assignment", e);
        }
    }

    public Submission getSubmissionByStudentAndAssignment(String studentId, String assignmentId) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                    .whereEqualTo("studentId", studentId)
                    .whereEqualTo("assignmentId", assignmentId)
                    .get();
            
            List<Submission> submissions = future.get().toObjects(Submission.class);
            return submissions.isEmpty() ? null : submissions.get(0);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public List<Submission> getSubmissionsByAssignmentId(String assignmentId) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                    .whereEqualTo("assignmentId", assignmentId)
                    .get();
            
            return future.get().toObjects(Submission.class);
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    public List<Submission> getSubmissionsByStudentId(String studentId) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                    .whereEqualTo("studentId", studentId)
                    .get();
            
            return future.get().toObjects(Submission.class);
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }
}
