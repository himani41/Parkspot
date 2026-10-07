package com.himani.parkspot_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ParkspotBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(ParkspotBackendApplication.class, args);
	}

}
