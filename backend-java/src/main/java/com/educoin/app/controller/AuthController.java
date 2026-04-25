package com.educoin.app.controller;

import com.educoin.app.model.LoginRequest;
import com.educoin.app.model.LoginResponse;
import com.educoin.app.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "ok", true,
                "app", "EduCoin Java API"
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/dashboard/{role}")
    public ResponseEntity<Map<String, Object>> dashboard(@PathVariable String role) {
        return ResponseEntity.ok(Map.of(
                "role", role,
                "coins", switch (role.toLowerCase()) {
                    case "student" -> 340;
                    case "teacher" -> 1240;
                    case "director" -> 5420;
                    case "admin" -> 9999;
                    default -> 750;
                },
                "message", "EduCoin mobil dashboard ma'lumotlari"
        ));
    }
}
