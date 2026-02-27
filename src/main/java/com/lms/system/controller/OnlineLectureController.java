package com.lms.system.controller;

import com.lms.system.model.OnlineLecture;
import com.lms.system.service.OnlineLectureService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/lectures")
public class OnlineLectureController {

    @Autowired
    private OnlineLectureService lectureService;

    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    @PostMapping
    public ResponseEntity<?> scheduleLecture(@RequestBody OnlineLecture lecture) {
        return ResponseEntity.ok(lectureService.scheduleLecture(lecture));
    }

    @GetMapping
    public ResponseEntity<?> getAllLectures() {
        try {
            return ResponseEntity.ok(lectureService.getAllLectures());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/degree/{degreeId}")
    public ResponseEntity<?> getLecturesByDegree(@PathVariable String degreeId) {
        try {
            return ResponseEntity.ok(lectureService.getLecturesByDegree(degreeId));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteLecture(@PathVariable String id) {
        lectureService.deleteLecture(id);
        return ResponseEntity.ok().build();
    }
}
