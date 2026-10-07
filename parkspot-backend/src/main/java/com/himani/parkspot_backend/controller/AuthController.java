package com.himani.parkspot_backend.controller;

import com.himani.parkspot_backend.exception.EmailAlreadyExistsException;
import com.himani.parkspot_backend.exception.InvalidCredentialsException;
import com.himani.parkspot_backend.model.User;
import com.himani.parkspot_backend.repository.UserRepository;
import com.himani.parkspot_backend.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/signup")
    public Map<String,String> signup(@RequestBody SignupRequest request){
        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new EmailAlreadyExistsException("Email already exists");
        }

        User user = new User(null, request.email(), passwordEncoder.encode(request.password()), request.name());
        User saved = userRepository.save(user);

        String token = jwtService.generateToken(user.getId());
        return Map.of("token",token);
    }

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        if(!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        String token = jwtService.generateToken(user.getId());
        return Map.of("token",token);

    }

    public record SignupRequest(String email, String name, String password) {}
    public record LoginRequest(String email, String name, String password) {}


}
