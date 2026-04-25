package com.educoin.app.service;

import com.educoin.app.model.LoginRequest;
import com.educoin.app.model.LoginResponse;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {
    private final Map<String, UserSeed> users = new HashMap<>();

    public AuthService() {
        users.put("admin", new UserSeed("admin123", "admin", "Admin User"));
        users.put("director", new UserSeed("director123", "director", "Director User"));
        users.put("teacher", new UserSeed("teacher123", "teacher", "Teacher User"));
        users.put("student", new UserSeed("student123", "student", "Student User"));
    }

    public LoginResponse login(LoginRequest request) {
        if (request == null || request.getUsername() == null || request.getPassword() == null) {
            return new LoginResponse(false, "Username yoki parol yuborilmadi", null, null);
        }

        UserSeed found = users.get(request.getUsername().trim().toLowerCase());
        if (found == null || !found.password.equals(request.getPassword())) {
            return new LoginResponse(false, "Login yoki parol xato", null, null);
        }

        return new LoginResponse(true, "Muvaffaqiyatli login", found.role, found.name);
    }

    private static class UserSeed {
        private final String password;
        private final String role;
        private final String name;

        private UserSeed(String password, String role, String name) {
            this.password = password;
            this.role = role;
            this.name = name;
        }
    }
}
