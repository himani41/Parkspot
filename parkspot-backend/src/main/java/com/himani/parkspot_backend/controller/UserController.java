package com.himani.parkspot_backend.controller;

import com.himani.parkspot_backend.exception.NotFoundException;
import com.himani.parkspot_backend.model.User;
import com.himani.parkspot_backend.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public record ProfileResponse(String name, String email) {}

    @GetMapping("/me")
    public ProfileResponse me(Authentication authentication) {
        User user = userRepository.findById(authentication.getName())
                .orElseThrow(() -> new NotFoundException("User not found"));
        return new ProfileResponse(user.getName(), user.getEmail());
    }
}