package com.educoin.app.model;

public class LoginResponse {
    private boolean success;
    private String message;
    private String role;
    private String name;

    public LoginResponse(boolean success, String message, String role, String name) {
        this.success = success;
        this.message = message;
        this.role = role;
        this.name = name;
    }

    public boolean isSuccess() {
        return success;
    }

    public String getMessage() {
        return message;
    }

    public String getRole() {
        return role;
    }

    public String getName() {
        return name;
    }
}
